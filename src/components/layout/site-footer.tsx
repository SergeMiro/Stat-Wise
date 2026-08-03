import Link from "next/link";
import type { ReactNode } from "react";
import { localePath, type Dictionary, type Locale } from "@/lib/i18n";
import { Wordmark } from "./wordmark";

/**
 * Four columns rather than one row of links.
 *
 * The flat version listed five links side by side with no grouping, which left the
 * reader to work out for themselves that "Sources" and "Conditions" are different
 * kinds of thing. Grouped, the footer also says what the product is to someone who
 * arrived on a deep page and has never seen the home screen.
 *
 * Each group is headed by a short accent rule and a small-caps label — the device
 * used on the other site, carried over on this project's own tokens rather than its
 * classes.
 */
export function SiteFooter({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const f = dict.footer;

  const groups: { title: string; links: { href: string; label: string }[] }[] = [
    {
      title: f.simulators,
      links: [
        { href: localePath(locale, "/app/job/new"), label: dict.home.jobTitle },
        { href: localePath(locale, "/app/quartier/new"), label: dict.home.quartierTitle },
        { href: localePath(locale, "/app/family/new"), label: dict.home.familyTitle },
      ],
    },
    {
      title: f.data,
      links: [
        { href: localePath(locale, "/methodology"), label: dict.nav.methodology },
        { href: localePath(locale, "/sources"), label: dict.nav.sources },
        { href: localePath(locale, "/coverage"), label: dict.nav.coverage },
      ],
    },
    {
      title: f.legalTitle,
      links: [
        { href: localePath(locale, "/privacy"), label: dict.nav.privacy },
        { href: localePath(locale, "/terms"), label: dict.nav.terms },
        { href: localePath(locale, "/app/account"), label: f.account },
      ],
    },
  ];

  return (
    <footer className="bg-muted/30 border-border/70 border-t">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
        {/*
          Three shapes, one per amount of room.

          On a phone the groups sit two abreast: stacked, three groups of 44px-tall
          targets made the footer 976px, nearly three screens of nothing but links.
          A tablet fits all three groups in one row. Only past 1024px is there room
          for the brand blurb to sit beside them without being squeezed into a
          column too narrow to read.
        */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-9 md:grid-cols-3 lg:grid-cols-[1.6fr_1fr_1fr_1fr] lg:gap-8">
          {/* The brand, and what this is, for someone who landed on a deep page. */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Wordmark name={dict.brand.name} markSize={27} />
            {/* The slogan sits directly under the name, on every page. */}
            <p className="text-brand-cyan-ink mt-2.5 text-sm font-medium">{dict.brand.slogan}</p>
            <p className="text-muted-foreground mt-2 max-w-xs text-sm leading-relaxed">{f.blurb}</p>
          </div>

          {groups.map((group) => (
            <FooterGroup key={group.title} title={group.title}>
              {group.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground touch:min-h-11 inline-flex items-center text-sm transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </FooterGroup>
          ))}
        </div>

        <div className="border-border/70 text-muted-foreground mt-10 flex flex-col gap-2 border-t pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>{f.legal}</p>
          <p>
            {/*
              Rendered on the server, so on a statically generated page this is the
              build year. Acceptable for a site that redeploys on every change, and
              better than a hand-typed year nobody remembers to bump.
            */}
            © {new Date().getFullYear()} {dict.brand.name}. {f.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <nav>
      <div className="mb-3 flex items-start gap-2.5">
        <span className="bg-primary mt-0.5 block h-4 w-0.5 shrink-0 rounded-full" aria-hidden />
        <h2 className="text-muted-foreground font-mono text-[11px] font-semibold tracking-wider uppercase">
          {title}
        </h2>
      </div>
      <div className="flex flex-col gap-1">{children}</div>
    </nav>
  );
}
