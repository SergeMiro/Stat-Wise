import { notFound, redirect } from "next/navigation";
import { getDictionary, isLocale, localePath } from "@/lib/i18n";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { isSupabaseConfigured } from "@/server/supabase/env";
import { isAiConfigured, MODELS } from "@/lib/ai/models";
import { capabilitiesOf } from "@/lib/ai/roles";
import { SKILLS } from "@/lib/ai/skills";
import { TOOL_REGISTRY } from "@/lib/ai/tools";
import { configuredMcpServers } from "@/lib/ai/mcp";
import { PageShell } from "@/components/layout/page-shell";
import { AdminIndexButton } from "@/components/admin/admin-index-button";

/**
 * What the assistant is currently configured to be.
 *
 * A read-only console, on purpose. Skills, tools and MCP servers are declared in code
 * and in the environment, which means they are versioned and reviewable; moving them
 * into database rows editable from a web form would trade that for convenience, and
 * the thing being configured is what an AI may do on behalf of other people.
 *
 * The one action here is re-indexing, because that is the only thing that genuinely
 * cannot be done from a deploy: the copy changes, and the index has to be told.
 */
export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const t = dict.admin;

  if (!isSupabaseConfigured()) notFound();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`${localePath(locale, "/sign-in")}?next=${localePath(locale, "/app/admin")}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  /*
    404 rather than 403 for a non-admin. A page that says "forbidden" confirms the
    page exists, which is a small thing to give away and free not to.
  */
  if (profile?.role !== "admin") notFound();

  const { count: indexed } = await supabase
    .from("ai_documents")
    .select("*", { count: "exact", head: true });

  const mcpServers = configuredMcpServers();

  return (
    <PageShell title={t.title} intro={t.intro}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Panel title={t.state}>
          <Row label={t.model} value={MODELS.default} mono />
          <Row label={t.gateway} value={isAiConfigured() ? t.on : t.off} />
          <Row label={t.indexed} value={String(indexed ?? 0)} mono />
          <Row label={t.mcp} value={mcpServers.length ? mcpServers.map((s) => s.name).join(", ") : t.none} />
        </Panel>

        <Panel title={t.reindexTitle}>
          <p className="text-muted-foreground text-sm">{t.reindexBody}</p>
          <div className="mt-3">
            <AdminIndexButton labels={{ run: t.reindexRun, running: t.reindexRunning, done: t.reindexDone, failed: t.reindexFailed }} />
          </div>
        </Panel>
      </div>

      <section className="mt-8">
        <h2 className="font-heading text-base font-semibold">{t.skills}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{t.skillsBody}</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[34rem] text-sm">
            <thead>
              <tr className="text-muted-foreground text-left font-mono text-[11px] uppercase">
                <th className="border-b py-2 pr-3 font-normal">{t.colSkill}</th>
                <th className="border-b py-2 pr-3 font-normal">{t.colRequires}</th>
                <th className="border-b py-2 pr-3 font-normal">{t.colDefault}</th>
                <th className="border-b py-2 font-normal">{t.colTools}</th>
              </tr>
            </thead>
            <tbody>
              {SKILLS.map((skill) => (
                <tr key={skill.id} className="align-top">
                  <td className="border-b py-2 pr-3 font-medium">{skill.label[locale]}</td>
                  <td className="text-muted-foreground border-b py-2 pr-3 font-mono text-xs">
                    {skill.requires}
                  </td>
                  <td className="text-muted-foreground border-b py-2 pr-3">
                    {skill.defaultOn ? t.on : t.off}
                  </td>
                  <td className="text-muted-foreground border-b py-2 font-mono text-xs">
                    {skill.tools.join(", ") || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-heading text-base font-semibold">{t.tools}</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {Object.entries(TOOL_REGISTRY).map(([name, registered]) => (
            <li key={name} className="flex items-baseline justify-between gap-3 rounded-lg border px-3 py-2">
              <span className="font-mono text-xs">{name}</span>
              <span className="text-muted-foreground font-mono text-[11px]">
                {registered.capability}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-heading text-base font-semibold">{t.roles}</h2>
        <ul className="mt-3 space-y-2">
          {(["guest", "member", "admin"] as const).map((role) => (
            <li key={role} className="rounded-lg border px-3 py-2">
              <p className="font-mono text-xs font-semibold">{role}</p>
              <p className="text-muted-foreground mt-1 font-mono text-[11px]">
                {capabilitiesOf(role).join(" · ")}
              </p>
            </li>
          ))}
        </ul>
        <p className="text-muted-foreground mt-3 text-xs">{t.rolesNote}</p>
      </section>
    </PageShell>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border p-4 sm:p-5">
      <h2 className="font-heading text-base font-semibold">{title}</h2>
      <div className="mt-3 space-y-2">{children}</div>
    </section>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <p className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? "font-mono text-xs" : undefined}>{value}</span>
    </p>
  );
}
