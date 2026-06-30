import Link from "next/link";
import { Construction } from "lucide-react";
import { localePath, type Dictionary, type Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/states";

export function ComingSoon({
  title,
  locale,
  dict,
}: {
  title: string;
  locale: Locale;
  dict: Dictionary;
}) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <EmptyState
        icon={<Construction />}
        title={title}
        description={dict.common.comingSoon}
        action={
          <Button variant="outline" render={<Link href={localePath(locale, "/")} />}>
            {dict.nav.home}
          </Button>
        }
      />
    </div>
  );
}
