"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localePath, type Dictionary, type Locale } from "@/lib/i18n";
import { LanguageSwitcher } from "./language-switcher";
import { Button } from "@/components/ui/button";
import { Wordmark } from "./wordmark";
import { AiPanelButton } from "@/components/ai/ai-panel-button";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/ai/roles";

export function SiteHeader({
  locale,
  dict,
  role,
}: {
  locale: Locale;
  dict: Dictionary;
  /* Resolved on the server from the session cookie, never guessed here. */
  role: Role;
}) {
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
          className="flex items-center touch:min-h-11"
        >
          <Wordmark name={dict.brand.name} />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center rounded-md px-3 py-1.5 text-sm transition-colors touch:min-h-11",
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
          <AiPanelButton label={dict.ai.open} />
          <LanguageSwitcher locale={locale} />
          {/*
            What the header offers depends on who is reading it. It used to offer "sign
            in" unconditionally, so someone already signed in was invited to sign in
            again — and had no way to reach their account, or the console, without typing
            the URL.
          */}
          {role === "admin" ? (
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
              render={<Link href={localePath(locale, "/app/admin")} />}
            >
              {dict.nav.admin}
            </Button>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex"
            render={
              <Link
                href={localePath(locale, role === "guest" ? "/sign-in" : "/app/account")}
              />
            }
          >
            {role === "guest" ? dict.nav.signIn : dict.nav.account}
          </Button>
        </div>
      </div>
    </header>
  );
}
