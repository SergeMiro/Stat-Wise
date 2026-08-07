import { describe, expect, it } from "vitest";
import {
  CATALOG,
  CATALOG_SOURCES,
  RELOCATION_SCOPE_BY_POSTE,
  allMesures,
  allPostes,
  countByAvailability,
} from ".";
import type { CatalogSourceCode } from "./sources";

/**
 * These are not shape tests. Each one guards a rule that, if broken, would turn
 * the page into the thing it exists to replace: a table of confident numbers with
 * nothing behind them.
 */

describe("catalogue structure", () => {
  it("gives every domain at least one poste, and every poste at least one mesure", () => {
    for (const domaine of CATALOG) {
      expect(domaine.postes.length, `domaine ${domaine.key}`).toBeGreaterThan(0);
      for (const poste of domaine.postes) {
        expect(poste.mesures.length, `poste ${poste.key}`).toBeGreaterThan(0);
      }
    }
  });

  it("keeps keys unique, so a row can be linked to and cannot silently shadow another", () => {
    const domainKeys = CATALOG.map((d) => d.key);
    expect(new Set(domainKeys).size).toBe(domainKeys.length);

    const posteKeys = allPostes().map((p) => p.key);
    expect(new Set(posteKeys).size).toBe(posteKeys.length);

    for (const poste of allPostes()) {
      const mesureKeys = poste.mesures.map((m) => m.key);
      expect(new Set(mesureKeys).size, `poste ${poste.key}`).toBe(mesureKeys.length);
    }
  });

  it("writes every label in both languages", () => {
    const texts = [
      ...CATALOG.flatMap((d) => [d.label, d.summary]),
      ...allPostes().map((p) => p.label),
      ...allMesures().flatMap((m) => (m.note ? [m.label, m.note] : [m.label])),
    ];
    for (const text of texts) {
      expect(text.fr.length).toBeGreaterThan(0);
      expect(text.en.length).toBeGreaterThan(0);
    }
  });

  it("classifies every item for the relocation comparison, with no stale entries", () => {
    const posteKeys = allPostes()
      .map((poste) => poste.key)
      .sort();
    const classifiedKeys = Object.keys(RELOCATION_SCOPE_BY_POSTE).sort();
    expect(classifiedKeys).toEqual(posteKeys);
  });
});

describe("provenance", () => {
  it("points every poste at at least one source", () => {
    for (const poste of allPostes()) {
      expect(poste.sources.length, `poste ${poste.key}`).toBeGreaterThan(0);
    }
  });

  it("resolves every source code in the registry", () => {
    for (const poste of allPostes()) {
      for (const code of poste.sources) {
        expect(CATALOG_SOURCES[code], `poste ${poste.key} → ${code}`).toBeDefined();
      }
    }
  });

  it("leaves no source in the registry that nothing points at", () => {
    const used = new Set<CatalogSourceCode>(allPostes().flatMap((p) => p.sources));
    const orphans = (Object.keys(CATALOG_SOURCES) as CatalogSourceCode[]).filter(
      (code) => !used.has(code),
    );
    expect(orphans, "sources declared but never used").toEqual([]);
  });

  it("gives every source a vintage and a caveat in both languages", () => {
    for (const [code, source] of Object.entries(CATALOG_SOURCES)) {
      for (const text of [source.vintage, source.refresh, source.caveat]) {
        expect(text.fr.length, code).toBeGreaterThan(0);
        expect(text.en.length, code).toBeGreaterThan(0);
      }
    }
  });
});

describe("honesty rules", () => {
  /*
    The one that matters most. A row we cannot compute, or one we made up, has to
    say why on the page — otherwise "non disponible" reads as an oversight and a
    hypothesis reads as a measurement. Both failures look identical to a reader,
    and both are the exact accusation this product makes against everyone else.
  */
  it("explains every quantity that is unavailable or assumed", () => {
    const unexplained = allMesures()
      .filter((m) => m.availability === "unavailable" || m.availability === "hypothesis")
      .filter((m) => !m.note)
      .map((m) => m.key);
    expect(unexplained, "unavailable or hypothesised without a note").toEqual([]);
  });

  it("never leaves a gap with no name: at least one quantity in each honest state", () => {
    const counts = countByAvailability();
    expect(counts.unavailable).toBeGreaterThan(0);
    expect(counts.hypothesis).toBeGreaterThan(0);
    expect(counts.open_data).toBeGreaterThan(0);
    expect(counts.official_rule).toBeGreaterThan(0);
  });

  /*
    Rents and property prices are the two places where a mean would be wrong and
    tempting. If a `mean` ever appears on a per-m² price, someone has quietly
    swapped the statistic, and the reader would have no way of telling.
  */
  it("never claims a mean on a price per square metre", () => {
    const offenders = allMesures()
      .filter((m) => m.unit.includes("€/m²") && m.stat === "mean")
      .filter((m) => m.availability !== "unavailable")
      .map((m) => m.key);
    expect(offenders, "mean used on a per-m² price").toEqual([]);
  });
});
