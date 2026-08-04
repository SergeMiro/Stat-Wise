import { describe, expect, it } from "vitest";
import { ownPath } from "@/lib/own-path";

/**
 * Guards a defect seen in production, not a hypothetical.
 *
 * `searchDocs` handed the model `/fr/methodology#donnees-manquantes` and the answer
 * cited `https://wherewise.com/fr/methodology#donnees-manquantes` — a hostname nobody
 * owns. Left as written it renders as a link off the site, which is worse than a broken
 * anchor: it looks like our own documentation and is not.
 */
describe("ownPath", () => {
  it("takes back one of our pages given a hostname we do not own", () => {
    expect(ownPath("https://wherewise.com/fr/methodology#donnees-manquantes")).toBe(
      "/fr/methodology#donnees-manquantes",
    );
  });

  it("takes back a page on our real host too, so the tab is kept", () => {
    expect(ownPath("https://wherewise-fr.vercel.app/en/sources")).toBe("/en/sources");
  });

  it("leaves an external source alone even when its path looks like ours", () => {
    // A real citation to a real source must not be rewritten into a dead internal link.
    expect(ownPath("https://www.insee.fr/fr/statistiques/1234")).toBeNull();
    expect(ownPath("https://www.cnil.fr/fr/reglement-europeen-protection-donnees")).toBeNull();
  });

  it("ignores a path that is not one of our routes", () => {
    expect(ownPath("https://example.com/fr/blog/whatever")).toBeNull();
  });

  it("ignores anything that is not a URL", () => {
    expect(ownPath("javascript:alert(1)")).toBeNull();
    expect(ownPath("/fr/methodology")).toBeNull(); // already relative; handled before this
    expect(ownPath("")).toBeNull();
  });
});
