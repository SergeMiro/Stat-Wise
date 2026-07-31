export const fr = {
  localeName: "Français",
  brand: {
    name: "StatWise",
    slogan: "Prenez de meilleures décisions pour votre vie grâce aux données.",
  },
  nav: {
    home: "Accueil",
    simulate: "Simuler",
    favorites: "Favoris",
    results: "Résultats",
    account: "Compte",
    methodology: "Méthodologie",
    sources: "Sources",
    coverage: "Couverture",
    privacy: "Confidentialité",
    terms: "Conditions",
    signIn: "Se connecter",
  },
  common: {
    back: "Retour",
    next: "Continuer",
    start: "Commencer",
    seeResults: "Voir les résultats",
    save: "Enregistrer",
    loading: "Chargement…",
    errorTitle: "Une erreur est survenue",
    errorBody: "Réessayez dans un instant.",
    retry: "Réessayer",
    comingSoon: "Bientôt disponible",
    optional: "facultatif",
    edit: "Modifier",
    reset: "Réinitialiser",
    close: "Fermer",
    language: "Langue",
    skip: "Passer",
  },
  home: {
    heroTitle: "Trouvez le quartier adapté à votre vie et à votre famille.",
    heroSubtitle:
      "StatWise transforme les données publiques officielles françaises en décisions claires sur où habiter.",
    startJob: "Trouver mon job",
    startQuartier: "Trouver mon quartier",
    startFamily: "Grandir ici",
    jobTitle: "Trouver mon job",
    jobDesc:
      "Un salaire plus élevé ailleurs vous laisse-t-il vraiment plus d'argent ? Comparez ce qui reste une fois toutes les factures payées.",
    quartierTitle: "Trouver mon quartier",
    quartierDesc:
      "Classez les zones d'une ville selon votre budget, vos déplacements et vos priorités.",
    familyTitle: "Grandir ici",
    familyDesc:
      "Comparez jusqu'à trois quartiers à travers les besoins d'un enfant et du quotidien.",
    howTitle: "Comment ça marche",
    steps: [
      {
        title: "Décrivez votre situation",
        desc: "Ville, budget, mode de vie et priorités. Quelques étapes courtes.",
      },
      {
        title: "Nous analysons les zones",
        desc: "Un calcul transparent à partir de données officielles, sans boîte noire.",
      },
      {
        title: "Vous obtenez des zones à explorer",
        desc: "Un classement expliqué, avec ses limites et ce qu'il faut vérifier.",
      },
    ],
    dataTitle: "Des données officielles, expliquées",
    dataDesc:
      "Équipements (INSEE BPE), prix (DVF), loyers, écoles, accès aux médecins (APL) et délinquance enregistrée. Chaque indicateur indique sa source, sa date et son niveau géographique.",
    seeMethodology: "Lire la méthodologie",
    seeSources: "Voir les sources",
    disclaimer:
      "Les résultats sont indicatifs et fondés sur les données officielles disponibles. Ils ne constituent ni une garantie ni un conseil personnalisé.",
  },
  wizard: {
    jobTitle: "Trouver mon job",
    quartierTitle: "Trouver mon quartier",
    familyTitle: "Grandir ici",
    stepOf: "Étape {current} sur {total}",
    leaveTitle: "Vos réponses sont enregistrées",
    draftSaved: "Brouillon enregistré",
    steps: {
      city: {
        title: "Quelle ville ?",
        desc: "Choisissez la commune à analyser. Une ville par simulation en V1.",
        searchPlaceholder: "Rechercher une ville ou un code postal",
        noResults: "Aucune ville trouvée. Essayez Dijon, Lyon, Versailles ou Avignon.",
        limited: "Couverture limitée — résultats au niveau communal.",
      },
      housing: {
        title: "Quel type de logement ?",
        desc: "Cela oriente les indicateurs de prix et de loyer utilisés.",
        mode: "Vous souhaitez",
        modeRent: "Louer",
        modeBuy: "Acheter",
        modeBoth: "Les deux",
        type: "Type de bien",
        typeApartment: "Appartement",
        typeHouse: "Maison",
        typeAny: "Peu importe",
        rooms: "Nombre de pièces minimum",
        surface: "Surface minimum (m²)",
      },
      budget: {
        title: "Quel budget ?",
        desc: "Indicatif. Vous pouvez explorer sans préciser de budget.",
        rentMax: "Loyer mensuel maximum",
        rentCharges: "Charges comprises",
        purchaseMax: "Budget d'achat maximum",
        perMonth: "/ mois",
        noBudget: "Je veux d'abord explorer les quartiers",
      },
      situation: {
        title: "Votre situation",
        desc: "Pour adapter l'importance des écoles, crèches et déplacements.",
        household: "Foyer",
        single: "Une personne",
        couple: "En couple",
        family: "Famille",
        familyChild: "Famille avec enfant",
        hasCar: "Je dispose d'une voiture",
        usesTransport: "Je suis prêt·e à utiliser les transports",
      },
      priorities: {
        title: "Vos priorités",
        desc: "Réglez l'importance de chaque thème. C'est ce qui pèse le plus dans le classement.",
        sportLabel: "Sport & loisirs",
      },
      constraints: {
        title: "Critères indispensables",
        desc: "Une zone qui ne respecte pas un critère indispensable est écartée avant le classement.",
        requireTransport: "Transports en commun à proximité",
        requireSchool: "École à proximité",
        requireCreche: "Crèche à proximité",
        strictBudget: "Ne pas dépasser mon budget",
      },
    },
    generate: "Analyser les quartiers",
  },
  categories: {
    housing: "Logement",
    mobility: "Mobilité",
    services: "Services du quotidien",
    health: "Santé",
    tranquillity: "Tranquillité",
    family: "Famille",
    nature: "Nature & loisirs",
  },
  priorityLevels: {
    "0": "Pas important",
    "1": "Un peu",
    "2": "Important",
    "3": "Essentiel",
  },
  confidence: {
    high: { label: "Données solides", desc: "Bon volume et niveau géographique adapté." },
    medium: { label: "Données partielles", desc: "Une partie des données est au niveau communal." },
    low: {
      label: "Données limitées",
      desc: "Peu de transactions ou de points, ou données anciennes.",
    },
    unavailable: { label: "Données indisponibles", desc: "Pas de données — ce n'est pas un zéro." },
  },
  result: {
    title: "Quartiers à explorer",
    subtitle: "Classement pour {city}, du plus au moins adapté à vos critères.",
    overallMatch: "Correspondance",
    dataConfidence: "Fiabilité des données",
    whyItFits: "Pourquoi cette zone vous convient",
    thingsToVerify: "À vérifier vous-même",
    missingTitle: "Données manquantes",
    missingCategory: "{category} : donnée non disponible pour cette zone",
    sources: "Sources",
    analysedArea: "zone analysée",
    commune: "commune",
    compare: "Comparer",
    compareTitle: "Comparaison",
    addToCompare: "Ajouter à la comparaison",
    removeFromCompare: "Retirer",
    compareHint: "Sélectionnez jusqu'à 3 zones à comparer.",
    noScore: "Score indisponible",
    excludedTitle: "{count} zone(s) écartée(s)",
    excludedDesc: "Ces zones ne respectent pas un critère indispensable.",
    goToFamily: "Comparer pour un enfant",
    restart: "Nouvelle simulation",
    saveCta: "Enregistrer cette simulation",
    saveHint: "Créez un compte pour retrouver vos simulations. (Bientôt)",
    topMatch: "Meilleure correspondance",
    summaryTitle: "Aperçu du résultat",
    summaryNote: "Aperçu visuel du produit — ce n'est pas une carte géographique exacte.",
    summaryAreas: "{count} zone(s) analysée(s)",
    tryAnotherScenarioTitle: "Et si votre situation changeait ?",
    tryAnotherScenarioDescription: "Relancez l'analyse en modifiant un seul paramètre.",
    scenarioBudgetTighter: "Budget réduit de 10 %",
    scenarioWithoutCar: "Sans voiture",
    scenarioMoreNature: "Plus de nature",
    scenarioBuyInstead: "Acheter au lieu de louer",
  },
  explanations: {
    strengths: {
      strong_housing: "Bon rapport budget / logement",
      strong_mobility: "Déplacements faciles",
      strong_services: "Services du quotidien nombreux",
      strong_health: "Bon accès aux soins",
      calm_area: "Délinquance enregistrée plus basse",
      family_friendly: "Bien équipé pour les familles",
      green_area: "Parcs et espaces de loisirs",
    },
    caveats: {
      rent_commune_level: "Le loyer est un repère communal, pas un prix de quartier.",
      low_transaction_count: "Peu de transactions : prix d'achat à interpréter avec prudence.",
      over_budget_soft: "Au-dessus de votre budget indicatif.",
      crime_commune_level: "La donnée de délinquance est au niveau communal.",
      apl_commune_level: "L'accès aux médecins (APL) est mesuré au niveau communal.",
      creche_not_guaranteed: "La présence de crèches ne garantit pas une place.",
      school_sector_not_guaranteed: "La présence d'écoles ne garantit pas la sectorisation.",
    },
    excluded: {
      no_transport: "Pas de transport en commun à proximité",
      no_school_nearby: "Pas d'école à proximité",
      no_creche_nearby: "Pas de crèche à proximité",
      over_rent_budget: "Loyer supérieur au budget strict",
      over_purchase_budget: "Prix d'achat supérieur au budget strict",
    },
  },
  pages: {
    methodology: {
      title: "Méthodologie",
      intro: "Comment StatWise calcule un classement, ce qu'il mesure et ce qu'il ne mesure pas.",
      sections: [
        {
          title: "Ce que nous calculons",
          body: "Un classement des zones d'une ville selon vos priorités, à partir d'indicateurs officiels normalisés à l'intérieur de la ville choisie.",
        },
        {
          title: "Ce que nous ne calculons pas",
          body: "Aucun « meilleur quartier » absolu, aucune garantie de sécurité, de place en crèche ou de prix exact d'un logement précis.",
        },
        {
          title: "Niveaux géographiques",
          body: "IRIS quand c'est possible, sinon commune. Le niveau réel est toujours affiché. Une zone IRIS est appelée « zone analysée ».",
        },
        {
          title: "Fiabilité des données",
          body: "Chaque zone reçoit un niveau de fiabilité (solides, partielles, limitées, indisponibles) selon la couverture des indicateurs que vous avez jugés importants.",
        },
        {
          title: "Pondération",
          body: "Vos priorités (de « pas important » à « essentiel ») deviennent des poids. Seuls les thèmes qui comptent pour vous pèsent dans le score.",
        },
        {
          title: "Données manquantes",
          body: "Une donnée absente n'est jamais remplacée par zéro : elle réduit la fiabilité et est signalée.",
        },
        {
          title: "Ne pas mélanger les indicateurs",
          body: "Salaire, revenu médian, loyer et prix d'achat sont des mesures distinctes, avec des méthodes et des précisions différentes.",
        },
      ],
      engineVersion: "Version du moteur de calcul",
    },
    sources: {
      title: "Sources",
      intro: "Les jeux de données officiels utilisés, leur niveau géographique et leurs limites.",
      columns: { source: "Source", publisher: "Éditeur", level: "Niveau", purpose: "Usage" },
    },
    coverage: {
      title: "Couverture",
      intro:
        "Où StatWise dispose de données suffisantes, et où les résultats restent au niveau communal.",
      richTitle: "Villes pilotes",
      richDesc: "Couverture par zone (IRIS) pour la V1.",
      limitedTitle: "Couverture limitée",
      limitedDesc: "Résultats au niveau communal uniquement.",
    },
    privacy: {
      title: "Confidentialité",
      intro: "StatWise applique la minimisation des données.",
      collectedTitle: "Données utilisées",
      collected: [
        "ville choisie",
        "zones sélectionnées",
        "budget approximatif",
        "tranche d'âge de l'enfant",
        "type de foyer et priorités",
      ],
      notCollectedTitle: "Données jamais collectées en V1",
      notCollected: [
        "adresse précise du domicile",
        "nom ou date de naissance d'un enfant",
        "données médicales ou bancaires",
        "historique de géolocalisation",
      ],
    },
    terms: {
      title: "Conditions d'utilisation",
      intro: "Résumé indicatif pour la V1.",
      body: "StatWise fournit une aide à la décision fondée sur des données publiques. Les résultats sont indicatifs et n'engagent pas la responsabilité de l'éditeur. Vérifiez toujours les informations clés avant toute décision.",
    },
  },
  footer: {
    tagline: "Mieux décider où vivre, grâce aux données.",
    legal: "Données officielles françaises. Résultats indicatifs.",
    product: "Produit",
    about: "À propos",
  },
  notFound: {
    title: "Page introuvable",
    body: "Cette page n'existe pas ou a été déplacée.",
    home: "Retour à l'accueil",
  },
  emptyStates: {
    favoritesDesc:
      "Vos quartiers préférés apparaîtront ici. Lancez une simulation pour en ajouter.",
    historyDesc: "Vos simulations récentes apparaîtront ici, prêtes à être relancées.",
    accountDesc:
      "Bientôt : sauvegarde de vos résultats et favoris, synchronisés entre vos appareils. Vous pouvez lancer une simulation sans compte.",
  },
  family: {
    title: "Grandir ici",
    subtitle: "Comparez des quartiers à travers les besoins d'un enfant, pour son âge.",
    steps: {
      areas: {
        title: "Quels quartiers comparer ?",
        desc: "Choisissez 1 à 3 zones à comparer pour votre enfant.",
        pickCity: "Choisissez d'abord une ville",
        selectHint: "Sélectionnez jusqu'à 3 zones.",
        selectedCount: "{count}/3 sélectionnée(s)",
        changeCity: "Changer de ville",
        limited: "Couverture limitée — résultats au niveau communal.",
        fromQuartier: "Reprises de votre recherche de quartier.",
      },
      child: {
        title: "Parlez-nous de l'enfant",
        desc: "L'âge change fortement ce qui compte dans le quartier.",
        count: "Nombre d'enfants",
        count1: "1",
        count2: "2",
        count3: "3 ou +",
        age: "Tranche d'âge",
      },
      priorities: {
        title: "Vos priorités familiales",
        desc: "Réglez l'importance de chaque thème pour votre famille.",
      },
    },
    generate: "Comparer les quartiers",
    ages: {
      "0_2": { label: "0–2 ans", desc: "Petite enfance : crèches, pédiatres, calme, parcs." },
      "3_5": { label: "3–5 ans", desc: "Maternelle : école, éveil, espaces verts." },
      "6_10": { label: "6–10 ans", desc: "Élémentaire : école, sport, périscolaire." },
      "11_14": { label: "11–14 ans", desc: "Collège : établissement, transports, sport." },
      "15_17": { label: "15–17 ans", desc: "Lycée : établissement, transports, autonomie." },
    },
    categories: {
      earlyChildhood: "Petite enfance",
      education: "Éducation",
      health: "Santé",
      sportsAndLeisure: "Sport & loisirs",
      nature: "Nature",
      mobility: "Mobilité",
      tranquillity: "Tranquillité",
      dailyServices: "Services du quotidien",
    },
    result: {
      title: "Comparaison pour votre enfant",
      subtitle: "Adaptée à la tranche {age}, pour {city}.",
      forAge: "Pour la tranche {age}",
      bestForAge: "Le plus adapté à cet âge",
      categoriesTitle: "Détail par thème",
      strengthsTitle: "Points forts",
      toVerifyTitle: "À vérifier vous-même",
      restart: "Modifier la comparaison",
      empty: {
        title: "Aucune comparaison",
        desc: "Sélectionnez des quartiers et un âge pour lancer la comparaison.",
        cta: "Lancer « Grandir ici »",
      },
      disclaimer:
        "Comparaison indicative fondée sur des données officielles. StatWise ne garantit ni une place en crèche ou en école, ni la sectorisation, ni la sécurité.",
    },
    strengths: {
      strong_earlyChildhood: "Bien équipé pour les tout-petits",
      strong_education: "Offre scolaire adaptée à l'âge",
      strong_health: "Bon accès aux soins",
      strong_sportsAndLeisure: "Sport & loisirs variés",
      strong_nature: "Parcs et espaces verts",
      strong_mobility: "Déplacements faciles",
      strong_tranquillity: "Environnement calme",
      strong_dailyServices: "Commerces & services proches",
    },
    actions: {
      visit_area: "Visitez le quartier à différents moments de la journée.",
      confirm_creche_place: "Confirmez la disponibilité d'une place en crèche auprès de la mairie.",
      verify_school_sector: "Vérifiez la sectorisation scolaire exacte auprès de la mairie.",
      check_transport_autonomy:
        "Testez les trajets en transport pour l'autonomie de l'adolescent·e.",
      check_health_access: "Vérifiez les délais et la disponibilité des professionnels de santé.",
    },
    caveats: {
      family_no_guarantee:
        "Aucune garantie de place, de sectorisation, de sécurité ou de réussite scolaire.",
      creche_not_guaranteed: "La présence de crèches ne garantit pas une place.",
      school_sector_not_guaranteed: "La présence d'écoles ne garantit pas la sectorisation.",
      crime_commune_level: "La donnée de délinquance est au niveau communal.",
      apl_commune_level: "L'accès aux médecins (APL) est mesuré au niveau communal.",
    },
  },
  job: {
    title: "Trouver mon job",
    subtitle:
      "Un salaire plus élevé ailleurs ne vaut que ce qu'il en reste. Comparez le reste à vivre entre votre situation actuelle et l'offre que vous étudiez.",
    sections: {
      startTitle: "Ce que la simulation va vous demander",
      reassurance:
        "Ne vous laissez pas décourager par la liste : cela vous prendra environ deux minutes, et vous n'avez besoin d'aucun document. Tout est déjà coché — décochez simplement ce qui ne vous concerne pas, et nous ne vous le demanderons pas.",
      startCta: "Commencer la simulation",
      editTitle: "Ajouter ou retirer des sections",
      editDesc:
        "Vous pouvez rallumer une section à tout moment. Vous reviendrez ensuite là où vous en étiez, et « Continuer » vous emmènera dans celles que vous venez d'ajouter.",
      editCta: "Revenir à la simulation",
      headerButton: "Sections",
      legendFilled: "remplie",
      legendPending: "à remplir",
      legendDisabled: "désactivée",
      requiredNote: "Indispensable : sans elle il n'y a rien à comparer.",
      names: {
        today: "Votre situation aujourd'hui",
        offer: "L'offre que vous étudiez",
        household: "Votre foyer",
        travel: "Déplacements et véhicule",
        dividends: "Dividendes",
        rental: "Revenus fonciers",
        aide: "Aides sociales (CAF)",
        family: "Trajets vers vos proches",
        other: "Le reste de votre budget",
      },
      descriptions: {
        today: "Ville, quartier, loyer, salaire, trajet actuel",
        offer: "Ville et salaire proposés",
        household: "Adultes, enfants, crèche",
        travel: "Voiture ou transports, thermique ou électrique, courses",
        dividends: "Revenus de placements, nets",
        rental: "Loyers que vous percevez, nets",
        aide: "APL, allocations — ce que vous touchez aujourd'hui",
        family: "Distance et nombre de visites par an",
        other: "Assurances, téléphone, loisirs, abonnements",
      },
    },
    metric: "Reste à vivre",
    metricDesc: "Ce qui reste chaque mois une fois toutes les factures payées.",
    generate: "Comparer les deux situations",
    computing: "Calcul en cours…",
    steps: {
      today: {
        title: "Votre situation aujourd'hui",
        desc: "Ce côté-là est du fait, pas de l'estimation : c'est lui qui ancre la comparaison.",
      },
      offer: {
        title: "L'offre que vous étudiez",
        desc: "Le logement et les trajets seront estimés à partir des données de la ville.",
      },
      household: {
        title: "Votre foyer",
        desc: "Le foyer décide de l'alimentation, de l'eau et de la crèche.",
      },
      travel: {
        title: "Vos déplacements",
        desc: "Deux usages, souvent deux modes : aller travailler, et faire les courses.",
      },
      family: {
        title: "Vos proches",
        desc: "La vraie raison qui fait renoncer à un déménagement, et que personne ne chiffre.",
      },
      dividends: {
        title: "Dividendes",
        desc: "Revenus de placements, nets. Laissez à zéro si vous n'en avez pas.",
      },
      rental: {
        title: "Revenus fonciers",
        desc: "Loyers que vous percevez, nets. Laissez à zéro si vous n'en avez pas.",
      },
      aide: {
        title: "Aides sociales",
        desc: "Ce que vous percevez aujourd'hui. Nous ne le reporterons pas sur l'autre ville.",
      },
      other: {
        title: "Le reste de votre budget",
        desc: "Une seule somme, et le montant qui vous reste devient enfin juste.",
      },
    },
    fields: {
      city: "Ville",
      district: "Quartier",
      districtHint: "Le quartier fixe le loyer au m², la distance au travail et au commerce.",
      netSalary: "Salaire net mensuel",
      netSalaryHint: "Avant impôt sur le revenu.",
      partnerSalary: "Second salaire du foyer",
      partnerSalaryNone: "Aucun second salaire",
      rent: "Loyer que vous payez, charges comprises",
      housingType: "Type de logement",
      apartment: "Appartement",
      house: "Maison",
      surface: "Surface (m²)",
      oneWayKm: "Distance domicile-travail (aller simple, km)",
      targetCity: "Ville de l'offre",
      targetSalary: "Salaire net proposé",
      targetSurface: "Surface visée (m²)",
      adults: "Adultes",
      children: "Enfants à charge",
      childrenInCreche: "Enfants en crèche",
      crecheHours: "Heures de crèche par mois",
      commuteMode: "Pour aller travailler",
      errandsMode: "Pour faire les courses",
      daysOnSite: "Jours sur site par semaine",
      vehicleEnergy: "Votre véhicule",
      thermique: "Thermique",
      electrique: "Électrique",
      hybridNote:
        "Un hybride relève du barème thermique : choisissez « Thermique » et indiquez sa consommation réelle.",
      litresPer100Km: "Consommation (L/100 km)",
      kwhPer100Km: "Consommation (kWh/100 km)",
      homeChargingShare: "Part rechargée à domicile",
      homeChargingHint:
        "Sans place de parking, c'est 0 %. L'écart entre tarif domestique et borne publique pèse plus que l'écart de prix du carburant entre deux villes.",
      tripsPerMonth: "Courses par mois",
      bikeAmortization: "Amortissement du vélo",
      bikeAmortizationHint:
        "Aucune donnée publique ne chiffre ce poste. Choisissez le montant annuel que vous acceptez : il sera affiché comme votre hypothèse, pas comme une mesure.",
      bikeCustom: "Montant annuel retenu (€/an)",
      perYear: "€/an",
      sameAsToday: "Comme aujourd'hui",
      familyKmCurrent: "Distance jusqu'à vos proches aujourd'hui (km)",
      familyKmTarget: "Distance depuis la ville de l'offre (km)",
      familyTripsPerYear: "Nombre de visites par an",
      familyHint:
        "Aller simple. C'est souvent la vraie raison qui fait renoncer à un déménagement, et personne ne la chiffre.",
      otherMonthly: "Tout le reste de votre budget mensuel",
      otherMonthlyHint:
        "Assurances, mutuelle, téléphone, internet, vêtements, loisirs, restaurants, abonnements, coiffeur, sport, animaux, cadeaux, banque, crédits. Une seule somme : ces postes ne changent pas d'une ville à l'autre, donc ils ne faussent pas la comparaison — mais sans eux le montant restant est trop optimiste.",
      removalCost: "Coût du déménagement (€)",
      dividendsMonthly: "Dividendes nets par mois",
      rentalMonthly: "Revenus fonciers nets par mois",
      declaredBenefitsMonthly: "Aides perçues aujourd'hui, par mois",
      placeInvariantHint:
        "Ce revenu ne change pas avec la ville : il rend juste le montant qui vous reste, sans influencer la comparaison.",
      declaredBenefitsHint:
        "Ce que la CAF vous verse aujourd'hui : APL, allocations. Compté sur votre situation actuelle uniquement — dans l'autre ville le montant sera différent, parce que l'aide au logement dépend du loyer et de la zone.",
    },
    modes: {
      voiture: "Voiture",
      transports: "Transports en commun",
      actif: "Vélo ou marche",
    },
    bike: {
      walk: "Marche à pied — aucun vélo",
      usedBike: "Vélo mécanique d'occasion",
      newBike: "Vélo mécanique neuf",
      electricBike: "Vélo à assistance électrique",
    },
    lines: {
      salaire: "Salaire net (avant impôt sur le revenu)",
      salaire_conjoint: "Second salaire net du foyer",
      prise_en_charge_transport: "Prise en charge employeur de l'abonnement",
      loyer_reel: "Loyer, charges comprises",
      loyer_estime: "Loyer estimé, charges comprises",
      electricite: "Électricité",
      eau: "Eau et assainissement",
      carburant: "Carburant",
      recharge_domicile: "Recharge du véhicule à domicile",
      recharge_publique: "Recharge sur bornes publiques",
      borne_domicile: "Installation d'une borne à domicile",
      usage_vehicule: "Usage du véhicule (entretien, assurance, dépréciation)",
      abonnement_transport: "Abonnement {network}",
      courses_transport: "Courses en transport en commun",
      velo_amortissement: "Vélo — amortissement et entretien",
      creche: "Crèche (participation familiale)",
      alimentation: "Alimentation à domicile",
      dividendes: "Dividendes",
      revenus_fonciers: "Revenus fonciers",
      prestations_declarees: "Aides que vous percevez aujourd'hui",
      deplacements_famille: "Trajets vers vos proches",
      autres_depenses: "Le reste de votre budget",
      depot_garantie: "Dépôt de garantie",
      honoraires_agence: "Honoraires d'agence",
      demenagement: "Déménagement",
      double_loyer: "Chevauchement de loyers",
      impot_revenu: "Impôt sur le revenu",
      prestations: "APL, allocations familiales, prime d'activité",
      assurances: "Assurance habitation, mutuelle",
      charges_copro: "Charges de copropriété non incluses dans le loyer",
      taxe_fonciere: "Taxe foncière",
      taxe_habitation: "Taxe d'habitation",
      cmg: "Complément mode de garde (CMG)",
      stationnement: "Stationnement résidentiel et péages",
    },
    basis: {
      user_input: "Montant que vous avez saisi.",
      rent_actual:
        "Loyer réel que vous payez aujourd'hui — c'est le point d'ancrage de la comparaison.",
      employer_share:
        "{share} % de l'abonnement {network} ({pass} €), obligation légale de l'employeur.",
      rent_estimated:
        "{perSqm} €/m² × {surface} m² — indicateur de loyer d'annonce de la commune, pas du quartier.",
      electricity:
        "{kwhYear} kWh/an par point de livraison résidentiel du secteur × {price} €/kWh, plus l'abonnement. Moyenne du secteur, pas la consommation du logement visé.",
      water:
        "{pricePerM3} €/m³ (tarif du service) × {m3PerPerson} m³/personne/an, hypothèse de consommation.",
      purpose_both:
        "{commuteKm} km domicile-travail + {groceryKm} km de courses ({groceryOneWay} km jusqu'au commerce alimentaire le plus proche, aller simple)",
      purpose_commute: "{commuteKm} km domicile-travail",
      purpose_groceries:
        "{groceryKm} km de courses ({groceryOneWay} km jusqu'au commerce alimentaire le plus proche, aller simple)",
      fuel: "{purpose} = {totalKm} km/mois × {litres} L/100 km × {price} €/L, prix moyen des stations de la ville.",
      charge_home:
        "{purpose} = {totalKm} km/mois × {kwhPer100} kWh/100 km, dont {sharePct} % rechargés à domicile, soit {kwh} kWh × {price} €/kWh. Ce montant s'ajoute à la ligne Électricité : la consommation du secteur ne tient pas compte d'un véhicule.",
      charge_public:
        "{purpose} — les {sharePct} % rechargés hors domicile, soit {kwh} kWh à {price} €/kWh. Hypothèse : les tarifs des bornes publiques varient fortement selon l'opérateur et la puissance, et aucun relevé officiel exploitable n'existe.",
      vehicle_use: "{km} km/mois × {perKm} €/km, forfait national dérivé du barème kilométrique.",
      vehicle_use_ev:
        "{km} km/mois × {perKm} €/km : le forfait de {base} €/km majoré de {upliftPct} % comme le prévoit le barème kilométrique pour un véhicule 100 % électrique. Attention : cette majoration fiscale couvre aussi la recharge, que nous comptons séparément — nous l'appliquons donc ici à l'usure et à la dépréciation seules. C'est une hypothèse, pas la règle fiscale.",
      income_tax:
        "Calculé par le moteur de règles OpenFisca-France sur la législation {year}, à partir de votre foyer fiscal. Le salaire imposable est estimé à partir du net (+2 % environ, part non déductible de la CSG) : c'est le point faible de ce calcul.",
      place_invariant_income:
        "Montant que vous avez déclaré. Ce revenu ne change pas avec la ville : il rend le montant restant juste, sans peser sur la comparaison.",
      declared_benefits:
        "Montant que vous percevez aujourd'hui, tel que vous l'avez déclaré. Compté uniquement sur votre situation actuelle.",
      transit_pass:
        "Grille tarifaire du réseau, relevée à la main — les abonnements ne figurent pas dans les données ouvertes.",
      transit_free:
        "Le réseau {network} est gratuit pour les habitants de la métropole : l'abonnement ne coûte rien, et la prise en charge employeur de 50 % n'a donc rien à couvrir. Il faut demander le pass nominatif et le renouveler chaque année.",
      errands_covered_by_pass:
        "Aucun coût supplémentaire : l'abonnement {network} est déjà payé pour le trajet domicile-travail et couvre ces {journeys} trajets.",
      errands_tickets:
        "{journeys} trajets × {ticket} € le ticket. La prise en charge employeur de 50 % ne concerne que le trajet domicile-travail, jamais les courses.",
      bike_amortization:
        "{perYear} €/an que vous avez retenus, répartis sur 12 mois, pour {km} km/mois. Aucune donnée publique ne chiffre ce poste : le montant est votre hypothèse, pas une mesure.",
      bike_none:
        "Aucun amortissement retenu pour {km} km/mois — marche à pied, ou vélo déjà amorti.",
      creche:
        "Barème PSU {vintage}, {hours} h/mois. Le barème est national : il ne varie pas d'une ville à l'autre. Obtenir une place, si.",
      food_paris:
        "Panier de référence national + {premium} % (écart Île-de-France mesuré par l'enquête Insee de 2022). Aucune donnée officielle n'existe au niveau du quartier.",
      food_province:
        "Panier de référence national. Aucun écart de prix alimentaire n'est mesuré officiellement en dehors de l'Île-de-France, de la Corse et des DOM.",
      family_travel:
        "{oneWayKm} km aller simple × 2 × {trips} trajets par an = {monthlyKm} km/mois × {perKm} €/km (énergie + usure de votre véhicule). Le nombre de trajets est votre habitude, pas une mesure.",
      declared_other:
        "Montant que vous avez déclaré pour tout ce qui ne change pas avec la ville : assurances, mutuelle, téléphone, internet, vêtements, loisirs, abonnements. Volontairement hors du calcul comparable, puisqu'il est identique des deux côtés.",
      deposit:
        "Un mois de loyer hors charges, soit {rent} € moins {chargesShare} % de charges estimées. Il vous est rendu à la sortie, mais il faut l'avancer.",
      agency_fee:
        "Plafond légal de {cap} €/m² pour cette zone × {surface} m². C'est un maximum : une location entre particuliers coûte 0 €.",
    },
    reasons: {
      impot_revenu:
        "Nécessite le moteur de règles OpenFisca et la configuration complète du foyer fiscal. Non intégré : le reste à vivre affiché est donc avant impôt.",
      prestations:
        "Aide au logement, allocations familiales, RSA, prime d'activité. Le moteur de règles répond — mais faux : sans enfant il renvoie 0 €, et avec un seul enfant il saute à 426,77 € pour un foyer gagnant 2 300 €/mois avec 900 € de loyer, des deux côtés à la fois. Le revenu cesse d'être compté dès qu'un enfant est déclaré, parce que la base de ressources se construit sur l'année N-2 et sur un statut de parent isolé que nous n'établissons pas. Un chiffre crédible mais faux de ~400 €/mois aurait flatté tous les foyers avec enfants : nous préférons le vide, jusqu'à ce que la base de ressources soit faite correctement.",
      assurances:
        "Aucune donnée publique ne donne la prime par commune : ces tarifs appartiennent aux assureurs.",
      charges_copro:
        "L'indicateur de loyer utilisé est charges comprises ; les charges réelles varient d'un immeuble à l'autre et ne sont pas publiées.",
      taxe_fonciere:
        "Ne concerne que les propriétaires. Cette version compare deux situations de location.",
      taxe_habitation:
        "Supprimée sur la résidence principale depuis 2023. Elle n'est donc pas comptée.",
      cmg: "Concerne l'assistante maternelle et la garde à domicile, pas la crèche PSU. À intégrer avec OpenFisca si vous comparez ces modes de garde.",
      prestations_target:
        "Vous avez déclaré ce que vous percevez aujourd'hui, et nous ne le reportons pas sur l'autre ville : l'aide au logement dépend du loyer et de la zone de la commune, elle y sera différente. La recopier aurait inventé de l'argent en faveur du déménagement.",
      stationnement:
        "Les tarifs de stationnement sont municipaux et les péages autoroutiers ne sont pas ouverts : aucune API centrale n'existe.",
      borne_domicile:
        "Dépense unique à l'installation, pas une charge mensuelle. Elle n'a donc pas sa place dans un reste à vivre, au même titre que le bonus écologique ou le malus au poids.",
      double_loyer:
        "Dépend de la date de votre préavis et de l'entrée dans le nouveau logement. Cela peut représenter un mois de loyer en double — ou rien du tout.",
    },
    status: {
      user: "Saisi",
      computed: "Calculé",
      convention: "Hypothèse",
      unavailable: "Non chiffré",
      non_applicable: "Sans objet",
    },
    geoLevels: {
      national: "France entière",
      region: "région",
      departement: "département",
      zone_emploi: "zone d'emploi",
      commune: "commune",
      iris: "quartier (IRIS)",
      point: "adresse ou point",
      user: "votre saisie",
    },
    terms: {
      annual: "annuelle",
      continuous: "continue",
      manual: "manuelle",
      legislative: "législative",
      every_10_min: "toutes les 10 minutes",
      biannual_revision: "révision semestrielle",
      every_5_6_years: "tous les 5 à 6 ans",
      on_legislative_change: "à chaque évolution législative",
      on_method_revision: "à chaque révision de la méthode",
      on_input: "à chaque saisie",
      realtime_feed: "flux temps réel",
      tariff_in_force: "grille en vigueur",
      daily_reading: "relevé du jour",
      scale_in_force: "barème en vigueur",
      tariff_table_collected: "grille tarifaire relevée",
      consolidated_file: "fichier consolidé courant",
      rule_in_force: "règle en vigueur",
      current_reference: "référentiel courant",
      legislation_2026: "législation au 01/01/2026",
      documented_in_docs: "documentée dans docs/reste-a-vivre-variables.md",
      your_situation: "votre situation actuelle",
    },
    sourceCaveats: {
      carte_loyers:
        "Loyer d'annonce charges comprises, à l'échelle de la commune. Ce n'est pas un loyer réel constaté, et l'indicateur ne descend pas au quartier.",
      insee_salaires:
        "Salaires en équivalent temps plein. Sert de repère de marché, jamais de salaire individuel.",
      france_travail_offres:
        "Le salaire n'est renseigné que dans une partie des offres ; la distribution est donc biaisée.",
      enedis_conso:
        "Moyenne par point de livraison résidentiel du secteur, agrégée à partir de 10 sites actifs. Ce n'est pas la consommation du logement visé.",
      tarif_electricite:
        "Prix national : il ne crée aucun écart entre deux villes. Seule la consommation en crée un.",
      sispea_eau:
        "Le tarif s'applique au périmètre du service, qui ne coïncide pas toujours avec la commune. Les écarts réels vont de 1 à 2 entre communes.",
      prix_carburants:
        "Prix d'un jour donné. Un budget annuel doit être calculé sur une moyenne, pas sur le relevé du matin.",
      bareme_kilometrique:
        "Forfait national couvrant entretien, assurance et dépréciation. Il ne reflète pas l'écart de prime d'assurance entre départements. Pour un véhicule 100 % électrique, le barème est majoré de 20 % — mais cette majoration couvre aussi la recharge, que nous comptons à part.",
      irve_bornes:
        "Le fichier consolidé recense les bornes et parfois leur tarification, mais ce champ est hétérogène et souvent vide. Le prix de la recharge publique utilisé ici reste donc une hypothèse, pas un relevé.",
      gtfs_tarifs:
        "Les abonnements ne figurent pas dans les données GTFS ouvertes : cette grille est relevée à la main, réseau par réseau, et peut avoir changé.",
      code_travail_transport:
        "S'applique aux abonnements de transport public, jamais aux frais de carburant.",
      bareme_psu_cnaf:
        "Le tarif est calculé sur les ressources N-2. Le barème est national : il ne crée pas d'écart entre villes. Obtenir une place, en revanche, dépend entièrement du territoire.",
      insee_bpe:
        "La présence d'un équipement ne dit rien de sa qualité, de ses tarifs, ni d'une place disponible. Le commerce le plus proche vient d'OpenStreetMap, où une petite épicerie bio et un hypermarché portent la même étiquette : le nom du commerce est affiché pour que vous puissiez juger s'il correspond à vos courses de la semaine.",
      ban_itineraire:
        "Les distances mesurées sont de vrais itinéraires routiers, mais partant d'un point d'ancrage du quartier (nœud OpenStreetMap) vers la mairie — pas d'une adresse précise à une autre. Les quartiers sans ancrage gardent une distance modélisée, et c'est indiqué.",
      insee_ecsp:
        "Seul écart mesuré : région parisienne contre province (+7 %), Corse et DOM. Aucune donnée officielle n'existe au niveau de la ville ni du quartier.",
      openfisca:
        "Moteur de règles, pas de statistiques. Le résultat dépend de la configuration complète du foyer fiscal.",
      convention_statwise:
        "Hypothèse de calcul assumée, pas une mesure. Elle est affichée pour pouvoir être contestée et modifiée.",
      saisie_utilisateur:
        "C'est la donnée la plus fiable du calcul : elle sert de point d'ancrage à la comparaison.",
    },
    result: {
      title: "Votre reste à vivre, des deux côtés",
      subtitle: "{currentCity} aujourd'hui, contre {targetCity} au mieux de ses quartiers.",
      verdictBetter: "Il vous resterait {amount} de plus chaque mois.",
      verdictWorse: "Il vous resterait {amount} de moins chaque mois.",
      verdictSame: "Le reste à vivre serait pratiquement identique.",
      verdictNote:
        "Avant impôt sur le revenu et hors prestations : ces deux postes ne sont pas encore chiffrés.",
      verdictTiers: {
        excellent: {
          emoji: "🎉",
          title: "Le déménagement en vaut clairement la peine",
          body: "Il vous resterait {amount} de plus par mois, soit {percent} de ce qui vous reste aujourd'hui. À ce niveau, l'écart survit largement aux approximations de ce calcul.",
        },
        good: {
          emoji: "😀",
          title: "Le gain est net",
          body: "{amount} de plus par mois, soit {percent} de ce qui vous reste. Un vrai gain, mais vérifiez le loyer réel avant de décider : c'est lui qui peut le faire fondre.",
        },
        modest: {
          emoji: "🙂",
          title: "Vous gagnez un peu",
          body: "{amount} par mois, soit {percent}. C'est réel mais modeste — et du même ordre que l'incertitude sur le loyer. Ne déménagez pas pour cette somme seule.",
        },
        marginal: {
          emoji: "😐",
          title: "C'est un match nul",
          body: "{amount} par mois, soit {percent}. Autant dire équivalent : à ce niveau, le calcul ne peut pas trancher. Décidez sur le poste que nous ne chiffrons pas — le travail, les proches, le temps de trajet.",
        },
        negative: {
          emoji: "🙁",
          title: "Financièrement, ce déménagement vous coûte",
          body: "Il vous resterait {amount} de moins chaque mois. Le salaire plus élevé ne compense pas ce qui vient avec : logement, trajets, garde.",
        },
      },
      verdictOutsized:
        "Il vous resterait {amount} de plus par mois — plus du double de ce qu'il vous reste aujourd'hui. Un écart de cette taille mérite d'être revérifié sur le loyer réel avant de faire vos valises.",
      verdictSignOnly:
        "Le pourcentage n'est pas affiché : ce qui vous reste aujourd'hui est trop faible pour qu'un rapport ait un sens.",
      downloadTitle: "Emporter ce résultat",
      downloadDesc:
        "Le tableur contient chaque ligne avec son statut et sa source. L'image est faite pour être envoyée à quelqu'un.",
      downloadImage: "Image (PNG)",
      downloadPdf: "PDF",
      downloadXlsx: "Tableur (XLSX)",
      downloadPending: "Préparation…",
      downloadFailed: "Le téléchargement a échoué. Réessayez.",
      shareCardFooter: "Calcul indicatif · sources et millésimes dans le rapport complet",
      here: "Aujourd'hui",
      there: "Avec l'offre",
      rangeLabel: "Entre {low} et {high}, selon le loyer que vous trouverez",
      comparable: "Comparable",
      comparableHint:
        "Seuls les postes qui changent avec la ville. C'est ce chiffre qui fonde le verdict.",
      real: "Réel",
      realHint: "Comparable moins le reste de votre budget, tel que vous l'avez déclaré.",
      requiredSalaryTitle: "Le chiffre à emporter en négociation",
      requiredSalary:
        "À {city}, il faut {amount} net pour retrouver exactement ce qui vous reste aujourd'hui.",
      requiredSalaryBelow:
        "L'offre est déjà au-dessus de ce seuil : {amount} net suffiraient à faire match nul.",
      requiredSalaryAbove: "L'offre est en dessous : il faudrait {amount} net pour ne rien perdre.",
      waterfallTitle: "D'où vient l'écart",
      waterfall: {
        salaire: "Salaire",
        logement: "Loyer",
        energie: "Énergie et eau",
        transport: "Déplacements",
        famille: "Trajets vers vos proches",
        garde: "Crèche",
        alimentation: "Alimentation",
        autre: "Autres postes",
      },
      moveCostTitle: "Ce qu'il faut avancer pour déménager",
      moveCostDesc:
        "Dépenses uniques, jamais réparties sur douze mois : les étaler donnerait un verdict faux. C'est souvent ce montant, et non le reste à vivre, qui bloque un déménagement.",
      moveCostTotal: "Total à prévoir",
      bestDistrict: "Meilleur quartier",
      salaryDelta: "Écart de salaire",
      housingDelta: "Écart de loyer",
      commuteDelta: "Écart de trajet",
      hoursPerYear: "{hours} h/an",
      perMonth: "/ mois",
      seededTitle: "Données d'amorçage",
      seededDesc:
        "Cette version tourne sur des valeurs d'amorçage calibrées sur les vrais jeux de données, pas encore sur les données importées. Les ordres de grandeur sont justes, les montants ne sont pas des mesures.",
      rankingTitle: "Quartiers de {city}, du plus au moins avantageux",
      rankingDesc:
        "À salaire et foyer identiques, seul le quartier change. Le loyer descend, mais le trajet et la distance au commerce peuvent reprendre la différence.",
      colDistrict: "Quartier",
      colRent: "Loyer estimé",
      colCommute: "Trajet",
      colGrocery: "Commerce",
      colResteAVivre: "Reste à vivre",
      colVsCurrent: "vs aujourd'hui",
      breakdownTitle: "Le détail, ligne par ligne",
      revenues: "Revenus",
      expenses: "Dépenses",
      omittedTitle: "Ce que ce calcul ne contient pas",
      omittedDesc:
        "Ces lignes sont volontairement laissées vides. Une absence de donnée n'est jamais remplacée par zéro : elle est affichée comme absente.",
      freshnessTitle: "Fraîcheur des données utilisées",
      freshnessDesc:
        "Chaque source avec l'année qu'elle décrit — pas la date à laquelle nous l'avons téléchargée — et le niveau géographique auquel elle est réellement mesurée.",
      snapshotDate: "Instantané assemblé le {date}",
      distancesTitle: "Distances",
      distancesMeasured:
        "{measured} quartiers sur {total} ont des distances mesurées sur le réseau routier (relevé du {date}). Les autres gardent la valeur du modèle.",
      distancesNone:
        "Aucune distance mesurée pour l'instant : toutes viennent du modèle par archétype de quartier.",
      measuredBadge: "mesuré",
      derivedBadge: "modélisé",
      vintage: "Millésime",
      refresh: "Mise à jour",
      level: "Niveau",
      goToQuartier: "Choisir un quartier dans cette ville",
      restart: "Modifier la comparaison",
      disclaimer:
        "Comparaison indicative fondée sur des données publiques officielles et sur des hypothèses affichées. Ce n'est ni une offre, ni un conseil, ni une garantie.",
      empty: {
        title: "Aucune comparaison",
        desc: "Décrivez votre situation actuelle et l'offre que vous étudiez pour lancer le calcul.",
        cta: "Lancer « Trouver mon job »",
      },
    },
  },
};
