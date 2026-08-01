import type { Comparison, Line, Verdict } from "@/domain/reste-a-vivre";
import { JOB_DATASET_VERSION, JOB_ENGINE_VERSION, SNAPSHOT_DATE } from "@/domain/reste-a-vivre";
import { fill, type Dictionary, type Locale } from "@/lib/i18n";
import { formatCurrency, formatSignedCurrency } from "@/lib/formatting";
import { lineBasis, lineLabel, lineReason, statusLabel } from "@/lib/job-text";

/**
 * Takes the result away with the reader: a share image, a PDF and a spreadsheet.
 *
 * The image is **drawn**, not screenshotted. A screenshot of the page would carry
 * whatever happened to be on screen at whatever width; a purpose-built card fits
 * a chat window, stays legible, and cannot accidentally crop the caveat off.
 *
 * Every export carries the same three things the screen carries: the figure, the
 * fact that it is before income tax and benefits, and the snapshot date. An export
 * that dropped those would be the one artefact of this product that overclaims.
 */

const CARD = { width: 1200, height: 630 };

/**
 * The footer disclaimer, chosen by whether the rules engine answered.
 *
 * Shared by the card, the PDF and the spreadsheet: a downloaded file outlives the
 * session it came from, so it must not carry a disclaimer the on-screen result
 * contradicted.
 */
const noteOf = (r: Dictionary["job"]["result"], result: Comparison): string =>
  result.fiscalComputed ? r.verdictNoteFiscal : r.verdictNote;

/** The same statement, cut to the one line a 1200×630 card has room for. */
const cardNoteOf = (r: Dictionary["job"]["result"], result: Comparison): string =>
  result.fiscalComputed ? r.verdictNoteShort : r.verdictNoteShortNone;

type ExportContext = {
  locale: Locale;
  dict: Dictionary;
  result: Comparison;
  verdict: Verdict;
};

function fileStem({ result }: ExportContext): string {
  const slug = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  return `statwise-${slug(result.current.cityName)}-${slug(result.target.cityName)}`;
}

function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  // Revoking immediately can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Reads a CSS custom property so the card matches the site's palette. */
function cssColour(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function wrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) return lines;
    } else {
      line = candidate;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines;
}

