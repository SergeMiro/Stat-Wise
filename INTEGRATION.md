# StatWise visual pack — integration guide

This pack contains text-free SVG illustrations so the same assets work for both `/fr` and `/en`.

## Included files

- `hero/result-preview.svg`
- `simulators/quartier.svg`
- `simulators/family.svg`
- `steps/01-profile.svg`
- `steps/02-analysis.svg`
- `steps/03-result.svg`
- `family/age-0-2.svg`
- `family/age-3-5.svg`
- `family/age-6-10.svg`
- `family/age-11-14.svg`
- `family/age-15-17.svg`
- `empty-states/favorites.svg`
- `empty-states/history.svg`
- `rerun/scenario-cards.svg`
- `coverage/france.svg`

## 1. Copy assets

Copy the `public/illustrations` directory from this package into the repository's existing `public` directory.

```text
Stat-Wise/
└── public/
    └── illustrations/
```

No Next.js image-domain configuration is required because these are local public assets.

## 2. Add a reusable illustration component

Create `src/components/visuals/statwise-illustration.tsx`:

```tsx
import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  src: string;
  alt?: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
};

export function StatWiseIllustration({
  src,
  alt = "",
  width,
  height,
  className,
  priority = false,
}: Props) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={cn("h-auto w-full select-none", className)}
      draggable={false}
    />
  );
}
```

Use empty `alt=""` when the adjacent HTML already explains the image. Use descriptive alt text only when the image communicates additional information.

## 3. Home hero

Edit `src/app/[locale]/page.tsx`.

Change the hero from a single centered text column to a two-column grid:

```tsx
<section className="grid items-center gap-10 py-12 lg:grid-cols-[1fr_0.95fr] lg:py-20">
  <div className="max-w-2xl">
    {/* existing slogan, title, subtitle and CTA buttons */}
  </div>

  <div className="mx-auto w-full max-w-[680px]">
    <StatWiseIllustration
      src="/illustrations/hero/result-preview.svg"
      alt=""
      width={720}
      height={520}
      priority
      className="drop-shadow-sm"
    />
  </div>
</section>
```

On mobile keep the image after the CTA buttons. Do not put it before the title.

## 4. Simulator cards on the home page

Update `SimulatorCard` in `src/app/[locale]/page.tsx` to accept an `image` field.

```tsx
function SimulatorCard({
  image,
  icon,
  title,
  description,
  cta,
  href,
}: {
  image: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  cta: string;
  href: string;
}) {
  return (
    <Card className="group overflow-hidden">
      <div className="bg-muted/40 px-5 pt-5">
        <StatWiseIllustration
          src={image}
          alt=""
          width={640}
          height={400}
          className="transition-transform duration-300 group-hover:scale-[1.025]"
        />
      </div>
      {/* existing CardHeader and CardContent */}
    </Card>
  );
}
```

Pass:

```tsx
image="/illustrations/simulators/quartier.svg"
image="/illustrations/simulators/family.svg"
```

## 5. “Comment ça marche”

In `src/app/[locale]/page.tsx`, add this array before the return:

```tsx
const stepImages = [
  "/illustrations/steps/01-profile.svg",
  "/illustrations/steps/02-analysis.svg",
  "/illustrations/steps/03-result.svg",
];
```

Inside `dict.home.steps.map` add:

```tsx
<StatWiseIllustration
  src={stepImages[i]}
  alt=""
  width={400}
  height={300}
  className="mx-auto mb-5 max-w-[260px]"
/>
```

Use `md:grid-cols-3`. Keep each illustration visually limited to approximately `220–260px`; otherwise this section becomes too tall.

## 6. Simulator hub

Edit `src/app/[locale]/app/page.tsx`.

Add an `image` property to each item in `simulators` and place the illustration at the top of each card:

```tsx
{
  image: "/illustrations/simulators/quartier.svg",
  // existing fields
}
```

```tsx
{
  image: "/illustrations/simulators/family.svg",
  // existing fields
}
```

Recommended card grid:

```tsx
<div className="grid gap-6 md:grid-cols-2">
```

Each full card should be clickable. Keep the internal button for accessibility and visual clarity.

## 7. Family wizard age step

Create `src/components/visuals/age-illustration.tsx`:

