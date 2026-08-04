/**
 * Who is talking to the assistant, and what that lets them do.
 *
 * Every capability in this system is gated on a role, in one place, so that adding
 * a skill or an MCP server later cannot accidentally hand an anonymous visitor a
 * tool that reads someone's account. A capability that is not listed is refused —
 * the default is no, not yes.
 */

export const ROLES = ["guest", "member", "admin"] as const;
export type Role = (typeof ROLES)[number];

/**
 * The permissions a role carries.
 *
 * These are named after what they let the assistant *do*, not after the feature
 * that happens to use them today, so a new skill can ask for `readOwnData`
 * without a new flag being invented for it.
 */
export type Capability =
  /** Read the public snapshot: cities, districts, sources, methodology. */
  | "readPublicData"
  /** Run the simulators and explain their output. */
  | "runSimulations"
  /** Read the signed-in household's own profile and saved simulations. */
  | "readOwnData"
  /** Retrieval over the project's own documents. */
  | "useRetrieval"
  /** Call tools exposed by configured MCP servers. */
  | "useMcpServers"
  /** Read coverage, freshness and ETL state across the whole dataset. */
  | "readOperations"
  /** Choose a model other than the default. */
  | "chooseModel";

const CAPABILITIES: Record<Role, readonly Capability[]> = {
  /*
    A visitor with no account. Everything here is already public on the site, so
    the assistant is a different way of reading it, not a new disclosure.
  */
  guest: ["readPublicData", "runSimulations"],
  /*
    Signed in. Adds their own data and retrieval over our documents. Still no MCP:
    an MCP server is arbitrary third-party code reached over the network, and
    handing that to every visitor is how a chat window becomes an open proxy.
  */
  member: ["readPublicData", "runSimulations", "readOwnData", "useRetrieval"],
  admin: [
    "readPublicData",
    "runSimulations",
    "readOwnData",
    "useRetrieval",
    "useMcpServers",
    "readOperations",
    "chooseModel",
  ],
};

export const can = (role: Role, capability: Capability): boolean =>
  CAPABILITIES[role].includes(capability);

export const capabilitiesOf = (role: Role): readonly Capability[] => CAPABILITIES[role];
