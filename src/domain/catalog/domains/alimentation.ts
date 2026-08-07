import type { Domaine } from "../types";

/**
 * Food, and the question every reader asks: "Lidl is cheaper than Carrefour, by
 * how much, and can you put that in the calculation?"
 *
 * The answer has three parts, and all three belong on the page because the third
 * is the one nobody else admits to.
 *
 *  1. **An official price index exists, and it is not what people think.** The
 *     Insee IPGD is built on supermarket checkout data — some eighty million
 *     products, not thirty thousand hand-collected prices — and it is genuinely
 *     solid. But it measures *how prices move*, not what they are, it is national,
 *     and it stops at the retail format: hypermarché, supermarché, hard discount.
 *     There is no official index of price *levels* by chain, and none by store.
 *     Anyone quoting "Carrefour is 10 % above Lidl" from a public authority is
 *     quoting something that does not exist.
 *
 *  2. **A level comparison between chains exists, and it is not official.** The
 *     annual UFC-Que Choisir ranking does compare chains on a common basket, and
 *     its orders of magnitude are the ones the press repeats: a spread of roughly
 *     fifteen to twenty per cent between the cheapest and the dearest chain, and
 *     a few per cent between neighbours in the ranking. It is a consumer
 *     association with its own basket and its own method, not a statistics
 *     office, and its figures are its property. We may cite it and link to it;
 *     we may not silently bake its coefficients into a total and call the result
 *     measured. So the chain coefficient lives here as an *assumption the reader
 *     sets*, defaulting to none, with the study named next to it.
 *
 *  3. **A per-store price exists, and it is volunteered.** Open Prices, from the
 *     Open Food Facts community, is the only source that ties a product price to
 *     an actual shop under an open licence. It is the honest path from assumption
 *     to measurement — the day coverage in a given city is thick enough, that
 *     city's coefficient stops being a hypothesis. Today it is thin, and saying
 *     so is part of the product.
 *
 * The rule that survives all three: the geography of food is worth far less than
 * it feels. The only official spatial gap is Île-de-France against the provinces,
 * and it is about seven per cent of the grocery basket — smaller than a rounding
 * error on rent. What genuinely costs money is the *drive* to the shop, and that
 * is arithmetic we can do exactly. It lives under Mobility, not here.
 */
