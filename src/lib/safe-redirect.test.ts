import { describe, expect, it } from "vitest";
import { safeRedirect } from "./safe-redirect";

describe("safeRedirect", () => {
  const fallback = "/fr/app/account";

  it("keeps a same-site path", () => {
    expect(safeRedirect("/fr/app/job/result", fallback)).toBe("/fr/app/job/result");
    expect(safeRedirect("/en/app/account", fallback)).toBe("/en/app/account");
  });

  it("falls back when there is nothing to go on", () => {
    expect(safeRedirect(null, fallback)).toBe(fallback);
    expect(safeRedirect(undefined, fallback)).toBe(fallback);
    expect(safeRedirect("", fallback)).toBe(fallback);
  });

  it("refuses to leave the site", () => {
    /*
      Every one of these sends the browser to another origin while the visitor has
      just been signed in. The backslash forms are the ones a naive startsWith("/")
      check lets through: browsers normalise them into "//".
    */
    for (const hostile of [
      "https://evil.example.com",
      "//evil.example.com",
      "http://evil.example.com",
      "javascript:alert(1)",
      String.raw`/\evil.example.com`,
      String.raw`/\/evil.example.com`,
    ]) {
      expect(safeRedirect(hostile, fallback)).toBe(fallback);
    }
  });

  it("refuses whitespace, which browsers strip before resolving the URL", () => {
    expect(safeRedirect("/ //evil.example.com", fallback)).toBe(fallback);
    expect(safeRedirect("/\n/evil.example.com", fallback)).toBe(fallback);
    expect(safeRedirect("/\t/evil.example.com", fallback)).toBe(fallback);
  });
});
