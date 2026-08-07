import type { ReactNode } from "react";

export function PageShell({
  title,
  intro,
  wide = false,
  children,
}: {
  title: string;
  intro?: string;
  /**
   * Widen the column for pages built around a table. Prose reads badly past
   * roughly 70 characters, which is why this is opt-in rather than the default —
   * but a four-column table squeezed into the prose width is worse than a wide
   * page.
   */
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`mx-auto px-4 py-8 ${wide ? "max-w-6xl" : "max-w-3xl"}`}>
      <header className="mb-6">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{title}</h1>
        {intro ? <p className="mt-2 text-muted-foreground max-w-3xl">{intro}</p> : null}
      </header>
      {children}
    </div>
  );
}
