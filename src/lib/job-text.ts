import {
  DATA_SOURCES,
  type Explanation,
  type GeoLevel,
  type Line,
  type LineStatus,
  type Num,
  type SourceCode,
  type Translatable,
} from "@/domain/reste-a-vivre";
import { fill, type Dictionary, type Locale } from "@/lib/i18n";
import { formatDecimal } from "@/lib/formatting";

/**
 * Turns what the engine emits into text for the active locale.
 *
 * The engine deliberately produces keys and raw numbers, never sentences. This
 * module is the only place that knows about language, which is what lets the same
 * arithmetic be read in French and in English — and what lets a test assert that
 * no branch of the engine can emit a key neither dictionary carries.
 */

/** The dictionary tables an explanation can be looked up in. */
type Table = "lines" | "basis" | "reasons";

const isNum = (value: string | Num): value is Num => typeof value === "object";

const table = (dict: Dictionary, name: Table): Record<string, string> =>
  dict.job[name] as Record<string, string>;

function render(locale: Locale, dict: Dictionary, name: Table, explanation: Explanation): string {
  // Falling back to the key rather than to an empty string keeps a missing
  // translation visible instead of silently blanking a line.
  const template = table(dict, name)[explanation.key] ?? explanation.key;
  if (!explanation.params) return template;

  const params: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(explanation.params)) {
    params[key] = isNum(value) ? formatDecimal(locale, value.n, value.d ?? 0) : value;
  }
  return fill(template, params);
}

export const lineLabel = (locale: Locale, dict: Dictionary, line: Line): string =>
  render(locale, dict, "lines", line.label);

export const lineBasis = (locale: Locale, dict: Dictionary, line: Line): string | null =>
  line.basis ? render(locale, dict, "basis", line.basis) : null;

export const lineReason = (locale: Locale, dict: Dictionary, line: Line): string | null =>
  line.reason ? render(locale, dict, "reasons", line.reason) : null;

export const statusLabel = (dict: Dictionary, status: LineStatus): string =>
  dict.job.status[status];

export const geoLevelLabel = (dict: Dictionary, level: GeoLevel): string =>
  dict.job.geoLevels[level];

/** Resolves a field that is either a literal (a year) or a key into `job.terms`. */
export const term = (dict: Dictionary, value: Translatable): string =>
  typeof value === "string"
    ? value
    : ((dict.job.terms as Record<string, string>)[value.key] ?? value.key);

export const sourceCaveat = (dict: Dictionary, code: SourceCode): string => {
  const key = DATA_SOURCES[code].caveat.key;
  return (dict.job.sourceCaveats as Record<string, string>)[key] ?? key;
};

/**
 * One line of fine print per source: what it is, which period it describes and at
 * what geographic level. Those three facts are the minimum before a figure may be
 * shown at all.
 */
export const provenanceLine = (dict: Dictionary, code: SourceCode): string => {
  const source = DATA_SOURCES[code];
  return `${source.label} — ${source.publisher}, ${term(dict, source.vintage)}, ${geoLevelLabel(
    dict,
    source.geoLevel,
  )}`;
};
