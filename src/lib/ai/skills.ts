import { can, type Capability, type Role } from "./roles";

/**
 * A skill is a named way of being useful: a fragment of instruction, a set of tools
 * it needs, and the role it is available to.
 *
 * This is the extension point. Adding a capability to the assistant should mean
 * adding a skill here — not editing one growing system prompt, and not touching the
 * route. Skills compose: the request assembles the instructions of whichever skills
 * are active and unions their tools.
 *
 * Keeping the fragments separate matters for a reason beyond tidiness. One long
 * prompt makes every instruction compete for attention on every request; a reader
 * asking about data provenance does not need the paragraph about running
 * simulations, and leaving it out measurably improves the answer.
 */

export type Skill = {
  id: string;
  /** Shown in the panel so a person can see what the assistant is set up to do. */
  label: { fr: string; en: string };
  /** Appended to the instructions when the skill is active. */
  instructions: string;
  /** Tool names from the registry. */
  tools: readonly string[];
  /** Refused outright if the role lacks this. */
  requires: Capability;
  /** On unless switched off. */
  defaultOn: boolean;
};

export const SKILLS: readonly Skill[] = [
  {
    id: "places",
    label: { fr: "Villes et quartiers", en: "Cities and districts" },
    requires: "readPublicData",
    defaultOn: true,
    tools: ["listCities", "citySnapshot"],
    instructions: `
You can read the WhereWise snapshot: fourteen communes with their districts, rents,
fuel, water, electricity and transit fares.

Resolve place names with listCities before quoting anything. Never guess an id, and
never answer about a city that is not in the list — say it is not covered yet.

Every district carries a distanceSource: "measured" means it was routed from a real
anchor point, "derived" means it comes from the archetype model. When you quote a
distance, say which it is.`.trim(),
  },
  {
    id: "simulate",
    label: { fr: "Simuler un changement", en: "Simulate a change" },
    requires: "runSimulations",
    defaultOn: true,
    tools: ["compareSituations", "listCities"],
    instructions: `
You can run the reste-à-vivre engine with compareSituations.

Rules that are not negotiable, because the product's whole claim rests on them:

- Quote the range as well as the single figure. The rent indicator is commune-level,
  so a difference of "+560 €" is really "+284 € to +759 € depending on the rent found".
- If fiscalComputed is false, say income tax and benefits are not in the figure.
- Anything in \`omitted\` is not zero, it is unknown. Never present it as zero.
- The up-front costs — deposit, agency fee, removal — are deliberately not simulated
  from a conversation. If asked, say the simulator on the site collects them.

Ask for what you need rather than inventing it. If you do not know the rent they pay
today, ask; do not substitute an average and present the result as theirs.`.trim(),
  },
  {
    id: "provenance",
    label: { fr: "Sources et fiabilité", en: "Sources and reliability" },
    requires: "readPublicData",
    defaultOn: true,
    tools: ["dataSources"],
    instructions: `
You can read the provenance registry with dataSources.

When you give a figure, you can say where it comes from and how old it is. Do it
whenever the answer would otherwise sound more certain than it is. If a source's
vintage is years old — SISPEA water prices stop at 2019 — say so rather than letting
the reader assume it is current.`.trim(),
  },
  {
    id: "account",
    label: { fr: "Vos simulations enregistrées", en: "Your saved simulations" },
    requires: "readOwnData",
    defaultOn: false,
    tools: [],
    instructions: `
The person is signed in. You may refer to their saved simulations when they ask, and
only then. Do not volunteer the contents of their account into an unrelated answer.`.trim(),
  },
];

export const skillById = (id: string): Skill | undefined => SKILLS.find((s) => s.id === id);

/** The skills a role is allowed to use at all. */
export const skillsFor = (role: Role): readonly Skill[] =>
  SKILLS.filter((s) => can(role, s.requires));

/**
 * Assembles one set of instructions and one tool list from the active skills.
 *
 * A skill the role may not use is dropped here rather than trusted from the client:
 * the panel sends which skills it wants, and the client is not the authority on
 * what it is allowed to have.
 */
export function assemble(role: Role, requested?: readonly string[]) {
  const allowed = skillsFor(role);
  const active = allowed.filter((s) =>
    requested ? requested.includes(s.id) : s.defaultOn,
  );
  return {
    active,
    instructions: active.map((s) => s.instructions).join("\n\n"),
    tools: [...new Set(active.flatMap((s) => s.tools))],
  };
}
