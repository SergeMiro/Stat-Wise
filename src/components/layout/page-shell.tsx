import type { ReactNode } from "react";

export function PageShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{title}</h1>
        {intro ? <p className="mt-2 text-muted-foreground">{intro}</p> : null}
      </header>
      {children}
    </div>
  );
}
