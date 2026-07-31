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
| Prix de l'eau potable €/m³ | SISPEA via Hub'Eau, `D102.0` | 14/14 villes | `scripts/etl/build-utilities.ts` |
| Prix de l'assainissement €/m³ | SISPEA `D204.0`, médiane nationale | uniforme, 2 187 communes | idem |
| Consommation d'électricité kWh/an | Enedis, moyenne par point de livraison | 13/14 villes | idem |

Relancer :

```bash
node --experimental-strip-types scripts/etl/build-market.ts
node --experimental-strip-types scripts/etl/build-utilities.ts
node --experimental-strip-types scripts/etl/build-job-distances.ts
```

Les trois scripts **fusionnent** avec ce qui est déjà sur le disque : une source
indisponible ne supprime pas un chiffre déjà publié. Ce qui n'a pas pu être mesuré
est nommé en fin d'exécution, jamais passé sous silence.

## Encore amorcé

- **Tarifs de transport** (`transitPassMonthly`, `transitTicketUnit`) → grille du
  réseau, ou GTFS `fare_attributes` quand le réseau le publie. C'est le dernier
  poste local encore inventé.
- **Prix du kWh** et hypothèses de consommation (m³/personne, L/100 km) → nationaux,
  donc sans effet sur l'écart entre deux villes.
- **Chauffage au gaz ou réseau de chaleur** → pas chiffré du tout, et déclaré comme
  tel dans « Ce que ce calcul ne contient pas ». La ligne Électricité ne couvre que
  l'électricité ; les anciennes valeurs d'amorçage absorbaient silencieusement le
  chauffage tout en citant Enedis comme source.

C'est la raison pour laquelle un bandeau reste affiché — désormais intitulé « Ce
qui reste estimé » et non plus « Données d'amorçage », qui décrivait mal ce qu'il
reste. Le retirer laisserait croire que chaque ligne est une mesure. Le statut de
chaque ligne (`CALCULÉ`, `SAISI`, `HYPOTHÈSE`, `NON CHIFFRÉ`) dit lequel des deux
on regarde.

## Ce que les vraies données ont corrigé

Les valeurs d'amorçage n'étaient pas seulement approximatives, elles étaient
fausses dans un sens qui flattait le résultat :

- **Versailles** : 20,5 → 24,31 €/m², soit **+248 €/mois** sur 65 m².
- **Carburant** : les seeds étaient 12 à 17 % trop bas partout. Dijon 1,72 → 2,05 €/L.
- L'écart type entre quartiers était deviné (×0,85 / ×1,18) ; c'est maintenant
  l'intervalle publié par la source, qui est plus large.
- **Eau** : les seeds allaient de −20 % (Avignon 3,95 → 3,15 €/m³) à +19 % (Lyon
  3,25 → 3,86 €/m³).
- **Électricité** : la consommation était une constante nationale par archétype —
  le centre de Lille et celui de Nice consommaient exactement pareil. Elle est
  maintenant ancrée sur la moyenne communale Enedis, l'archétype ne servant plus
  que de profil relatif.

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
4. **`D102.0` n'est que la moitié de la facture.** C'est le prix de l'eau potable ;
   l'assainissement porte le code `D204.0`, sur une ligne de service distincte. Écrire
   `D102.0` dans `waterPricePerM3` diviserait la facture par deux tout en l'appelant
   « mesurée ». La ligne s'appelle « Eau et assainissement » : elle doit contenir les
   deux.
5. **Enedis ne dessert pas toute la France.** Le Bas-Rhin relève d'Électricité de
   Strasbourg, Colmar de Vialis. L'absence de Strasbourg n'est pas une panne. Le
   repli est la médiane des grandes communes mesurées, pas la moyenne nationale
   (3 172 kWh, pondérée par adresse et tirée vers le haut par le chauffage électrique
   rural) et surtout pas l'ancienne constante d'archétype, qui faisait lire Strasbourg
   ~30 % plus cher que ses pairs pour une raison de couverture, pas de facture.
6. **Ne pas tuer le wrapper `npx`** quand on redémarre le serveur local : l'enfant
   `next-server` garde le port, le nouveau `next start` échoue en `EADDRINUSE` et
   on teste l'ancien build sans le savoir. Tuer le PID qui écoute :
   `ss -ltnp | grep <port>`.
