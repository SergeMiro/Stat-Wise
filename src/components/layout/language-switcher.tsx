"use client";

import { usePathname, useRouter } from "next/navigation";
import { locales, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const router = useRouter();

  function switchTo(next: Locale) {
    if (next === locale) return;
    const segments = pathname.split("/");
    segments[1] = next; // replace the leading locale segment
    router.push(segments.join("/") || `/${next}`);
  }

  return (
    <div className="inline-flex items-center rounded-full border bg-background p-0.5 text-xs" role="group" aria-label="Language">
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => switchTo(l)}
          aria-current={l === locale}
          className={cn(
            /*
              Both halves grow together so the boundary between them stays where it
              looks like it is. Enlarging only the hit area would make FR and EN
              overlap, and a tap near the middle would switch the wrong way.
            */
            "inline-flex items-center justify-center rounded-full px-2 py-1 font-medium uppercase transition-colors touch:min-h-11 touch:min-w-11",
            l === locale
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
