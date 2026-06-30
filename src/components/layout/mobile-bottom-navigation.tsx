"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, SlidersHorizontal, Heart, ListChecks, User } from "lucide-react";
import { localePath, type Dictionary, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function MobileBottomNavigation({
  locale,
  labels,
}: {
  locale: Locale;
  labels: Dictionary["nav"];
}) {
  const pathname = usePathname();

  const items = [
    { href: localePath(locale, "/"), label: labels.home, icon: Home, exact: true },
    { href: localePath(locale, "/app"), label: labels.simulate, icon: SlidersHorizontal },
    { href: localePath(locale, "/app/favorites"), label: labels.favorites, icon: Heart },
    { href: localePath(locale, "/app/simulations"), label: labels.results, icon: ListChecks },
    { href: localePath(locale, "/app/account"), label: labels.account, icon: User },
  ];

  return (
    <nav
      aria-label={labels.simulate}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 backdrop-blur md:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-1">
        {items.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg px-1 py-1.5 text-[0.65rem] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-5" />
                <span className="leading-none">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
