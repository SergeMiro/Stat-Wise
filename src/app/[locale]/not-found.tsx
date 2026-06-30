import Link from "next/link";
import { Compass } from "lucide-react";
import { defaultLocale, getDictionary, localePath } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/states";

// not-found cannot read route params; fall back to the default locale copy.
export default function NotFound() {
  const dict = getDictionary(defaultLocale);
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <EmptyState
        icon={<Compass />}
        title={dict.notFound.title}
        description={dict.notFound.body}
        action={
          <Button render={<Link href={localePath(defaultLocale, "/")} />}>{dict.notFound.home}</Button>
        }
      />
    </div>
  );
}
