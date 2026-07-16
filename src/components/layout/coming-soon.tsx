import Link from "next/link";
import { Construction } from "lucide-react";
import { localePath, type Dictionary, type Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/states";
import { StatWiseIllustration } from "@/components/visuals/statwise-illustration";

export function ComingSoon({
  title,
  locale,
  dict,
  description,
  illustration,
  primaryHref,
  primaryLabel,
}: {
  title: string;
  locale: Locale;
  dict: Dictionary;
  /** Override the default "coming soon" line with something route-specific. */
  description?: string;
  /** Optional illustration shown instead of the construction icon. */
  illustration?: string;
  /** Primary CTA target — defaults to launching a simulator, never just home. */
  primaryHref?: string;
  primaryLabel?: string;
}) {
  const ctaHref = primaryHref ?? localePath(locale, "/app/quartier/new");
  const ctaLabel = primaryLabel ?? dict.home.startQuartier;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <EmptyState
        icon={
          illustration ? (
            <div className="mx-auto w-full max-w-[260px]">
              <StatWiseIllustration src={illustration} alt="" width={480} height={360} />
            </div>
          ) : (
            <Construction />
          )
        }
        title={title}
        description={description ?? dict.common.comingSoon}
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button render={<Link href={ctaHref} />}>{ctaLabel}</Button>
            <Button variant="ghost" render={<Link href={localePath(locale, "/")} />}>
              {dict.nav.home}
            </Button>
          </div>
        }
      />
    </div>
  );
}
