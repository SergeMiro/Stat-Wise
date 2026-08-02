/**
 * Who answers for this site, and where to write.
 *
 * The RGPD requires a privacy policy to name the controller and give a way to
 * reach them. Both appear in exactly one place so there is no second copy to fall
 * out of date, and so filling in the address is a one-line change.
 *
 * `contactEmail` is deliberately allowed to be empty: the page then omits the
 * mailto rather than publishing an address that bounces. An unreachable contact
 * for a data-protection request is worse than a page that admits it has none yet.
 */
export const SITE_PUBLISHER = {
  /** Natural person: the project is not a company and does not trade. */
  name: "Sergiy Mirochnyk",
  /** ← Fill this in. Until then the policy shows no contact address. */
  contactEmail: "",
} as const;

export const hasPublisherContact = (): boolean => SITE_PUBLISHER.contactEmail.length > 0;