export const alimentation: Domaine = {
  key: "alimentation",
  label: { fr: "Alimentation et courses", en: "Food and groceries" },
  summary: {
    fr: "Beaucoup d'attente, peu d'écart réel : le seul écart géographique officiel est de 7 % entre l'Île-de-France et la province. Ce qui coûte vraiment, c'est le trajet jusqu'au magasin.",
    en: "Much expected, little real difference: the only official spatial gap is 7 % between Île-de-France and the provinces. What genuinely costs money is the drive to the shop.",
  },
  postes: [
    {
      key: "panier_reference",
      label: { fr: "Panier alimentaire de référence", en: "Reference food basket" },
      flow: "pilotable",
      tier: "T1",
      sources: ["insee_budget_famille", "insee_ipc"],
      mesures: [
        {
          key: "depense_mensuelle_uc",
          label: { fr: "Dépense alimentaire par unité de consommation", en: "Food spending per consumption unit" },
          unit: "€/mois",
          stat: "mean",
          availability: "open_data",
          note: {
            fr: "Le point de départ du panier, par composition de ménage et par décile de revenu. National : c'est la taille du panier, jamais son prix ici.",
            en: "The basket's starting point, by household type and income decile. National: it gives the size of the basket, never its price here.",
          },
        },
        {
          key: "reflation_ipc",
          label: { fr: "Coefficient de passage en euros d'aujourd'hui", en: "Coefficient to today's euros" },
          unit: "coefficient",
          stat: "coefficient",
          availability: "open_data",
          note: {
            fr: "Obligatoire dès que deux sources n'ont pas le même millésime, et il faut le dire au lecteur : « reflaté 2024 → 2026 ».",
            en: "Required as soon as two sources carry different vintages, and the reader has to be told: “reflated 2024 → 2026”.",
          },
        },
      ],
    },
    {
      key: "ecart_geographique",
      label: { fr: "Écart géographique du niveau des prix", en: "Spatial gap in price levels" },
      flow: "pilotable",
      tier: "T1",
      sources: ["insee_ecsp"],
      mesures: [
        {
          key: "coef_idf_province",
          label: { fr: "Écart Île-de-France / province sur l'alimentation", en: "Île-de-France versus provinces gap on food" },
          unit: "%",
          stat: "coefficient",
          availability: "open_data",
          note: {
            fr: "Environ +7 % sur les produits alimentaires, mesuré en 2022 et republié tous les cinq à six ans. C'est le seul écart de niveau officiel qui existe en France.",
            en: "About +7 % on food, measured in 2022 and republished every five or six years. It is the only official level gap that exists in France.",
          },
        },
        {
          key: "coef_ville",
          label: { fr: "Écart de prix entre deux villes", en: "Price gap between two cities" },
          unit: "%",
          stat: "coefficient",
          availability: "unavailable",
          note: {
            fr: "N'existe pas. Une étude sur données de caisses l'a estimé une fois, en 2019, sans être reconduite ni transformée en série. Il n'y a rien à brancher.",
            en: "Does not exist. One checkout-data study estimated it once, in 2019; it was never repeated nor turned into a series. There is nothing to plug in.",
          },
        },
        {
          key: "coef_quartier",
          label: { fr: "Écart de prix entre deux quartiers", en: "Price gap between two neighbourhoods" },
          unit: "%",
          stat: "coefficient",
          availability: "unavailable",
          note: {
            fr: "N'existe nulle part, ni à l'Insee ni ailleurs. C'est la demande la plus fréquente et la plus impossible : elle est affichée comme non disponible, pas comblée par un chiffre plausible.",
            en: "Exists nowhere, at Insee or anywhere else. The most frequent and most impossible request: shown as unavailable, not filled in with a plausible number.",
          },
        },
      ],
    },
    {
      key: "ecart_enseignes",
      label: { fr: "Écart de prix entre enseignes", en: "Price gap between retail chains" },
      flow: "pilotable",
      tier: "T3",
      sources: ["insee_ipgd", "ufc_palmares", "convention_wherewise"],
      mesures: [
        {
          key: "ipgd_evolution",
          label: { fr: "Évolution des prix par forme de vente", en: "Price change by retail format" },
          unit: "% sur un an",
          stat: "coefficient",
          availability: "open_data",
          note: {
            fr: "Officiel, mensuel, bâti sur les données de caisses — et c'est une évolution, pas un niveau. Il distingue hypermarché, supermarché et hard discount, jamais Lidl de Carrefour.",
            en: "Official, monthly, built on checkout data — and it is a change, not a level. It separates hypermarket, supermarket and hard discount, never Lidl from Carrefour.",
          },
        },
        {
          key: "coef_enseigne",
          label: { fr: "Coefficient de niveau de prix par enseigne", en: "Price-level coefficient by chain" },
          unit: "%",
          stat: "coefficient",
          availability: "hypothesis",
          note: {
            fr: "Aucun indice officiel ne descend à l'enseigne. Le seul comparatif public est le palmarès annuel d'une association de consommateurs, dont la méthode et le panier lui appartiennent : nous le citons et nous y renvoyons, nous ne recopions pas ses coefficients dans un total. Le lecteur pose lui-même l'écart qu'il constate, la ligne est marquée « hypothèse », et elle est à zéro par défaut.",
            en: "No official index goes down to the chain. The only public comparison is a consumer association's annual ranking, whose basket and method are its own: we cite it and link to it, we do not copy its coefficients into a total. The reader sets the gap they observe themselves, the line is marked “assumption”, and it defaults to zero.",
          },
        },
        {
          key: "coef_format",
          label: { fr: "Effet du format de magasin sur le panier", en: "Effect of store format on the basket" },
          unit: "%",
          stat: "coefficient",
          availability: "hypothesis",
          note: {
            fr: "Plausible et non mesuré au niveau où on en aurait besoin. Désactivé par défaut : une hypothèse allumée d'office finit par passer pour une mesure.",
            en: "Plausible and unmeasured at the level where it would be needed. Off by default: an assumption switched on by default ends up read as a measurement.",
          },
        },
      ],
    },
    {
      key: "prix_releves",
      label: { fr: "Prix relevés en magasin", en: "Prices recorded in store" },
      flow: "pilotable",
      tier: "T3",
      sources: ["open_prices"],
      mesures: [
        {
          key: "prix_produit_magasin",
          label: { fr: "Prix d'un produit dans un point de vente donné", en: "Price of a product at a given store" },
          unit: "€",
          stat: "median",
          availability: "open_data",
          note: {
            fr: "Sous licence ouverte et rattaché à un magasin précis — la seule voie qui pourrait un jour transformer le coefficient d'enseigne en mesure.",
            en: "Openly licensed and tied to an actual store — the only route that could one day turn the chain coefficient into a measurement.",
          },
        },
        {
          key: "couverture_releves",
          label: { fr: "Nombre de relevés disponibles dans la zone", en: "Number of price records available in the area" },
          unit: "relevés",
          stat: "count",
          availability: "open_data",
          note: {
            fr: "À lire avant tout le reste : la contribution est bénévole, donc dense dans quelques villes et quasi nulle ailleurs. En dessous d'un seuil, la zone n'a pas de prix relevé et doit le dire.",
            en: "To be read before anything else: contributions are volunteered, so dense in a few cities and near zero elsewhere. Below a threshold the area has no recorded price, and must say so.",
          },
        },
      ],
    },
    {
      key: "acces_commerces",
      label: { fr: "Accès aux commerces alimentaires", en: "Access to food shops" },
      flow: "contexte",
      tier: "T1",
      sources: ["insee_bpe", "ban_itineraire"],
      mesures: [
        {
          key: "distance_commerce",
          label: { fr: "Distance jusqu'au commerce alimentaire le plus proche", en: "Distance to the nearest food shop" },
          unit: "km",
          stat: "median",
          availability: "open_data",
          note: {
            fr: "C'est ici que l'alimentation devient vraiment de l'argent : un quartier bon marché loin de tout rend en carburant ce qu'il économise en loyer. Le calcul se fait dans la mobilité.",
            en: "This is where food genuinely becomes money: a cheap neighbourhood far from everything gives back in fuel what it saves in rent. The arithmetic sits under mobility.",
          },
        },
        {
          key: "nb_commerces_format",
          label: { fr: "Nombre de commerces par format à proximité", en: "Number of shops by format nearby" },
          unit: "commerces",
          stat: "count",
          availability: "open_data",
          note: {
            fr: "Mesure une accessibilité, pas une gamme ni un prix. La présence d'une enseigne discount ne dit rien de ce qu'on y trouve.",
            en: "Measures access, not range or price. A discount chain being present says nothing about what is on its shelves.",
          },
        },
      ],
    },
  ],
};
