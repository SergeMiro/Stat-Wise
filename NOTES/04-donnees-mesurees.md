# Ce qui est mesuré, ce qui reste amorcé

État au 2026-07-31. Aucune clé, aucun compte pour aucune de ces sources.

## Mesuré

| Donnée | Source | Couverture | Script |
| --- | --- | --- | --- |
| Loyer €/m² (appartement, maison) | Carte des loyers 2025, ANIL/CEREMA | 14/14 villes | `scripts/etl/build-market.ts` |
| Intervalle de confiance du loyer | la même, colonnes `lwr.IPm2` / `upr.IPm2` | 14/14 | idem |
| Nombre d'observations par commune | la même, `nbobs_com` | 14/14 | idem |
| Prix du litre (E10, sinon SP95) | Prix des carburants, flux instantané | 14/14 départements | idem |
| Distance domicile-travail, domicile-commerce | OSM (ancrage) + IGN Géoplateforme (itinéraire) | 77/93 quartiers | `scripts/etl/build-job-distances.ts` |
| Impôt sur le revenu, APL, allocations familiales | OpenFisca-France, API publique | à la demande, par simulation | `src/lib/openfisca.ts` |

Relancer :

```bash
node --experimental-strip-types scripts/etl/build-market.ts
node --experimental-strip-types scripts/etl/build-job-distances.ts
```

Les deux scripts **fusionnent** avec ce qui est déjà sur le disque : une source
indisponible ne supprime pas un chiffre déjà publié. Ce qui n'a pas pu être mesuré
est nommé en fin d'exécution, jamais passé sous silence.

## Encore amorcé

- **Électricité** (`electricityKwhYear`) → Enedis, consommation résidentielle par IRIS
- **Eau** (`waterPricePerM3`) → SISPEA via Hub'Eau, périmètre du service
- **Tarifs de transport** (`transitPassMonthly`, `transitTicketUnit`) → grille du
  réseau, ou GTFS `fare_attributes` quand le réseau le publie

C'est la raison pour laquelle le bandeau « Données d'amorçage » reste affiché. Le
retirer laisserait croire que chaque ligne est une mesure. Le statut de chaque
ligne (`CALCULÉ`, `SAISI`, `HYPOTHÈSE`, `NON CHIFFRÉ`) dit lequel des deux on
regarde.

## Ce que les vraies données ont corrigé

Les valeurs d'amorçage n'étaient pas seulement approximatives, elles étaient
fausses dans un sens qui flattait le résultat :

- **Versailles** : 20,5 → 24,31 €/m², soit **+248 €/mois** sur 65 m².
- **Carburant** : les seeds étaient 12 à 17 % trop bas partout. Dijon 1,72 → 2,05 €/L.
- L'écart type entre quartiers était deviné (×0,85 / ×1,18) ; c'est maintenant
  l'intervalle publié par la source, qui est plus large.

## Pièges rencontrés, à ne pas réintroduire

1. **`prix` n'est pas toujours un tableau.** Une station qui ne vend qu'un seul
   carburant sérialise un objet nu. Appeler `.find` dessus lève, et si le `catch`
   entoure toute la boucle, c'est le département entier qui est perdu. Onze
   départements sur quatorze répondaient « pas de donnée » alors qu'ils
   répondaient tous HTTP 200.
2. **Paris, Lyon, Marseille sont publiés par arrondissement.** Une médiane sur les
   arrondissements donnerait au centre le prix moyen de toute la ville. On prend le
   **75e centile**, et c'est écrit dans le script, pas caché dans une constante.
3. **Un `catch` qui renvoie `null` rend une panne indistinguable d'une absence de
   donnée.** Toujours réessayer, puis nommer l'échec.
4. **Ne pas tuer le wrapper `npx`** quand on redémarre le serveur local : l'enfant
   `next-server` garde le port, le nouveau `next start` échoue en `EADDRINUSE` et
   on teste l'ancien build sans le savoir. Tuer le PID qui écoute :
   `ss -ltnp | grep <port>`.
