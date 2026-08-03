import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The mark and the name, together.
 *
 * "Where" and "Wise" are written here rather than split from `dict.brand.name` at
 * runtime. A wordmark is not copy: it does not translate, and slicing a string on
 * its capital letters would break the moment the name changed. What the dictionary
 * still owns is the accessible name — the whole word, read once, so a screen reader
 * says "WhereWise" and not "Where, Wise".
 *
 * The two colours come from the logo. On a light surface the true cyan reaches only
 * 2.15:1, so the second half uses the darkened `brand-cyan-ink`; in dark mode the
 * token resolves to the bright cyan, which is the legible one there.
 */
export function Wordmark({
  name,
  className,
  markSize = 32,
  showName = true,
}: {
  /** `dict.brand.name` — the accessible name for the whole lockup. */
  name: string;
  className?: string;
  markSize?: number;
  showName?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)} aria-label={name}>
      {/*
        The pin alone, not the full lockup. At 28px the little map tile the logo
        stands on turns to mush and the whole mark reads as a blue smudge; cropped
        to the pin it stays legible. The complete artwork is kept for large uses.
      */}
      <Image
        src="/brand/pin-256.png"
        alt=""
        width={markSize}
        height={markSize}
        // Above the fold in the header on every page.
        priority
        className="shrink-0"
      />
      {showName ? (
        <span
          aria-hidden
          className="font-heading text-base leading-none font-semibold tracking-tight"
        >
          <span className="text-brand-blue">Where</span>
          <span className="text-brand-cyan-ink">Wise</span>
        </span>
      ) : null}
    </span>
  );
}