```tsx
import { StatWiseIllustration } from "./statwise-illustration";

const ageImages = {
  "0-2": "/illustrations/family/age-0-2.svg",
  "3-5": "/illustrations/family/age-3-5.svg",
  "6-10": "/illustrations/family/age-6-10.svg",
  "11-14": "/illustrations/family/age-11-14.svg",
  "15-17": "/illustrations/family/age-15-17.svg",
} as const;

export function AgeIllustration({
  age,
}: {
  age: keyof typeof ageImages;
}) {
  return (
    <StatWiseIllustration
      src={ageImages[age]}
      alt=""
      width={400}
      height={300}
      className="mx-auto max-w-[320px]"
    />
  );
}
```

Render it after the age selector. Animate only the container opacity/vertical position with the already installed `motion` package; do not animate individual SVG paths.

## 8. Result page

Edit `src/components/quartier/quartier-result.tsx`.

Place the result preview after the title/subtitle and before excluded areas:

```tsx
<section className="overflow-hidden rounded-2xl border bg-card">
  <div className="grid items-center gap-5 p-5 md:grid-cols-[0.85fr_1.15fr]">
    <div>
      {/* short summary: city, number of evaluated areas, top score */}
    </div>
    <StatWiseIllustration
      src="/illustrations/hero/result-preview.svg"
      alt=""
      width={720}
      height={520}
      className="max-h-[360px]"
    />
  </div>
</section>
```

This SVG is a product preview, not a real geographic map. Label the section as a visual summary; do not present it as exact geography. When real GeoJSON is available, replace only this section with MapLibre/Leaflet.

## 9. Repeat-run block

Still in `src/components/quartier/quartier-result.tsx`, insert a new section immediately before the existing actions:

```tsx
<section className="rounded-2xl border bg-muted/30 p-5 md:p-7">
  <div className="grid items-center gap-6 lg:grid-cols-[0.9fr_1.1fr]">
    <StatWiseIllustration
      src="/illustrations/rerun/scenario-cards.svg"
      alt=""
      width={640}
      height={380}
    />

    <div>
      <h2 className="text-xl font-semibold">
        {dict.result.tryAnotherScenarioTitle}
      </h2>
      <p className="mt-2 text-muted-foreground">
        {dict.result.tryAnotherScenarioDescription}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {/* budget -10%, without car, more nature, buy instead of rent */}
      </div>
    </div>
  </div>
</section>
```

Each scenario button should clone the current input, change one field, save it through the existing storage helper, and navigate back to the result or wizard.

Add dictionary keys in both `src/lib/i18n/dictionaries/fr.ts` and `en.ts` instead of hard-coding French.

Suggested French keys:

```ts
tryAnotherScenarioTitle: "Et si votre situation changeait ?",
tryAnotherScenarioDescription:
  "Relancez l’analyse en modifiant un seul paramètre.",
```

## 10. Favourites and results empty states

Replace the generic construction/coming-soon visual in the relevant route components or extend `src/components/layout/coming-soon.tsx` with an optional `illustration` prop.

Use:

```tsx
illustration="/illustrations/empty-states/favorites.svg"
```

for favourites and:

```tsx
illustration="/illustrations/empty-states/history.svg"
```

for simulation history.

The primary CTA must launch a simulator, not merely return to the home page.

## 11. Coverage page

Edit the coverage route under `src/app/[locale]/coverage/page.tsx` and add:

```tsx
<StatWiseIllustration
  src="/illustrations/coverage/france.svg"
  alt=""
  width={480}
  height={480}
  className="mx-auto max-w-[440px]"
/>
```

Place it beside the city list on desktop and above the list on mobile.

## 12. Styling rules

Add these utility classes only if needed in `src/app/globals.css`:

```css
@layer utilities {
  .visual-panel {
    @apply overflow-hidden rounded-2xl border bg-card;
  }

  .visual-soft {
    @apply bg-muted/40;
  }
}
```

The SVG files already use colors aligned with the current StatWise teal/chart palette. Do not recolor them with CSS filters.

## 13. Performance and accessibility

- SVGs are small and local; use `next/image`.
- Set `priority` only on the hero image.
- Lazy-load all below-the-fold images.
- Keep semantic headings and copy in HTML, not inside SVG.
- Use `alt=""` for decorative images.
- Respect `prefers-reduced-motion`.
- Do not make the illustration itself the only clickable target.