/** Draws the share card and hands back a PNG blob. */
export async function buildShareCard(
  context: ExportContext,
  mime: "image/png" | "image/jpeg" = "image/png",
  quality?: number,
): Promise<Blob> {
  const { locale, dict, result, verdict } = context;
  const r = dict.job.result;
  const tiers = dict.job.result.verdictTiers as Record<
    Verdict["tier"],
    { emoji: string; title: string; body: string }
  >;

  const canvas = document.createElement("canvas");
  canvas.width = CARD.width;
  canvas.height = CARD.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  const ink = cssColour("--foreground", "#18343A");
  const muted = "#6b7b7e";
  const accent =
    verdict.tier === "negative"
      ? cssColour("--confidence-low", "#c86a3a")
      : verdict.tier === "modest" || verdict.tier === "marginal"
        ? cssColour("--confidence-medium", "#d0a03a")
        : cssColour("--confidence-high", "#2f8f6a");

  // Background and frame.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, CARD.width, CARD.height);
  ctx.fillStyle = "#f1fbfa";
  ctx.fillRect(0, 0, CARD.width, 8);
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, CARD.width, 8);

  const pad = 72;
  let y = pad + 26;

  ctx.fillStyle = muted;
  ctx.font = "600 22px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(`${dict.brand.name} · ${dict.job.title}`, pad, y);

  y += 62;
  ctx.fillStyle = ink;
  ctx.font = "700 44px system-ui, -apple-system, Segoe UI, sans-serif";
  for (const line of wrap(ctx, tiers[verdict.tier].title, CARD.width - pad * 2, 2)) {
    ctx.fillText(line, pad, y);
    y += 54;
  }

  y += 10;
  const headline = formatSignedCurrency(locale, result.deltaResteAVivre);
  ctx.fillStyle = accent;
  ctx.font = "700 88px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(headline, pad, y + 60);
  // Measured, not a fixed offset: a four-figure amount would otherwise collide
  // with its own unit.
  const headlineWidth = ctx.measureText(headline).width;

  ctx.fillStyle = muted;
  ctx.font = "400 26px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.fillText(r.perMonth, pad + headlineWidth + 16, y + 60);

  y += 132;
  ctx.fillStyle = ink;
  ctx.font = "400 28px system-ui, -apple-system, Segoe UI, sans-serif";
  const route = `${result.current.cityName} · ${result.current.districtName}  →  ${result.target.cityName} · ${result.target.districtName}`;
  ctx.fillText(route, pad, y);

  y += 48;
  ctx.fillStyle = muted;
  ctx.font = "400 24px system-ui, -apple-system, Segoe UI, sans-serif";
  const both =
    `${r.here}: ${formatCurrency(locale, result.current.resteAVivreReel)}` +
    `   ·   ${r.there}: ${formatCurrency(locale, result.target.resteAVivreReel)}`;
  ctx.fillText(both, pad, y);

  y += 44;
  ctx.fillText(
    fill(r.rangeLabel, {
      low: formatSignedCurrency(locale, result.deltaRange.low),
      high: formatSignedCurrency(locale, result.deltaRange.high),
    }),
    pad,
    y,
  );

  /*
    The two things a shared image must never lose — anchored to the bottom edge and
    grown upward from there.

    The previous version started the block at a fixed offset and wrote downward,
    which silently assumed a one-line verdict title and a one-line note. A two-line
    title pushed the flowing content onto the note and the card came out with two
    sentences printed on top of each other. Measuring the block means the gap below
    the last flowing line is whatever is left, never negative.
  */
  const contentBottom = y;
  ctx.font = "400 20px system-ui, -apple-system, Segoe UI, sans-serif";
  const noteLines = wrap(ctx, cardNoteOf(r, result), CARD.width - pad * 2, 2);
  const footerLine = `${r.shareCardFooter} · ${fill(r.snapshotDate, { date: SNAPSHOT_DATE })}`;
  const lineHeight = 26;
  // Baseline of the last line, then step back up one line per note line.
  const footerBaseline = CARD.height - pad + 10;
  let footY = footerBaseline - noteLines.length * lineHeight;
  if (footY - contentBottom < 22) {
    // Nothing to shuffle: say so in the console rather than overprint the card.
    console.warn("share card: footer and content are within 22px", { contentBottom, footY });
  }
  for (const line of noteLines) {
    ctx.fillText(line, pad, footY);
    footY += lineHeight;
  }
  ctx.fillText(footerLine, pad, footY);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Could not encode the card"));
      },
      mime,
      quality,
    );
  });
}

/** The same card, encoded straight to a data URL — used by the PDF. */
async function buildShareCardDataUrl(
  context: ExportContext,
  mime: "image/png" | "image/jpeg",
  quality?: number,
): Promise<string> {
  const blob = await buildShareCard(context, mime, quality);
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read the card"));
    reader.readAsDataURL(blob);
  });
}

export async function downloadShareImage(context: ExportContext): Promise<void> {
  const blob = await buildShareCard(context);
  download(blob, `${fileStem(context)}.png`);
}

