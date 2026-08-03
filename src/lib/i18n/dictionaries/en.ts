import type { Dictionary } from "../types";

export const en: Dictionary = {
  localeName: "English",
  brand: {
    name: "WhereWise",
    slogan: "Find the place that fits your life.",
  },
  nav: {
    home: "Home",
    simulate: "Simulate",
    favorites: "Favorites",
    results: "Results",
    account: "Account",
    methodology: "Methodology",
    sources: "Sources",
    coverage: "Coverage",
    privacy: "Privacy",
    terms: "Terms",
    signIn: "Sign in",
  },
  common: {
    back: "Back",
    next: "Continue",
    start: "Start",
    seeResults: "See results",
    save: "Save",
    loading: "Loading…",
    errorTitle: "Something went wrong",
    errorBody: "Please try again in a moment.",
    retry: "Try again",
    comingSoon: "Coming soon",
    optional: "optional",
    edit: "Edit",
    reset: "Reset",
    close: "Close",
    language: "Language",
    skip: "Skip",
  },
  home: {
    heroTitle: "Find the right neighbourhood for your life and family.",
    heroSubtitle:
      "WhereWise turns official French public data into clear decisions about where to live.",
    startJob: "Find my job",
    startQuartier: "Find my neighbourhood",
    startFamily: "Raising a child here",
    jobTitle: "Find my job",
    jobDesc:
      "Does a higher salary elsewhere actually leave you with more? Compare what is left once every bill is paid.",
    quartierTitle: "Find my neighbourhood",
    quartierDesc: "Rank the areas of a city by your budget, your commute and your priorities.",
    familyTitle: "Raising a child here",
    familyDesc: "Compare up to three areas through the needs of a child and daily life.",
    howTitle: "How it works",
    steps: [
      {
        title: "Describe your situation",
        desc: "City, budget, lifestyle and priorities — a few short steps.",
      },
      {
        title: "We analyse the areas",
        desc: "A transparent calculation from official data, no black box.",
      },
      {
        title: "You get areas to explore",
        desc: "An explained ranking, with its limits and what to verify.",
      },
    ],
    dataTitle: "Official data, explained",
    dataDesc:
      "Amenities (INSEE BPE), prices (DVF), rents, schools, access to doctors (APL) and recorded crime. Every indicator shows its source, date and geographic level.",
    seeMethodology: "Read the methodology",
    seeSources: "View the sources",
    disclaimer:
      "Results are indicative and based on available official data. They are neither a guarantee nor personalised advice.",
  },
  wizard: {
    jobTitle: "Find my job",
    quartierTitle: "Find my neighbourhood",
    familyTitle: "Raising a child here",
    stepOf: "Step {current} of {total}",
    leaveTitle: "Your answers are saved",
    draftSaved: "Draft saved",
    steps: {
      city: {
        title: "Which city?",
        desc: "Pick the commune to analyse. One city per simulation in V1.",
        searchPlaceholder: "Search a city or postal code",
        noResults: "No city found. Try Dijon, Lyon, Versailles or Avignon.",
        limited: "Limited coverage — results at commune level.",
      },
      housing: {
        title: "What kind of home?",
        desc: "This drives which price and rent indicators are used.",
        mode: "You want to",
        modeRent: "Rent",
        modeBuy: "Buy",
        modeBoth: "Both",
        type: "Property type",
        typeApartment: "Apartment",
        typeHouse: "House",
        typeAny: "Any",
        rooms: "Minimum number of rooms",
        surface: "Minimum surface (m²)",
      },
      budget: {
        title: "What budget?",
        desc: "Indicative. You can explore without setting a budget.",
        rentMax: "Maximum monthly rent",
        rentCharges: "Charges included",
        purchaseMax: "Maximum purchase budget",
        perMonth: "/ month",
        noBudget: "I just want to explore the areas first",
      },
      situation: {
        title: "Your situation",
        desc: "To tune how much schools, crèches and commuting matter.",
        household: "Household",
        single: "Single",
        couple: "Couple",
        family: "Family",
        familyChild: "Family with a child",
        hasCar: "I have a car",
        usesTransport: "I'm willing to use public transport",
      },
      priorities: {
        title: "Your priorities",
        desc: "Set how important each theme is. This is what weighs most in the ranking.",
        sportLabel: "Sport & leisure",
      },
      constraints: {
        title: "Must-have criteria",
        desc: "An area that fails a must-have is removed before ranking.",
        requireTransport: "Public transport nearby",
        requireSchool: "School nearby",
        requireCreche: "Crèche nearby",
        strictBudget: "Do not exceed my budget",
      },
    },
    generate: "Analyse the areas",
  },
  auth: {
    title: "Keep your simulations",
    subtitle: "An account, an email address, no password: we send a link and you click it.",
    benefits: [
      "Find your comparisons again instead of redoing them",
      "Pick a simulation up where you left it",
      "20% off every future simulation, once they are charged for",
    ],
    firstName: "First name",
    lastName: "Last name",
    email: "Email address",
    sendLink: "Send me the link",
    sending: "Sending…",
    withGoogle: "Continue with Google",
    or: "or",
    sentTitle: "Check your inbox",
    sentBody: "We sent a link to {email}. Click it to confirm and come in.",
    sentHint:
      "The link lasts an hour and works once. Nothing in your spam folder? Check the address and ask for another.",
    errorGeneric: "Sending failed. Try again in a moment.",
    errorTooMany: "Too many requests in a row. Wait a few minutes.",
    errorExpired: "That link has expired or was already used. Ask for a new one.",
    consent:
      "By creating an account you agree that we keep your email, your first name and the simulations you choose to save. Nothing is stored until you ask for it, and deleting your account deletes all of it.",
    save: {
      title: "Keep this result",
      body: "Create an account and this comparison will be waiting next time.",
      bodySignedIn: "Save this comparison to your account.",
      createAccount: "Create my account",
      saveNow: "Save",
      saving: "Saving…",
      savedTitle: "Saved to your account",
      seeSaved: "See my simulations",
      error: "Saving failed. Try again.",
    },
    account: {
      hello: "Your account",
      helloNamed: "Hello {name}",
      signOut: "Sign out",
      savedTitle: "Your simulations",
      flushing: "Saving your last simulation…",
      empty: "No saved simulations yet.",
      runOne: "Run a simulation",
      line: "{delta} a month, leaving {left}",
      remove: "Delete this simulation",
      dataNote:
        "We keep your email, your first name and the simulations you saved, on servers located in France. Deleting a simulation deletes it for good.",
    },
  },
  categories: {
    housing: "Housing",
    mobility: "Mobility",
    services: "Daily services",
    health: "Health",
    tranquillity: "Tranquillity",
    family: "Family",
    nature: "Nature & leisure",
  },
  priorityLevels: {
    "0": "Not important",
    "1": "A little",
    "2": "Important",
    "3": "Critical",
  },
  confidence: {
    high: { label: "Strong data", desc: "Good volume and a suitable geographic level." },
    medium: { label: "Partial data", desc: "Some of the data is at commune level." },
    low: { label: "Limited data", desc: "Few transactions or points, or older data." },
    unavailable: { label: "Data unavailable", desc: "No data — this is not a zero." },
  },
  result: {
    title: "Areas to explore",
    subtitle: "Ranking for {city}, from best to least matching your criteria.",
    overallMatch: "Match",
    dataConfidence: "Data confidence",
    whyItFits: "Why this area fits",
    thingsToVerify: "Things to verify yourself",
    missingTitle: "Missing data",
    missingCategory: "{category}: data not available for this area",
    sources: "Sources",
    analysedArea: "analysed area",
    commune: "commune",
    compare: "Compare",
    compareTitle: "Comparison",
    addToCompare: "Add to comparison",
    removeFromCompare: "Remove",
    compareHint: "Select up to 3 areas to compare.",
    noScore: "Score unavailable",
    excludedTitle: "{count} area(s) excluded",
    excludedDesc: "These areas fail a must-have criterion.",
    goToFamily: "Compare for a child",
    restart: "New simulation",
    saveCta: "Save this simulation",
    saveHint: "Create an account to keep your simulations. (Coming soon)",
    topMatch: "Best match",
    summaryTitle: "Result preview",
    summaryNote: "Visual product preview — not an exact geographic map.",
    summaryAreas: "{count} area(s) analysed",
    tryAnotherScenarioTitle: "What if your situation changed?",
    tryAnotherScenarioDescription: "Re-run the analysis by changing a single parameter.",
    scenarioBudgetTighter: "Budget cut by 10%",
    scenarioWithoutCar: "Without a car",
    scenarioMoreNature: "More nature",
    scenarioBuyInstead: "Buy instead of rent",
  },
  explanations: {
    strengths: {
      strong_housing: "Good budget / housing balance",
      strong_mobility: "Easy to get around",
      strong_services: "Plenty of daily services",
      strong_health: "Good access to healthcare",
      calm_area: "Lower recorded crime",
      family_friendly: "Well equipped for families",
      green_area: "Parks and leisure spaces",
    },
    caveats: {
      rent_commune_level: "Rent is a commune-level reference, not a per-area price.",
      low_transaction_count: "Few transactions: read the purchase price with caution.",
      over_budget_soft: "Above your indicative budget.",
      crime_commune_level: "Crime data is at commune level.",
      apl_commune_level: "Access to doctors (APL) is measured at commune level.",
      creche_not_guaranteed: "The presence of crèches does not guarantee a place.",
      school_sector_not_guaranteed: "The presence of schools does not guarantee the catchment.",
    },
    excluded: {
      no_transport: "No public transport nearby",
      no_school_nearby: "No school nearby",
      no_creche_nearby: "No crèche nearby",
      over_rent_budget: "Rent above the strict budget",
      over_purchase_budget: "Purchase price above the strict budget",
    },
  },
  pages: {
    methodology: {
      title: "Methodology",
      intro: "How WhereWise builds a ranking, what it measures and what it does not.",
      sections: [
        {
          key: "computed",
          title: "What we calculate",
          body: "A ranking of a city's areas by your priorities, from official indicators normalised within the chosen city.",
        },
        {
          key: "not_computed",
          title: "What we do not calculate",
          body: "No absolute 'best neighbourhood', no guarantee of safety, of a crèche place, or of the exact price of a specific home.",
        },
        {
          key: "geo_levels",
          title: "Geographic levels",
          body: "IRIS where possible, otherwise commune. The real level is always shown. An IRIS zone is called an 'analysed area'.",
        },
        {
          key: "reliability",
          title: "Data confidence",
          body: "Each area gets a confidence level (strong, partial, limited, unavailable) based on the coverage of the indicators you marked important.",
        },
        {
          key: "weighting",
          title: "Weighting",
          body: "Your priorities (from 'not important' to 'critical') become weights. Only the themes that matter to you count toward the score.",
        },
        {
          key: "missing",
          title: "Missing data",
          body: "A missing value is never replaced with zero: it lowers confidence and is flagged.",
        },
        {
          key: "no_mixing",
          title: "Don't mix indicators",
          body: "Salary, median income, rent and purchase price are distinct measures with different methods and precision.",
        },
      ],
      engineVersion: "Scoring engine version",
    },
    sources: {
      title: "Sources",
      intro: "The official datasets used, their geographic level and their limits.",
      columns: { source: "Source", publisher: "Publisher", level: "Level", purpose: "Use" },
    },
    coverage: {
      title: "Coverage",
      intro: "Where WhereWise has enough data, and where results stay at commune level.",
      richTitle: "Pilot cities",
      richDesc: "Per-area (IRIS) coverage for V1.",
      limitedTitle: "Limited coverage",
      limitedDesc: "Results at commune level only.",
      citySearchPlaceholder: "Search for a city or area…",
      areaSearchPlaceholder: "Search for an area…",
      showMoreCities: "Show more cities",
      showFewerCities: "Show fewer cities",
      noCities: "No city or area found.",
      noAreas: "No area found.",
    },
    privacy: {
      title: "Privacy policy",
      intro:
        "What WhereWise does with your data, in plain words. Nothing is kept until you ask for it.",
      updated: "Last updated: 2 August 2026",
      summaryTitle: "In two lines",
      summary: [
        "A simulation run without an account does not leave your browser, with one exception: the income tax and benefits calculation.",
        "No trackers, no advertising, no resale. There is no cookie banner because there is nothing to accept.",
        "An account keeps only what you explicitly saved, on servers located in France.",
      ],
      sections: [
        {
          title: "1. Who is responsible for your data",
          body: "The data controller is {publisher}, a natural person and the publisher of WhereWise. The project has no commercial activity and is not required to appoint a data protection officer; requests are handled by the publisher directly.",
        },
        {
          title: "2. What we process, why, and on what basis",
          body: "The GDPR requires each use to state the data involved and the legal basis that allows it. The table below takes them one at a time.",
          rows: [
            {
              what: "Running a simulation without an account",
              data: "City, district, rent, salary, household, travel",
              why: "Producing the result you asked for",
              basis: "Legitimate interest: without these answers there is nothing to compute. They stay in your browser.",
            },
            {
              what: "Computing tax and benefits",
              data: "Salary, rent, number of children, commune code",
              why: "Querying OpenFisca, the public tax and benefits rules engine",
              basis: "Legitimate interest. No identifier is sent: no name, no email, no address.",
            },
            {
              what: "Creating an account",
              data: "Email address, first name, last name, home city",
              why: "Identifying you and letting you come back",
              basis: "Performance of the service you ask for by creating the account.",
            },
            {
              what: "Saving a simulation",
              data: "The contents of the simulation, including salary and rent",
              why: "Finding it again later",
              basis: "Performance of the service, at your express request. Nothing is saved without a click from you.",
            },
            {
              what: "Security and operation",
              data: "The host's technical logs, including the IP address",
              why: "Detecting outages and abuse",
              basis: "Legitimate interest in keeping the service running.",
            },
          ],
        },
        {
          title: "3. What we do not do",
          body: "This list matters as much as the previous one, and it can be checked: the site is written without any of these pieces.",
          items: [
            "No advertising trackers, no analytics, no social network pixels.",
            "No resale, rental or sharing of your data for commercial purposes.",
            "No profiling and no automated decision with legal effect: our results are indicative.",
            "No special-category data under Article 9: no health, origin, opinion or banking data.",
            "No precise postal address: the calculation stops at the district.",
          ],
        },
        {
          title: "4. Who else sees this data",
          body: "Three providers are involved, and none receives more than its role requires.",
          rows: [
            {
              what: "Supabase",
              data: "Accounts and saved simulations",
              why: "Database and authentication",
              basis: "Servers in Paris (eu-west-3). Processor within the meaning of Article 28.",
            },
            {
              what: "Vercel",
              data: "Site requests, technical logs",
              why: "Hosting the site and the server functions",
              basis: "Server functions run in Paris (cdg1). The delivery network is global; any transfers are covered by standard contractual clauses.",
            },
            {
              what: "OpenFisca France",
              data: "Salary, rent, number of children, commune code — with no identifier",
              why: "Computing income tax and benefits",
              basis: "Public rules engine. What is sent cannot identify you.",
            },
          ],
        },
        {
          title: "5. How long we keep it",
          body: "Data kept without a reason is data you eventually lose. The periods are therefore short and tied to a use.",
          rows: [
            {
              what: "Simulation run without an account",
              data: "Until you clear your browser storage",
              why: "It never leaves your device",
              basis: "You can erase it at any time from your browser settings.",
            },
            {
              what: "Account and profile",
              data: "For as long as the account exists",
              why: "Letting you come back",
              basis: "Deleted on request, together with everything attached to it.",
            },
            {
              what: "Saved simulations",
              data: "For as long as you keep them",
              why: "Rereading and comparing them",
              basis: "Deletable one by one from your account, immediately and for good.",
            },
            {
              what: "Technical logs",
              data: "A few weeks at the host",
              why: "Security and diagnosis",
              basis: "Periods set by the host, not used by us for anything else.",
            },
          ],
        },
        {
          title: "6. Cookies and local storage",
          body: "There is no consent banner on this site, and that is not an oversight: only strictly necessary items are stored, which exempts them under Article 82 of the French Data Protection Act.",
          rows: [
            {
              what: "Session cookie",
              data: "Set only if you sign in",
              why: "Keeping you signed in from page to page",
              basis: "Strictly necessary. Gone when you sign out.",
            },
            {
              what: "Browser local storage",
              data: "Simulation draft, chosen language",
              why: "Not making you type your answers again",
              basis: "Stays on your device, never sent to a server unless you save.",
            },
          ],
        },
        {
          title: "7. Your rights",
          body: "You have rights of access, rectification, erasure, restriction, objection and portability over your data. Two of them are exercised directly in the interface, without writing to us: your account shows everything it holds, and each saved simulation is deleted with one click. For the others, write to us: we answer within a month.",
        },
        {
          title: "8. Complaints",
          body: "If an answer does not satisfy you, you may refer the matter to the French data protection authority: CNIL, 3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07, or online at cnil.fr.",
        },
        {
          title: "9. Security",
          body: "Traffic is encrypted in transit. Access to the data is partitioned in the database by policies that check, on every read and every write, that the row belongs to the signed-in person — the account id is never read from the request, only from the session cookie. No password is stored: signing in uses a single-use link sent by email.",
        },
        {
          title: "10. Changes",
          body: "This policy may change with the service. The date at the top shows the current version; substantial changes will be announced on the site.",
        },
      ],
      contactTitle: "Writing to us",
      contactBody: "For any question or request about your data:",
      contactMissing:
        "The contact address will be published here shortly. In the meantime your rights can be exercised directly from your account, and you may refer the matter to the CNIL.",
      tableWhat: "Processing",
      tableData: "Data",
      tableWhy: "Purpose",
      tableBasis: "Details",
    },
    terms: {
      title: "Terms of use",
      intro: "Indicative summary for V1.",
      body: "WhereWise provides decision support based on public data. Results are indicative and do not engage the publisher's liability. Always verify key information before any decision.",
    },
  },
  footer: {
    legal: "Official French data. Indicative results.",
    blurb:
      "WhereWise turns official French public data into figures about where to live: rents, journeys, bills, income tax and benefits. Every line shows its source and its date.",
    simulators: "Simulators",
    data: "Data",
    legalTitle: "Legal",
    account: "Your account",
    rights: "All rights reserved.",
    product: "Product",
    about: "About",
  },
  notFound: {
    title: "Page not found",
    body: "This page doesn't exist or has moved.",
    home: "Back to home",
  },
  emptyStates: {
    favoritesDesc: "Your favourite neighbourhoods will appear here. Run a simulation to add some.",
    historyDesc: "Your recent simulations will appear here, ready to re-run.",
    accountDesc:
      "Coming soon: save your results and favourites, synced across your devices. You can run a simulation without an account.",
  },
  family: {
    title: "Growing up here",
    subtitle: "Compare neighbourhoods through a child's needs, for their age.",
    steps: {
      areas: {
        title: "Which neighbourhoods to compare?",
        desc: "Pick 1 to 3 areas to compare for your child.",
        pickCity: "Choose a city first",
        selectHint: "Select up to 3 areas.",
        selectedCount: "{count}/3 selected",
        changeCity: "Change city",
        limited: "Limited coverage — commune-level results.",
        fromQuartier: "Carried over from your neighbourhood search.",
      },
      child: {
        title: "Tell us about the child",
        desc: "Age strongly changes what matters in a neighbourhood.",
        count: "Number of children",
        count1: "1",
        count2: "2",
        count3: "3 or more",
        age: "Age group",
      },
      priorities: {
        title: "Your family priorities",
        desc: "Set how much each theme matters for your family.",
      },
    },
    generate: "Compare neighbourhoods",
    ages: {
      "0_2": { label: "0–2 yrs", desc: "Early childhood: nurseries, paediatricians, calm, parks." },
      "3_5": { label: "3–5 yrs", desc: "Preschool: school, discovery, green spaces." },
      "6_10": { label: "6–10 yrs", desc: "Primary: school, sport, after-school." },
      "11_14": { label: "11–14 yrs", desc: "Middle school: school, transport, sport." },
      "15_17": { label: "15–17 yrs", desc: "High school: school, transport, autonomy." },
    },
    categories: {
      earlyChildhood: "Early childhood",
      education: "Education",
      health: "Health",
      sportsAndLeisure: "Sport & leisure",
      nature: "Nature",
      mobility: "Mobility",
      tranquillity: "Calm",
      dailyServices: "Daily services",
    },
    result: {
      title: "Comparison for your child",
      subtitle: "Tailored to ages {age}, for {city}.",
      forAge: "For ages {age}",
      bestForAge: "Best fit for this age",
      categoriesTitle: "Breakdown by theme",
      strengthsTitle: "Strengths",
      toVerifyTitle: "Check for yourself",
      restart: "Edit the comparison",
      empty: {
        title: "No comparison yet",
        desc: "Select neighbourhoods and an age to run the comparison.",
        cta: "Start “Growing up here”",
      },
      disclaimer:
        "Indicative comparison based on official data. WhereWise guarantees no nursery/school place, no catchment area, and no safety outcome.",
    },
    strengths: {
      strong_earlyChildhood: "Well equipped for toddlers",
      strong_education: "Schooling suited to the age",
      strong_health: "Good access to care",
      strong_sportsAndLeisure: "Varied sport & leisure",
      strong_nature: "Parks and green spaces",
      strong_mobility: "Easy to get around",
      strong_tranquillity: "Calm environment",
      strong_dailyServices: "Shops & services nearby",
    },
    actions: {
      visit_area: "Visit the area at different times of day.",
      confirm_creche_place: "Confirm nursery availability with the town hall.",
      verify_school_sector: "Verify the exact school catchment with the town hall.",
      check_transport_autonomy: "Test transport trips for the teenager's autonomy.",
      check_health_access: "Check waiting times and availability of health professionals.",
    },
    caveats: {
      family_no_guarantee: "No guarantee of a place, catchment, safety or academic outcome.",
      creche_not_guaranteed: "The presence of nurseries does not guarantee a place.",
      school_sector_not_guaranteed: "The presence of schools does not guarantee the catchment.",
      crime_commune_level: "Recorded-crime data is at commune level.",
      apl_commune_level: "Access to doctors (APL) is measured at commune level.",
    },
  },
  job: {
    title: "Find my job",
    subtitle:
      "A higher salary elsewhere is only worth what survives it. Compare the money left over between your situation today and the offer you are considering.",
    sections: {
      startTitle: "What the simulation will ask you",
      reassurance:
        "Do not let the list put you off: it takes about two minutes, and you need no documents. Everything is already ticked — just untick what does not apply to you, and we will not ask about it.",
      startCta: "Start the simulation",
      editTitle: "Add or remove sections",
      editDesc:
        'You can switch a section back on at any point. You will return to where you were, and "Continue" will take you through the ones you have just added.',
      editCta: "Back to the simulation",
      headerButton: "Sections",
      legendFilled: "filled in",
      legendPending: "to fill in",
      legendDisabled: "switched off",
      requiredNote: "Essential: without it there is nothing to compare.",
      names: {
        today: "Your situation today",
        offer: "The offer you are considering",
        household: "Your household",
        travel: "Travel and vehicle",
        dividends: "Dividends",
        rental: "Rental income",
        aide: "Benefits (CAF)",
        family: "Trips to close family",
        other: "The rest of your budget",
        move: "Moving-in costs",
      },
      descriptions: {
        today: "City, district, rent, salary, current commute",
        offer: "City and salary offered",
        household: "Adults, children, nursery",
        travel: "Car or transit, petrol or electric, shopping",
        dividends: "Investment income, net",
        rental: "Rent you receive, net",
        aide: "Housing benefit, allowances — what you get today",
        family: "Distance and visits per year",
        other: "Insurance, phone, leisure, subscriptions",
        move: "Deposit, agency fee, removal — untick if you are not moving in",
      },
    },
    metric: "Money left over",
    metricDesc: "What remains each month once every bill is paid.",
    generate: "Compare the two situations",
    computing: "Calculating…",
    steps: {
      today: {
        title: "Your situation today",
        desc: "This side is fact, not estimate — it is what anchors the comparison.",
      },
      offer: {
        title: "The offer you are considering",
        desc: "Housing and travel will be estimated from the city's data.",
      },
      household: {
        title: "Your household",
        desc: "The household drives food, water and childcare.",
      },
      travel: {
        title: "Your travel",
        desc: "Two purposes, often two modes: getting to work, and doing the shopping.",
      },
      family: {
        title: "Your close family",
        desc: "The real reason people turn a move down, and the one nobody puts a figure on.",
      },
      dividends: {
        title: "Dividends",
        desc: "Investment income, net. Leave at zero if you have none.",
      },
      rental: {
        title: "Rental income",
        desc: "Rent you receive, net. Leave at zero if you have none.",
      },
      aide: {
        title: "Benefits",
        desc: "What you receive today. We will not carry it over to the other city.",
      },
      other: {
        title: "The rest of your budget",
        desc: "One figure, and the amount left over finally becomes true.",
      },
      move: {
        title: "What you have to put up front",
        desc: "Deposit, agency fee and the removal itself. It is often this amount, not the money left each month, that stops a plan.",
      },
    },
    fields: {
      city: "City",
      district: "District",
      districtHint:
        "The district sets the rent per m², the distance to work and to the nearest food store.",
      netSalary: "Net monthly salary",
      netSalaryHint: "Before income tax.",
      partnerSalary: "Second salary in the household",
      partnerSalaryNone: "No second salary",
      rent: "Rent you pay, charges included",
      housingType: "Housing type",
      apartment: "Apartment",
      house: "House",
      surface: "Surface area (m²)",
      oneWayKm: "Distance to work (one way, km)",
      targetCity: "City of the offer",
      targetSalary: "Net salary offered",
      targetSurface: "Surface area sought (m²)",
      adults: "Adults",
      children: "Dependent children",
      childrenInCreche: "Children in nursery",
      crecheHours: "Nursery hours per month",
      commuteMode: "Getting to work",
      errandsMode: "Doing the shopping",
      daysOnSite: "Days on site per week",
      vehicleEnergy: "Your vehicle",
      thermique: "Petrol or diesel",
      electrique: "Electric",
      hybridNote:
        "A hybrid falls under the thermal scale: choose “Petrol or diesel” and enter its real consumption.",
      litresPer100Km: "Fuel consumption (L/100 km)",
      kwhPer100Km: "Consumption (kWh/100 km)",
      homeChargingShare: "Share charged at home",
      homeChargingHint:
        "With no parking space it is 0 %. The gap between the domestic tariff and a public point weighs more than the fuel-price gap between two cities.",
      tripsPerMonth: "Shopping trips per month",
      bikeAmortization: "Bicycle amortisation",
      bikeAmortizationHint:
        "No public dataset puts a figure on this. Choose the yearly amount you accept: it will be shown as your hypothesis, not as a measurement.",
      bikeCustom: "Yearly amount chosen (€/year)",
      perYear: "€/year",
      sameAsToday: "Same as today",
      familyKmCurrent: "Distance to close family today (km)",
      familyKmTarget: "Distance from the city of the offer (km)",
      familyTripsPerYear: "Visits per year",
      familyHint:
        "One way. This is often the real reason people turn a move down, and nobody puts a figure on it.",
      otherMonthly: "Everything else in your monthly budget",
      otherMonthlyHint:
        "Insurance, health top-up, phone, internet, clothing, leisure, restaurants, subscriptions, haircuts, sport, pets, gifts, bank charges, loans. One figure: these do not change from one city to another, so they do not distort the comparison — but without them the amount left over looks far too good.",
      moveItems: {
        estimated: "Estimated by our rules — change it if you know the amount.",
        unknown: "Not quantified: enter an amount if you know one.",
        deposit: {
          label: "Deposit",
          hint: "One month's rent excluding charges, returned when you leave. Untick if you are not moving into a rented home.",
        },
        agencyFee: {
          label: "Letting agency fee",
          hint: "The legal cap per m² for the zone. Untick for a private let or an agency that charges nothing.",
        },
        removal: {
          label: "Removal",
          hint: "Van, boxes, a firm. Untick if you are keeping your current home or the employer pays for it.",
        },
        rentOverlap: {
          label: "Overlapping rents",
          hint: "Two rents in the same month, depending on your notice period. We cannot guess it; only you know.",
        },
      },
      dividendsMonthly: "Net dividends per month",
      rentalMonthly: "Net rental income per month",
      declaredBenefitsMonthly: "Benefits received today, per month",
      placeInvariantHint:
        "This income does not change with the city: it makes the amount left over true without influencing the comparison.",
      declaredBenefitsHint:
        "What the CAF pays you today: housing benefit, allowances. Counted on your current situation only — in the other city the amount will differ, because housing benefit depends on the rent and the zone.",
    },
    modes: {
      voiture: "Car",
      transports: "Public transport",
      actif: "Bicycle or walking",
    },
    bike: {
      walk: "Walking — no bicycle",
      usedBike: "Second-hand push bike",
      newBike: "New push bike",
      electricBike: "Electrically assisted bicycle",
    },
    lines: {
      salaire: "Net salary (before income tax)",
      salaire_conjoint: "Second net salary in the household",
      prise_en_charge_transport: "Employer's share of the transport pass",
      loyer_reel: "Rent, charges included",
      loyer_estime: "Estimated rent, charges included",
      electricite: "Electricity",
      eau: "Water and sanitation",
      carburant: "Fuel",
      recharge_domicile: "Charging the car at home",
      recharge_publique: "Charging at public points",
      borne_domicile: "Installing a home charging point",
      usage_vehicule: "Vehicle running costs (servicing, insurance, depreciation)",
      abonnement_transport: "{network} pass",
      courses_transport: "Shopping trips by public transport",
      velo_amortissement: "Bicycle — amortisation and upkeep",
      creche: "Nursery (family contribution)",
      alimentation: "Food at home",
      dividendes: "Dividends",
      revenus_fonciers: "Rental income",
      prestations_declarees: "Benefits you receive today",
      deplacements_famille: "Trips to close family",
      autres_depenses: "The rest of your budget",
      depot_garantie: "Tenancy deposit",
      honoraires_agence: "Letting agency fee",
      demenagement: "Removal",
      double_loyer: "Overlapping rent",
      impot_revenu: "Income tax",
      prestations: "Housing benefit, family allowances, activity bonus",
      assurances: "Home insurance, health top-up",
      chauffage_autre: "Gas heating or district heating",
      charges_copro: "Building service charges not included in the rent",
      taxe_fonciere: "Property tax",
      taxe_habitation: "Residence tax",
      cmg: "Childcare supplement (CMG)",
      stationnement: "Residential parking and tolls",
    },
    basis: {
      user_input: "The amount you entered.",
      rent_actual: "The rent you actually pay today — this is what anchors the comparison.",
      employer_share:
        "{share} % of the {network} pass ({pass} €), a legal obligation on the employer.",
      rent_estimated:
        "{perSqm} €/m² × {surface} m² — advertised-rent indicator for the commune, not for the district.",
      electricity:
        "{kwhYear} kWh/year per residential delivery point in this area × {price} €/kWh, plus the standing charge. An area average, not the consumption of the dwelling itself.",
      removal_default:
        "A ballpark for a removal between two cities. Replace it with your quote as soon as you have one.",
      water:
        "{pricePerM3} €/m³ × {m3PerPerson} m³ per person per year (an assumed consumption). The price combines the commune's drinking water and {sewerage} €/m³ of sewerage, the national median in the absence of a local figure.",
      electricity_modelled:
        "{kwhYear} kWh a year × {price} €/kWh, plus the standing charge. Enedis does not serve this commune: the consumption is the median of the large communes that were measured, not a local reading.",
      purpose_both:
        "{commuteKm} km commuting + {groceryKm} km shopping ({groceryOneWay} km to the nearest food store, one way)",
      purpose_commute: "{commuteKm} km commuting",
      purpose_groceries:
        "{groceryKm} km shopping ({groceryOneWay} km to the nearest food store, one way)",
      fuel: "{purpose} = {totalKm} km/month × {litres} L/100 km × {price} €/L, median price across the département's stations.",
      charge_home:
        "{purpose} = {totalKm} km/month × {kwhPer100} kWh/100 km, of which {sharePct} % charged at home, so {kwh} kWh × {price} €/kWh. This is on top of the Electricity line: the area's consumption figure does not account for a vehicle.",
      charge_public:
        "{purpose} — the {sharePct} % charged away from home, so {kwh} kWh at {price} €/kWh. An assumption: public charging tariffs vary widely by operator and power rating, and no usable official record exists.",
      vehicle_use:
        "{km} km/month × {perKm} €/km, a national flat rate derived from the mileage allowance.",
      vehicle_use_ev:
        "{km} km/month × {perKm} €/km: the {base} €/km flat rate increased by {upliftPct} %, as the mileage allowance provides for a fully electric vehicle. Note: that fiscal uplift also covers charging, which we bill separately — so we apply it here to wear and depreciation alone. It is an assumption, not the tax rule.",
      income_tax:
        "Computed by the OpenFisca-France rules engine against {year} legislation, from your tax household. Taxable salary is estimated from the net figure (about +2 %, the non-deductible part of the CSG): that is the weak link in this calculation.",
      place_invariant_income:
        "The figure you declared. This income does not change with the city: it makes the amount left over true without weighing on the comparison.",
      declared_benefits:
        "What you receive today, as you declared it. Counted on your current situation only.",
      benefits:
        "Housing benefit {housing} € plus family allowances {family} €, computed by OpenFisca-France against {year} legislation. Assumption: last year's income is taken to match this year's, because the resource base is built from the preceding twelve months. Children's ages are not asked for and are assumed too.",
      benefits_target:
        "Housing benefit {housing} € plus family allowances {family} €, computed for this rent and this commune against {year} legislation. Note: this is the steady state. In the first year your benefit will still reflect your current, lower salary, so it will be higher than this figure.",
      transit_pass:
        "The network's tariff table, collected by hand — passes are not published in the open data.",
      transit_free:
        "The {network} network is free for residents of the métropole: the pass costs nothing, so the employer's 50 % share has nothing to cover. You have to apply for the named pass and renew it every year.",
      errands_covered_by_pass:
        "No additional cost: the {network} pass is already paid for the commute and covers these {journeys} journeys.",
      errands_tickets:
        "{journeys} journeys × {ticket} € per ticket. The employer's 50 % share covers the commute only, never the shopping.",
      bike_amortization:
        "{perYear} €/year that you chose, spread over 12 months, for {km} km/month. No public dataset puts a figure on this: the amount is your hypothesis, not a measurement.",
      bike_none:
        "No amortisation applied for {km} km/month — walking, or a bicycle already written off.",
      creche:
        "PSU scale {vintage}, {hours} h/month. The scale is national: it does not vary from one city to another. Getting a place does.",
      food_paris:
        "National reference basket + {premium} % (the Île-de-France gap measured by the 2022 Insee survey). No official data exists at district level.",
      food_province:
        "National reference basket. No spatial food-price gap is officially measured outside Île-de-France, Corsica and the overseas départements.",
      family_travel:
        "{oneWayKm} km one way × 2 × {trips} trips a year = {monthlyKm} km/month × {perKm} €/km (energy plus wear on your car). The number of trips is your habit, not a measurement.",
      declared_other:
        "The figure you declared for everything that does not change with the city: insurance, health top-up, phone, internet, clothing, leisure, subscriptions. Deliberately outside the comparable calculation, since it is identical on both sides.",
      deposit:
        "One month's rent excluding charges — {rent} € less an estimated {chargesShare} % of charges. You get it back when you leave, but you have to find it first.",
      agency_fee:
        "Legal cap of {cap} €/m² for this zone × {surface} m². That is a maximum: renting direct from a landlord costs nothing.",
    },
    reasons: {
      impot_revenu:
        "Requires the OpenFisca rules engine and the full configuration of the tax household. Not wired in: the figure shown is therefore before income tax.",
      prestations:
        "Housing benefit, family allowances, RSA, activity bonus. The rules engine answers — but wrongly: with no children it returns 0 €, and with a single child it jumps to 426.77 € for a household earning 2,300 €/month with 900 € of rent, on both sides at once. Income stops being counted the moment a child is declared, because the resource base is built from year N-2 and from a lone-parent status this request never establishes. A credible but wrong figure of ~400 €/month would have flattered every household with children: we prefer the gap until the resource base is built properly.",
      assurances:
        "No public dataset gives the premium per commune: those prices belong to the insurers.",
      chauffage_autre:
        "The Electricity line covers electricity and nothing else. A home heated by gas or connected to a district heating network pays for that elsewhere, and nothing tells us how yours is heated.",
      charges_copro:
        "The rent indicator used already includes charges; actual building charges vary from one block to the next and are not published.",
      taxe_fonciere: "Concerns owners only. This version compares two rental situations.",
      taxe_habitation: "Abolished on main residences since 2023. It is therefore not counted.",
      cmg: "Applies to childminders and home-based care, not to a PSU nursery. To be wired in with OpenFisca if you compare those arrangements.",
      prestations_none:
        "Your resources are above the thresholds: the rules engine grants you nothing. That is a result, not missing data.",
      prestations_target:
        "You declared what you receive today, and we do not carry it over to the other city: housing benefit depends on the rent and the commune's zone, so it will be different there. Copying it would have invented money in favour of the move.",
      stationnement:
        "Parking tariffs are set by each municipality and motorway tolls are not open: no central API exists.",
      borne_domicile:
        "A one-off cost at installation, not a monthly charge. It has no place in money left over each month, any more than the purchase grant or the weight penalty does.",
      double_loyer:
        "Depends on your notice date and on when the new tenancy starts. It can be a full month of double rent — or nothing at all.",
    },
    status: {
      user: "Entered",
      computed: "Calculated",
      convention: "Assumption",
      unavailable: "Not quantified",
      non_applicable: "Not applicable",
    },
    geoLevels: {
      national: "whole of France",
      region: "region",
      departement: "département",
      zone_emploi: "employment zone",
      commune: "commune",
      iris: "district (IRIS)",
      point: "address or point",
      user: "your input",
    },
    terms: {
      annual: "annual",
      continuous: "continuous",
      manual: "manual",
      legislative: "legislative",
      every_10_min: "every 10 minutes",
      biannual_revision: "revised twice a year",
      every_5_6_years: "every 5 to 6 years",
      on_legislative_change: "on every legislative change",
      on_method_revision: "on every revision of the method",
      on_input: "on every entry",
      realtime_feed: "real-time feed",
      tariff_in_force: "tariff in force",
      daily_reading: "reading of the day",
      scale_in_force: "scale in force",
      tariff_table_collected: "tariff table collected by hand",
      consolidated_file: "current consolidated file",
      rule_in_force: "rule in force",
      current_reference: "current reference data",
      legislation_2026: "legislation as of 01/01/2026",
      documented_in_docs: "documented in docs/reste-a-vivre-variables.md",
      your_situation: "your current situation",
    },
    sourceCaveats: {
      carte_loyers:
        "Advertised rent, charges included, at commune level, with the confidence interval the source publishes. It is not an observed rent, and the indicator does not reach the district: the spread between districts is modelled from the commune figure, not measured.",
      insee_salaires:
        "Full-time equivalent salaries. A market benchmark, never an individual salary.",
      france_travail_offres:
        "Salary is filled in on only part of the postings, so the distribution is biased.",
      enedis_conso:
        "An average per residential delivery point in the commune. It is not the consumption of the dwelling itself, and it covers electricity only: a home heated by gas uses fewer kWh and pays elsewhere. The spread between districts is modelled, not measured.",
      tarif_electricite:
        "A national price: it creates no gap between two cities. Only consumption does.",
      sispea_eau:
        "The tariff applies to the service's perimeter, which does not always match the commune, and the last published year runs from 2015 to 2019 depending on the commune: today's bill is higher. The sewerage share is a national median, in the absence of a local figure.",
      prix_carburants:
        "The median across the département's stations, read on a single day. One particular station can be 20 cents off it, and an annual budget must be built on an average, not on this morning's reading.",
      bareme_kilometrique:
        "A national flat rate covering servicing, insurance and depreciation. It does not reflect insurance differences between départements. For a fully electric vehicle the allowance is increased by 20 % — but that uplift also covers charging, which we bill separately.",
      irve_bornes:
        "The consolidated file lists charging points and sometimes their tariff, but that field is heterogeneous and often empty. The public charging price used here is therefore an assumption, not a reading.",
      gtfs_tarifs:
        "Passes do not appear in open GTFS data: this table is collected by hand, network by network, and may have changed.",
      code_travail_transport: "Applies to public transport passes, never to fuel costs.",
      bareme_psu_cnaf:
        "The rate is computed on N-2 resources. The scale is national: it creates no gap between cities. Getting a place, on the other hand, depends entirely on the area.",
      insee_bpe:
        "The presence of an amenity says nothing about its quality, its prices, or whether a place is free. The nearest food shop comes from OpenStreetMap, where a small organic grocer and a hypermarket carry the same tag: the shop's name is shown so you can judge whether it is where you would do a weekly shop.",
      ban_itineraire:
        "Measured distances are real road routes, but they start from an anchor point for the district (an OpenStreetMap place node) and run to the town hall — not from one precise address to another. Districts without an anchor keep a modelled distance, and that is stated.",
      insee_ecsp:
        "The only measured gap: the Paris region against the rest of France (+7 %), Corsica and the overseas départements. No official data exists at city or district level.",
      openfisca:
        "A rules engine, not statistics. The result depends on the full configuration of the tax household.",
      convention_statwise:
        "An assumption we own, not a measurement. It is displayed so it can be challenged and changed.",
      saisie_utilisateur:
        "This is the most reliable figure in the calculation: it anchors the comparison.",
    },
    result: {
      title: "Your money left over, on both sides",
      subtitle: "{currentCity} today, against {targetCity} at its best district.",
      verdictBetter: "You would be left with {amount} more each month.",
      verdictWorse: "You would be left with {amount} less each month.",
      verdictSame: "The money left over would be practically identical.",
      verdictNote: "Before income tax and excluding benefits: neither of those is quantified here.",
      verdictNoteFiscal:
        "Income tax and benefits computed by OpenFisca-France on the legislation in force, assuming a steady income across the year.",
      verdictNoteShort: "Income tax and benefits computed by OpenFisca-France.",
      verdictNoteShortNone: "Income tax and benefits not quantified here.",
      verdictTiers: {
        excellent: {
          emoji: "🎉",
          title: "The move is clearly worth it",
          body: "You would be left with {amount} more a month — {percent} of what you have left today. At that size the gap comfortably survives the approximations in this calculation.",
        },
        good: {
          emoji: "😀",
          title: "A clear gain",
          body: "{amount} more a month, or {percent} of what you have left. A real gain, but check the actual rent before deciding: rent is what can melt it away.",
        },
        modest: {
          emoji: "🙂",
          title: "You gain a little",
          body: "{amount} a month, or {percent}. Real but modest — and the same order as the uncertainty on rent. Do not move for this sum alone.",
        },
        marginal: {
          emoji: "😐",
          title: "It is a draw",
          body: "{amount} a month, or {percent}. Call it equivalent: at this size the calculation cannot decide for you. Decide on what we do not quantify — the job, the people, the time on the road.",
        },
        negative: {
          emoji: "🙁",
          title: "Financially, this move costs you",
          body: "You would be left with {amount} less every month. The higher salary does not cover what comes with it: housing, travel, childcare.",
        },
      },
      verdictOutsized:
        "You would be left with {amount} more a month — more than double what you have left today. A gap that size is worth re-checking against a real rent before you pack.",
      verdictSignOnly:
        "No percentage is shown: what you have left today is too small for a ratio to mean anything.",
      downloadTitle: "Take this result with you",
      downloadDesc:
        "The spreadsheet holds every line with its status and its source. The image is made to be sent to someone.",
      downloadImage: "Image (PNG)",
      downloadPdf: "PDF",
      downloadXlsx: "Spreadsheet (XLSX)",
      downloadPending: "Preparing…",
      downloadFailed: "The download failed. Please try again.",
      shareCardFooter: "Indicative calculation · sources and vintages in the full report",
      here: "Today",
      there: "With the offer",
      rangeLabel: "Between {low} and {high}, depending on the rent you find",
      comparable: "Comparable",
      comparableHint: "Only what changes with the city. This is the figure the verdict rests on.",
      real: "Real",
      realHint: "Comparable minus the rest of your budget, as you declared it.",
      requiredSalaryTitle: "The figure to take into the negotiation",
      requiredSalary:
        "In {city} you need {amount} net to be left with exactly what you have today.",
      requiredSalaryBelow:
        "The offer is already above that threshold: {amount} net would be break-even.",
      requiredSalaryAbove: "The offer falls short: {amount} net would be needed to lose nothing.",
      waterfallTitle: "Where the difference comes from",
      waterfall: {
        salaire: "Salary",
        logement: "Rent",
        energie: "Energy and water",
        transport: "Travel",
        famille: "Trips to family",
        garde: "Nursery",
        alimentation: "Food",
        autre: "Other items",
      },
      moveCostTitle: "What you need up front to move",
      moveCostDesc:
        "One-off costs, never spread over twelve months: spreading them would produce a false verdict. It is often this figure, not the money left over, that actually stops a move.",
      moveCostTotal: "Total to budget for",
      bestDistrict: "Best district",
      salaryDelta: "Salary difference",
      housingDelta: "Rent difference",
      commuteDelta: "Commute difference",
      hoursPerYear: "{hours} h/year",
      perMonth: "/ month",
      seededTitle: "What is still estimated",
      seededDesc:
        "Rents, fuel, electricity, water and distances are measured: Carte des loyers 2025 (ANIL/CEREMA), fuel prices per département, Enedis consumption per commune, SISPEA water prices, road routing. Still estimated: transit fares, the price of a kWh, and the consumption assumptions (m³ per person, L/100 km). Each line's status says which of the two you are looking at, and gas heating is not quantified at all.",
      rankingTitle: "Districts of {city}, most to least advantageous",
      rankingDesc:
        "With the same salary and household, only the district changes. Rent goes down, but the commute and the distance to the shops can take the difference back.",
      colDistrict: "District",
      colRent: "Estimated rent",
      colCommute: "Commute",
      colGrocery: "Food store",
      colResteAVivre: "Left over",
      colVsCurrent: "vs today",
      breakdownTitle: "The detail, line by line",
      revenues: "Income",
      expenses: "Expenses",
      omittedTitle: "What this calculation does not contain",
      omittedDesc:
        "These lines are deliberately left empty. A missing figure is never replaced by zero: it is shown as missing.",
      freshnessTitle: "How fresh the data is",
      freshnessDesc:
        "Every source with the period it describes — not the date we downloaded it — and the geographic level at which it is actually measured.",
      snapshotDate: "Snapshot assembled on {date}",
      distancesTitle: "Distances",
      distancesMeasured:
        "{measured} of {total} districts have distances measured on the road network (collected {date}). The rest keep the modelled value.",
      distancesNone:
        "No measured distances yet: all of them come from the district-archetype model.",
      measuredBadge: "measured",
      derivedBadge: "modelled",
      vintage: "Vintage",
      refresh: "Updated",
      level: "Level",
      goToQuartier: "Choose a district in this city",
      restart: "Change the comparison",
      disclaimer:
        "An indicative comparison based on official public data and on assumptions that are displayed. It is not an offer, not advice, and not a guarantee.",
      empty: {
        title: "No comparison yet",
        desc: "Describe your situation today and the offer you are considering to run the calculation.",
        cta: "Start “Find my job”",
      },
    },
  },
};
