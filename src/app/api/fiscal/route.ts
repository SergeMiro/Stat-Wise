import { NextResponse } from "next/server";
import { z } from "zod";
import { findCity } from "@/domain/reste-a-vivre";
import { computeFiscal, type FiscalResult } from "@/lib/openfisca";

/**
 * Income tax and benefits for the two sides of a comparison.
 *
 * The browser never talks to OpenFisca directly: it asks here, and this route
 * decides what may be sent onward. That matters for two reasons — the commune code
 * comes from our own snapshot rather than from whatever the client claims, and a
 * failure is turned into `null` so the page falls back to showing these lines as
 * `non chiffré` instead of breaking.
 *
 * Nothing identifying is sent to OpenFisca: a salary, a rent, a child count and a
 * commune code. No name, no address, no date of birth beyond an assumed year.
 */

const Side = z.object({
  cityId: z.string().min(1).max(64),
  netSalary: z.number().min(0).max(1_000_000),
  partnerNetSalary: z.number().min(0).max(1_000_000),
  rent: z.number().min(0).max(100_000),
});

const Body = z.object({
  year: z.number().int().min(2020).max(2100),
  children: z.number().int().min(0).max(12),
  childrenInCreche: z.number().int().min(0).max(12),
  current: Side,
  target: Side,
});

export async function POST(request: Request) {
  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const communeOf = (cityId: string) => findCity(cityId)?.communeCode;
  const currentCommune = communeOf(parsed.current.cityId);
  const targetCommune = communeOf(parsed.target.cityId);
  if (!currentCommune || !targetCommune) {
    return NextResponse.json({ error: "unknown city" }, { status: 400 });
  }

  const shared = {
    children: parsed.children,
    childrenInCreche: Math.min(parsed.childrenInCreche, parsed.children),
    year: parsed.year,
  };

  // Both sides in parallel: two independent calls to a rules engine.
  const [current, target] = await Promise.all([
    computeFiscal({ ...shared, ...parsed.current, communeCode: currentCommune }),
    computeFiscal({ ...shared, ...parsed.target, communeCode: targetCommune }),
  ]);

  /*
    All or nothing. One side answering and the other not would produce a
    difference between a household that pays tax and one that appears not to —
    the most misleading output this product could generate.
  */
  const both: { current: FiscalResult; target: FiscalResult } | null =
    current && target ? { current, target } : null;

  return NextResponse.json(
    { fiscal: both },
    { headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
