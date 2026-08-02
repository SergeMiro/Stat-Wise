import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { fill, getDictionary, isLocale } from "@/lib/i18n";
import { hasPublisherContact, SITE_PUBLISHER } from "@/lib/site-publisher";
import { PageShell } from "@/components/layout/page-shell";

/**
 * The privacy policy, written to the list of mentions the CNIL requires: who the
 * controller is, what is processed and why, on what legal basis, who else sees it,
 * for how long, what rights follow and how to complain.
 *
 * Laid out as tables rather than paragraphs because the obligation is to be
 * "concise, transparent and easily accessible" — someone looking for one line about
 * one piece of data should not have to read a wall of prose to find it.
 */
export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const p = dict.pages.privacy;

  return (
    <PageShell title={p.title} intro={p.intro}>
      <p className="text-muted-foreground -mt-2 text-xs">{p.updated}</p>

      <section className="bg-card mt-6 rounded-xl border p-5">
        <h2 className="font-heading text-base font-semibold">{p.summaryTitle}</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {p.summary.map((line) => (
            <li key={line} className="flex items-start gap-2">
              <Check className="text-confidence-high mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      {p.sections.map((section) => (
        <section key={section.title} className="mt-8">
          <h2 className="font-heading text-base font-semibold">{section.title}</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            {/* Only the controller line has a value substituted into it. */}
            {section.body.includes("{publisher}")
              ? fill(section.body, { publisher: SITE_PUBLISHER.name })
              : section.body}
          </p>

          {"items" in section && section.items ? (
            <ul className="mt-3 space-y-2 text-sm">
              {section.items.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-muted-foreground mt-0.5" aria-hidden>
                    ·
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {"rows" in section && section.rows ? (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[40rem] border-separate border-spacing-0 text-sm">
                <thead>
                  <tr className="text-muted-foreground text-left font-mono text-[11px] uppercase">
                    <th className="border-b py-2 pr-3 font-normal">{p.tableWhat}</th>
                    <th className="border-b py-2 pr-3 font-normal">{p.tableData}</th>
                    <th className="border-b py-2 pr-3 font-normal">{p.tableWhy}</th>
                    <th className="border-b py-2 font-normal">{p.tableBasis}</th>
                  </tr>
                </thead>
                <tbody>
                  {section.rows.map((row) => (
                    <tr key={row.what} className="align-top">
                      <td className="border-b py-3 pr-3 font-medium">{row.what}</td>
                      <td className="text-muted-foreground border-b py-3 pr-3">{row.data}</td>
                      <td className="text-muted-foreground border-b py-3 pr-3">{row.why}</td>
                      <td className="text-muted-foreground border-b py-3">{row.basis}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      ))}

      <section className="bg-card mt-8 rounded-xl border p-5">
        <h2 className="font-heading text-base font-semibold">{p.contactTitle}</h2>
        {hasPublisherContact() ? (
          <p className="mt-2 text-sm">
            {p.contactBody}{" "}
            <a
              className="hover:text-primary underline"
              href={`mailto:${SITE_PUBLISHER.contactEmail}`}
            >
              {SITE_PUBLISHER.contactEmail}
            </a>
          </p>
        ) : (
          /*
            No address rather than a fake one: a data-protection contact that
            bounces is worse than a page admitting it does not have one yet.
          */
          <p className="text-muted-foreground mt-2 text-sm">{p.contactMissing}</p>
        )}
      </section>
    </PageShell>
  );
}
