/**
 * BPE (INSEE Base permanente des équipements 2025) TYPEQU → StatWise POI
 * category mapping. Every rule is traceable to the official TYPEQU nomenclature
 * (TYPEQU_2025.csv). Codes not mapped here are intentionally ignored.
 *
 * Notes / honest limits:
 *  - BPE has NO parks/green-space layer → `parks` stays out (sourced elsewhere).
 *  - BPE transport is sparse (rail stations + taxi ranks only, no bus stops) →
 *    `transport` here is a floor, to be enriched from transport.data.gouv.fr GTFS.
 *  - "médecin généraliste" is TYPEQU D265 in the 2025 nomenclature.
 */

const EXACT = {
  // health
  D265: "doctors",
  D307: "pharmacies",
  // early childhood (crèche capacity)
  D502: "creches",
  D509: "creches",
  // education
  C107: "schoolsMaternelle",
  C108: "schoolsElementaire",
  C109: "schoolsElementaire",
  C201: "college",
  C301: "lycee",
  C302: "lycee",
  // culture (library counted on its own)
  F307: "libraries",
  F303: "culture",
  F305: "culture",
  F312: "culture",
  F314: "culture",
  F315: "culture",
  // public administration + post
  A206: "adminServices",
  A207: "adminServices",
};

/** Prefix rules applied only if an EXACT rule didn't match. Order matters. */
const PREFIX = [
  ["B", "shops"], // all commerces
  ["D1", "medicalCenters"], // hospitals / health establishments
  ["F1", "sport"], // sports facilities
  ["F2", "sport"], // nature-sport facilities
  ["A1", "adminServices"], // public services / administration (A101..A140)
  ["E1", "transport"], // transports (rail stations, taxi) — floor only
];

export function categoryForTypequ(code) {
  if (!code) return null;
  if (EXACT[code]) return EXACT[code];
  for (const [pfx, cat] of PREFIX) {
    if (code.startsWith(pfx)) return cat;
  }
  return null;
}

/** All POI category keys this mapping can emit (for zero-filling). */
export const POI_CATEGORIES = [
  "transport",
  "shops",
  "pharmacies",
  "adminServices",
  "sport",
  "culture",
  "libraries",
  "doctors",
  "medicalCenters",
  "creches",
  "schoolsMaternelle",
  "schoolsElementaire",
  "college",
  "lycee",
];
