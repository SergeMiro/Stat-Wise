import Link from "next/link";
import { localePath, type Dictionary, type Locale } from "@/lib/i18n";

export function SiteFooter({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const links = [
    { href: localePath(locale, "/methodology"), label: dict.nav.methodology },
    { href: localePath(locale, "/sources"), label: dict.nav.sources },
    { href: localePath(locale, "/coverage"), label: dict.nav.coverage },
    { href: localePath(locale, "/privacy"), label: dict.nav.privacy },
    { href: localePath(locale, "/terms"), label: dict.nav.terms },
  ];

  return (
    <footer className="border-t border-border/70 bg-muted/30">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 text-sm">
        <div className="flex flex-col gap-1">
          <span className="font-heading text-base font-semibold">{dict.brand.name}</span>
          <span className="text-muted-foreground">{dict.footer.tagline}</span>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-muted-foreground hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-muted-foreground">{dict.footer.legal}</p>
      </div>
    </footer>
  );
}
