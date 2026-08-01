# Tarifs de transport en commun — le dernier chiffre local inventé

Relevé du 2026-08-01. Tout ce qui suit a été vérifié en téléchargeant les fichiers,
pas lu dans une documentation.

**Ce document ne propose pas une solution unique : il pose les faits et trois
options, pour que le choix soit fait en connaissance de cause.**

## Pourquoi ça compte

Deux champs, dans `src/domain/reste-a-vivre/snapshot.ts` :

- `transitPassMonthly` — 38 à 90,80 € selon la ville. **C'est le chiffre qui pèse.**
  Il entre dans le reste à vivre de tout foyer qui coche « transports en commun »,
  et l'écart entre deux villes peut atteindre 50 €/mois, soit plus que l'écart
  d'électricité et d'eau réunis.
- `transitTicketUnit` — 1,40 à 2,50 €. Sert aux courses hors abonnement. Enjeu
  faible : quelques euros par mois.

Les deux sont aujourd'hui saisis à la main. C'est la dernière chose que le
simulateur invente localement, et c'est ce que dit le bandeau « Ce qui reste
estimé ».

## Ce que publient réellement les réseaux

Source : `transport.data.gouv.fr` (Point d'Accès National), champ `has_fares` des
métadonnées, puis inspection du ZIP GTFS quand il annonce des tarifs.

| Ville | Réseau | Fichiers tarifaires | Ticket | Abonnement mensuel |
| --- | --- | --- | --- | --- |
| Strasbourg | CTS | **GTFS-Fares v2** | 1,90 € | **56,00 €** |
| Bordeaux | TBM | **GTFS-Fares v2** | 1,90 € | **55,00 €** |
| Toulouse | Tisséo | v1, 4 tarifs | 1,80 € | absent |
| Nice | Lignes d'Azur | v1, 7 tarifs | 1,70 € | absent (pass 1/2/7/14 j) |
| Lille | Ilévia | v1, 13 tarifs | 1,80 € | absent |
| Lyon | TCL | v1, 4 tarifs | oui | absent |
| Nantes | Naolib (TAN) | v1, 2 tarifs | 1,80 € | absent |
| Marseille | RTM | `has_fares` = non | — | — |
| Montpellier | TaM | `has_fares` = non | — | — |
| Dijon, Saint-Apollinaire | Divia | `has_fares` = non | — | — |
| Avignon | Orizo | `has_fares` = non | — | — |
| Paris, Versailles | IDFM (Navigo) | **aucun fichier tarifaire** (169 Mo de GTFS) | — | — |

Autrement dit :

- **2 réseaux sur 12** donnent l'abonnement mensuel — ceux passés à GTFS-Fares v2.
- **7 sur 12** donnent le ticket unitaire.
- **5 sur 12** ne donnent rien, dont Paris, qui est la ville la plus chère et celle
  où l'erreur coûterait le plus.

## Ce que ça révèle sur nos valeurs actuelles

Les tickets unitaires saisis à la main sont **justes** là où on peut les vérifier :
Nice 1,70 ✓, Lille 1,80 ✓, Toulouse 1,80 ✓, Nantes 1,80 ✓, Strasbourg 1,90 ✓.
Une seule erreur : Bordeaux 1,80 au lieu de 1,90.

Les abonnements, eux, dérivent :

- **Bordeaux : 45,50 € saisi contre 55,00 € publié — 21 % en dessous.**
- **Strasbourg : 52,50 € contre 56,00 € — 6,7 % en dessous.**

Sur les deux seules villes vérifiables, les deux sont fausses, et toujours dans le
même sens : trop bas. Un abonnement sous-évalué gonfle le reste à vivre de la ville
concernée et fausse le verdict en sa faveur. Il n'y a aucune raison de penser que
les dix autres soient meilleures.

## Le piège, si on part sur GTFS

Le format ne dit pas *quel* produit est « l'abonnement adulte plein tarif ». Il
donne une liste, en français libre, où il faut choisir. Extrait réel de Bordeaux :

```
TBM_30014,CSC - LE PASS - MENSUEL,55.00,EUR,TBM_carte,TBM_adulte
TBM_30214,CSC - PASS JEUNE - MENSUEL,35.10,EUR,TBM_carte,TBM_jeune28
TBM_30814,CSC - LE PASS MENSUEL SOLIDAIRE 2,27.50,EUR,TBM_carte,TBM_adulte
```

Trois lignes « mensuelles », de 27,50 à 55,00 €, dont deux portent la catégorie
`TBM_adulte`. Un filtre naïf sur « MENSUEL » + « adulte » peut retenir 27,50 € — le
tarif solidaire sous conditions de ressources — et le présenter comme le prix
normal. C'est exactement le type d'erreur qui nous a déjà coûté deux passes cette
semaine (le filtre commerces qui acceptait Biocoop, la station-service dont `prix`
n'était pas un tableau) : plausible, silencieux, faux.

En v2 il y a un garde-fou utilisable : `rider_categories.txt` porte
`is_default_fare_category`, qui désigne le tarif normal. En v1 il n'y a rien —
seulement une chaîne de caractères.

## Trois options

### A — Relevé manuel, traité comme un barème

Les tarifs de transport ne sont pas un jeu de données, ce sont des **prix
administratifs**, publiés en PDF ou sur une page web, comme le barème kilométrique
DGFiP ou le barème PSU des crèches. Le dépôt sait déjà gérer ça :
`scripts/check-vintages.mjs` porte un propriétaire, une URL et une date de
re-vérification par barème, et échoue quand l'un est périmé.

Concrètement : un `transit-fares.json` avec, par ville, le prix, l'URL de la grille
tarifaire et la date du relevé ; une entrée dans le registre de fraîcheur avec
révision semestrielle.

- Couvre **12/12 réseaux**, Paris compris.
- Coût : ~1 h de relevé, puis ~20 min deux fois par an.
- Faiblesse : saisi à la main. Mitigée par l'URL et la date affichées, et par le
  fait que le registre le rend impossible à oublier.

### B — GTFS là où il existe, manuel ailleurs

- Couvre 2/12 pour l'abonnement, 7/12 pour le ticket.
- Introduit exactement l'artefact refusé deux fois cette semaine : deux villes
  mesurées et dix estimées, l'écart entre elles reflétant qui publie plutôt que qui
  facture. Sauf que les dix restantes seraient de toute façon relevées à la main —
  donc l'artefact est faible, mais le code à écrire est double.
- Coût : le relevé manuel de A **plus** un ETL GTFS (téléchargement de ZIP de 5 à
  169 Mo, lecture v1 et v2, sélection du bon produit).

### C — Demander son abonnement à l'utilisateur

Le foyer connaît le prix de son propre abonnement. Le moteur a déjà le statut
`user` pour ça, et c'est ainsi que le loyer actuel est traité.

- Règle le côté « aujourd'hui » exactement.
- Ne règle **pas** le côté « avec l'offre » : personne ne connaît le tarif de la
  ville où il n'habite pas encore. Or c'est précisément le chiffre qui décide.
- À garder comme complément de A, pas comme remplacement.

## Recommandation

**A, avec l'ajout de C plus tard.** Les tarifs de transport se comportent comme un
barème, pas comme un jeu de données : peu de valeurs, changement annuel, source
officielle mais non machine-lisible. Le mécanisme qui les tient à jour existe déjà
et il a déjà attrapé un barème périmé.

B ne devient intéressant que le jour où la majorité des réseaux sera passée à
GTFS-Fares v2. Deux sur douze aujourd'hui — à revérifier dans un an, la bascule est
en cours.

Dans tous les cas, **corriger Bordeaux (45,50 → 55,00 €) et Strasbourg (52,50 →
56,00 €) tout de suite** : ce sont les deux seules valeurs dont on sait qu'elles
sont fausses, et on connaît la bonne.

## Si on part sur A, ce qu'il faut décider

1. Quel produit fait référence : abonnement mensuel adulte plein tarif, sans
   condition de ressources ni réduction jeune/senior. À confirmer, car c'est ce qui
   rend les douze villes comparables.
2. Faut-il modéliser les tarifs solidaires sous conditions de ressources ? Ils
   changent tout pour les foyers modestes (Bordeaux 27,50 contre 55,00 €) et le
   moteur connaît déjà les revenus du foyer. C'est un vrai sujet produit, pas une
   question de données.
3. Rythme de révision : semestriel proposé, la plupart des réseaux augmentant au
   1er juillet.
