import { describe, expect, it } from "vitest";
import {
  activeSections,
  ALL_SECTION_IDS,
  REQUIRED_SECTION_IDS,
  SECTIONS,
  sectionState,
  toggleSection,
} from "./job-sections";
import { defaultJobDraft, type JobDraft } from "./job-storage";

/**
 * The flexible part of the wizard. These tests exist because the failure mode is
 * not a crash but a user stranded: a section switched off that still gets walked,
 * or a required one switched off so the comparison has nothing to compare.
 */

const draft = (over: Partial<JobDraft> = {}): JobDraft => ({ ...defaultJobDraft, ...over });

describe("the walk", () => {
  it("starts with everything on", () => {
    expect(defaultJobDraft.enabledSections).toEqual(ALL_SECTION_IDS);
    expect(activeSections(defaultJobDraft.enabledSections)).toEqual(ALL_SECTION_IDS);
  });

  it("skips what was switched off", () => {
    const walk = activeSections(["today", "offer", "household"]);
    expect(walk).toEqual(["today", "offer", "household"]);
    expect(walk).not.toContain("dividends");
  });

  it("keeps registry order however the list was assembled", () => {
    const walk = activeSections(["other", "today", "dividends", "offer"]);
    expect(walk).toEqual(["today", "offer", "dividends", "other"]);
  });

  it("walks the required sections even if someone drops them from the list", () => {
    // A stale draft from an older version, or a hand-edited localStorage payload.
    const walk = activeSections(["other"]);
    for (const id of REQUIRED_SECTION_IDS) expect(walk).toContain(id);
  });
});

describe("toggling", () => {
  it("switches an optional section off and on again", () => {
    const off = toggleSection(ALL_SECTION_IDS, "dividends");
    expect(off).not.toContain("dividends");
    expect(toggleSection(off, "dividends")).toContain("dividends");
  });

  it("refuses to switch off a required section", () => {
    for (const id of REQUIRED_SECTION_IDS) {
      expect(toggleSection(ALL_SECTION_IDS, id)).toContain(id);
    }
  });

  it("restores a section in registry order, not at the end", () => {
    const withoutOffer = ALL_SECTION_IDS.filter((id) => id !== "household");
    expect(toggleSection(withoutOffer, "household")).toEqual(ALL_SECTION_IDS);
  });
});

describe("the three colours", () => {
  const find = (id: string) => SECTIONS.find((s) => s.id === id)!;

  it("marks a section with content as filled", () => {
    const d = draft({ dividendsMonthly: 200 });
    expect(sectionState(find("dividends"), d.enabledSections, d)).toBe("filled");
  });

  it("marks an empty but enabled section as pending", () => {
    const d = draft({ dividendsMonthly: 0 });
    expect(sectionState(find("dividends"), d.enabledSections, d)).toBe("pending");
  });

  it("marks a switched-off section as disabled", () => {
    const d = draft({ enabledSections: toggleSection(ALL_SECTION_IDS, "dividends") });
    expect(sectionState(find("dividends"), d.enabledSections, d)).toBe("disabled");
  });

  it("never calls a required section disabled, whatever the list says", () => {
    const d = draft({ enabledSections: [] });
    for (const id of REQUIRED_SECTION_IDS) {
      expect(sectionState(find(id), d.enabledSections, d)).not.toBe("disabled");
    }
  });

  it("does not call a block filled just because its defaults look plausible", () => {
    /*
      "One adult, no children" and "no car" are real answers that leave every field
      at its default, so these two are judged on having been reviewed. Green has to
      mean the user looked, or the colour is decoration.
    */
    const untouched = draft();
    expect(sectionState(find("household"), untouched.enabledSections, untouched)).toBe("pending");
    const reviewed = draft({ householdReviewed: true });
    expect(sectionState(find("household"), reviewed.enabledSections, reviewed)).toBe("filled");
  });
});

describe("where the picker lands you", () => {
  /*
    The rule the wizard applies on leaving the picker, asserted here because the
    bug it fixes was invisible: re-enabling a section while standing on the last
    screen left the user unable to ever reach it, since "Continue" only moves
    forward through registry order.
  */
  const firstPending = (d: JobDraft) =>
    SECTIONS.find(
      (section) =>
        activeSections(d.enabledSections).includes(section.id) &&
        sectionState(section, d.enabledSections, d) === "pending",
    )?.id;

  it("points at a section switched back on, even one earlier in the order", () => {
    const d = draft({
      householdReviewed: true,
      travelReviewed: true,
      dividendsMonthly: 0,
      rentalMonthly: 500,
      declaredBenefitsMonthly: 100,
    });
    expect(firstPending(d)).toBe("dividends");
  });

  it("points at nothing once every enabled section has content", () => {
    const d = draft({
      enabledSections: ["today", "offer"],
      householdReviewed: true,
      travelReviewed: true,
    });
    expect(firstPending(d)).toBeUndefined();
  });

  it("ignores sections that are switched off", () => {
    const d = draft({
      enabledSections: activeSections(["today", "offer", "other"]),
      householdReviewed: true,
      travelReviewed: true,
    });
    // Dividends is off, so it must not be what we land on.
    expect(firstPending(d)).not.toBe("dividends");
  });
});
