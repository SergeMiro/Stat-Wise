"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass } from "lucide-react";
import { localePath, type Dictionary, type Locale } from "@/lib/i18n";
import { LanguageSwitcher } from "./language-switcher";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteHeader({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const pathname = usePathname();
  const nav = [
    { href: localePath(locale, "/methodology"), label: dict.nav.methodology },
    { href: localePath(locale, "/sources"), label: dict.nav.sources },
    { href: localePath(locale, "/coverage"), label: dict.nav.coverage },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
        <Link
          href={localePath(locale, "/")}
          className="flex items-center gap-2 font-heading text-base font-semibold tracking-tight"
        >
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Compass className="size-4" />
          </span>
          {dict.brand.name}
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher locale={locale} />
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex"
            render={<Link href={localePath(locale, "/sign-in")} />}
          >
            {dict.nav.signIn}
          </Button>
        </div>
      </div>
    </header>
  );
}