export async function downloadPdf(context: ExportContext): Promise<void> {
  const { jsPDF } = await import("jspdf");
  /*
    JPEG, not PNG, for the embedded card: a lossless 1200×630 panel pushed the
    file past 2 MB, which is a poor thing to email. At this size the compression
    is invisible and the file lands around a tenth of that.
  */
  const dataUrl = await buildShareCardDataUrl(context, "image/jpeg", 0.86);

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 28;
  const imgWidth = pageWidth - margin * 2;
  const imgHeight = (imgWidth * CARD.height) / CARD.width;
  doc.addImage(dataUrl, "JPEG", margin, margin, imgWidth, imgHeight);

  // The lines behind the figure, so the PDF is a report and not just a picture.
  const r = context.dict.job.result;
  let y = margin + imgHeight + 34;
  doc.setFontSize(12);
  doc.text(r.breakdownTitle, margin, y);
  doc.setFontSize(9);
  y += 16;

  const rows = tableRows(context);
  for (const row of rows) {
    if (y > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(row.side, margin, y);
    doc.text(row.label, margin + 96, y, { maxWidth: 300 });
    doc.text(row.amount, margin + 420, y, { align: "right" });
    doc.text(row.status, margin + 440, y);
    y += 13;
  }

  if (y > pageHeight - margin - 20) {
    doc.addPage();
    y = margin;
  }
  y += 8;
  doc.setFontSize(8);
  doc.text(
    `${noteOf(r, context.result)}  |  ${fill(r.snapshotDate, { date: SNAPSHOT_DATE })}  |  ${context.dict.brand.name} ${JOB_ENGINE_VERSION} / ${JOB_DATASET_VERSION}`,
    margin,
    y,
    { maxWidth: pageWidth - margin * 2 },
  );

  doc.save(`${fileStem(context)}.pdf`);
}

type Row = { side: string; label: string; amount: string; status: string; basis: string };

/** One flat table used by both the PDF and the spreadsheet. */
function tableRows(context: ExportContext): Row[] {
  const { locale, dict, result } = context;
  const r = dict.job.result;
  const rows: Row[] = [];

  const push = (sideLabel: string, group: string, lines: Line[]) => {
    for (const line of lines) {
      rows.push({
        side: sideLabel,
        label: `${group} — ${lineLabel(locale, dict, line)}`,
        amount: line.amount === null ? "" : String(line.amount),
        status: statusLabel(dict, line.status),
        basis: lineBasis(locale, dict, line) ?? lineReason(locale, dict, line) ?? "",
      });
    }
  };

  for (const [label, side] of [
    [r.here, result.current],
    [r.there, result.target],
  ] as const) {
    push(label, r.revenues, side.revenus);
    push(label, r.expenses, side.depenses);
    push(label, r.real, [side.autres]);
    rows.push({
      side: label,
      label: r.comparable,
      amount: String(side.resteAVivre),
      status: "",
      basis: "",
    });
    rows.push({
      side: label,
      label: r.real,
      amount: String(side.resteAVivreReel),
      status: "",
      basis: "",
    });
  }

  if (result.moveCost) push(r.moveCostTitle, r.moveCostTitle, result.moveCost.lines);
  push(r.omittedTitle, r.omittedTitle, result.omitted);

  return rows;
}

export async function downloadSpreadsheet(context: ExportContext): Promise<void> {
  const XLSX = await import("xlsx");
  const { dict, result, verdict } = context;
  const r = dict.job.result;

  const summary = [
    [dict.brand.name, dict.job.title],
    [r.here, `${result.current.cityName} · ${result.current.districtName}`],
    [r.there, `${result.target.cityName} · ${result.target.districtName}`],
    [r.comparable, result.current.resteAVivre, result.target.resteAVivre],
    [r.real, result.current.resteAVivreReel, result.target.resteAVivreReel],
    ["Δ", result.deltaResteAVivre],
    [
      r.rangeLabel.replace(/\{[a-z]+\}/gi, "").trim(),
      result.deltaRange.low,
      result.deltaRange.high,
    ],
    [
      "%",
      verdict.ratio === null ? "" : Math.round(verdict.ratio * 1000) / 10,
      verdict.signOnly ? r.verdictSignOnly : "",
    ],
    [r.requiredSalaryTitle, result.requiredTargetSalary ?? ""],
    /*
      Row dropped entirely when there is no move to pay for, matching the page.
      A label with a blank beside it reads as zero, unknown or not-applicable
      depending on who is looking, and a spreadsheet outlives the session that
      could have explained which.
    */
    ...(result.moveCost ? [[r.moveCostTotal, result.moveCost.total]] : []),
    [],
    [noteOf(r, result)],
    [fill(r.snapshotDate, { date: SNAPSHOT_DATE })],
    [`${JOB_ENGINE_VERSION} / ${JOB_DATASET_VERSION}`],
  ];

  const rows = tableRows(context);
  const detail = [
    ["", "", r.perMonth, "", ""],
    ...rows.map((row) => [
      row.side,
      row.label,
      row.amount === "" ? "" : Number(row.amount),
      row.status,
      row.basis,
    ]),
  ];

  const waterfall = [
    [r.waterfallTitle],
    ...result.waterfall.map((step) => [
      (r.waterfall as Record<string, string>)[step.key] ?? step.key,
      step.amount,
    ]),
  ];

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(summary), "Synthese");
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(detail), "Detail");
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(waterfall), "Ecart");

  const out = XLSX.write(book, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  download(
    new Blob([out], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `${fileStem(context)}.xlsx`,
  );
}
