# L'assistant IA : architecture et points d'extension

Posé le 2026-08-03.

## Le choix de stack, vérifié

Le nom était bon : **AI SDK** de Vercel, et **AI Elements** existe aussi. Versions
constatées, pas de mémoire :

| | Version | Remarque |
| --- | --- | --- |
| `ai` | **7.0.51** | v7 est la version courante |
| `@ai-sdk/react` | **4.0.54** | épingle `ai@7.0.51` exactement |
| `@ai-sdk/mcp` | **2.0.24** | **MCP est livré avec le SDK**, rien à ajouter |

L'API v7 diffère de ce qu'on trouve dans la plupart des exemples en ligne :
`createUIMessageStreamResponse({ stream: toUIMessageStream(...) })`, et `instructions`
au lieu de `system`.

### AI Elements : pris en partie, et pourquoi

AI Elements est construit sur **shadcn/ui (Radix)**. Notre projet est en
`base-nova`, c'est-à-dire shadcn **sur Base UI**. Le registre le dit sans ambiguïté :

| Composant | Dépendances UI |
| --- | --- |
| `conversation` | `button` — compatible |
| `response` | aucune — compatible |
| `message` | `button-group`, `tooltip` |
| `prompt-input` | `command`, `dropdown-menu`, `hover-card`, `input-group`, `select` |
| `reasoning` | `collapsible` + **`@radix-ui/react-use-controllable-state`** |

Installer l'ensemble ferait cohabiter Radix et Base UI dans la même application :
deux modèles d'accessibilité, deux implémentations des mêmes primitives, et des
composants qui ignorent notre convention `render`. Donc : `streamdown` et
`use-stick-to-bottom` installés pour le rendu markdown en flux et le défilement
collant, le reste écrit sur nos primitives.

## Ce qui tourne

| Élément | Fichier |
| --- | --- |
| Panneau à droite, pleine hauteur | `src/components/ai/ai-panel.tsx` |
| État partagé + largeur + raccourci | `src/components/ai/ai-panel-provider.tsx` |
| Rôles et capacités | `src/lib/ai/roles.ts` |
| Compétences composables | `src/lib/ai/skills.ts` |
| Registre d'outils | `src/lib/ai/tools/index.ts` |
| Serveurs MCP | `src/lib/ai/mcp.ts` |
| Modèles | `src/lib/ai/models.ts` |
| Route de conversation | `src/app/api/ai/chat/route.ts` |

Le panneau s'ouvre par le bouton de l'en-tête ou **Ctrl/⌘ + I**, se ferme par Échap,
se redimensionne en tirant son bord gauche (largeur mémorisée). À partir de `lg` la
**page se décale** au lieu d'être recouverte : les questions posées ici portent sur ce
qui est à l'écran. En dessous, il recouvre, avec un fond cliquable.

## Comment ça reste flexible

Une seule règle : **rien de ce que le client envoie ne décide de ce que l'assistant
peut faire.**

```
requête → rôle (cookie de session, jamais le corps)
        → compétences autorisées ∩ compétences demandées
        → union de leurs outils
        → MCP si le rôle le permet
        → flux
```

- **Ajouter un outil** = une entrée dans `TOOL_REGISTRY` avec la capacité qu'il exige.
- **Ajouter une compétence** = une entrée dans `SKILLS` : un fragment d'instructions,
  ses outils, la capacité requise. Rien d'autre à toucher.
- **Ajouter un serveur MCP** = une entrée JSON dans `AI_MCP_SERVERS`. Aucun déploiement.
- **Changer de modèle** = trois lignes dans la console d'administration, sans déploiement.
  **Ajouter une passerelle** = une entrée dans `GATEWAYS` : elles parlent toutes le format
  OpenAI, donc pas de nouvelle dépendance par fournisseur.

Les fragments d'instructions sont séparés pour une raison mesurable, pas par goût :
un seul prompt long met chaque consigne en concurrence à chaque requête. Qui demande
d'où vient un chiffre n'a pas besoin du paragraphe sur les simulations.

## Sécurité — deux choses trouvées en construisant

1. **Escalade de privilège sur `profiles`.** La colonne `role` pilote les capacités,
   et la politique RLS existante autorise le propriétaire à écrire **toute** sa ligne.
   Ajouter `role` sous cette politique aurait laissé n'importe qui se nommer `admin`
   — et `admin` débloque les serveurs MCP, donc des appels sortants arbitraires. RLS
   accorde ou refuse une instruction entière, elle ne sait pas dire « toutes les
   colonnes sauf celle-là » : d'où un trigger qui **remet l'ancienne valeur** sauf
   pour la clé service. Vérifié en base : la tentative de promotion laisse `member`.

2. **Collision de noms d'outils MCP.** Deux serveurs exposant chacun `search`
   s'écraseraient, et le modèle appellerait l'un en croyant atteindre l'autre. Les
   outils distants sont préfixés par le nom du serveur.

Par ailleurs : les serveurs MCP ne sont **jamais** nommés par le client, seulement par
l'environnement ; un serveur injoignable est signalé et ignoré, pas fatal ; le budget
d'étapes est borné à 6, sans quoi une boucle d'outils coûte de l'argent réel.

## Ce qu'il reste — et ce qu'il faut de vous

### Une clé, et l'assistant parle

`OPENROUTER_API_KEY` dans Vercel et dans `.env.local`. Sans aucune clé de passerelle la
route répond 503 `no_model_available` et journalise le motif de chaque lien de la chaîne,
au lieu d'échouer en silence.

## RAG : recherche plein texte, pas de vecteurs — et pourquoi

Le corpus fait une vingtaine de sections : la méthodologie, les sources et leurs
limites, la politique de confidentialité, la couverture. À cette taille, ce qui décide
de la qualité d'une réponse est **que le texte soit indexé**, pas que l'index soit
sémantique. Postgres apporte un vrai dictionnaire français — désuffixation et mots
vides — sans modèle, sans GPU et sans second entrepôt de données. Et il est exact :
une question sur « SISPEA » trouve SISPEA, là où un plongement d'un nom propre rare
échoue souvent.

**Quand passer à pgvector** (l'extension est disponible sur ce projet) — et pas avant :

1. le corpus dépasse quelques centaines de fragments, où le rappel par mots-clés
   s'effrite ;
2. des questions formulées avec des mots que les documents n'emploient pas manquent
   leur réponse. C'est l'échec propre aux mots-clés, que les vecteurs n'ont pas.

L'interface `Retriever` dans `src/lib/ai/retrieval.ts` fait de ce basculement une
nouvelle implémentation, pas une réécriture.

### L'index était vide, et personne ne le voyait

En sondant l'endpoint en direct : `ai_documents` contenait **zéro ligne**. L'assistant
répondait donc « aucune page ne correspond » à toutes les questions, y compris celles dont
la réponse est écrite sur nos pages. Le tableau ci-dessous, vérifié « en base » lors de la
session précédente, avait été validé sur une table qui n'a jamais été peuplée : la
vérification ne valait rien.

Deux corrections, dont une qui compte plus que l'autre :

1. **Peupler l'index** — 48 fragments, les deux langues.
2. **Ne plus confondre trois choses.** `search()` renvoyait un tableau vide pour « rien ne
   correspond », « rien n'est indexé » et « la recherche est cassée ». Un tableau vide ne
   peut pas dire pourquoi il est vide, et les trois demandent des réponses différentes.
   Le type est maintenant `ok | empty | unavailable`, et chaque cas donne au modèle une
   consigne distincte — aucune n'autorisant de répondre de mémoire. Cinq tests le tiennent
   (`src/lib/ai/retrieval.test.ts`), dont un qui vérifie que la raison technique n'est pas
   récitée au lecteur.

### Deux fragments qui n'auraient pas dû être indexés tels quels

Trouvés en relisant le corpus avant de l'écrire, pas après :

- **`{publisher}` en clair.** La page substitue le nom du responsable de traitement au
  rendu ; le corpus indexait le gabarit. L'assistant pouvait donc citer « {publisher} »
  comme nom du responsable. Ce fichier promettait qu'un index construit depuis le
  dictionnaire ne peut pas diverger de ce que voit un lecteur : construire depuis la même
  source n'en est que la moitié, le rendre pareillement est l'autre.
- **Des titres coupés au milieu d'un mot.** La page couverture produisait trois fragments
  dont le titre était `item.slice(0, 60)` — « Où WhereWise dispose de données suffisantes,
  et où les résul » — et dont deux avaient un titre identique à leur propre contenu. Une
  citation qui pointe une phrase tronquée est pire qu'aucune citation : elle a l'air d'une
  vraie section. Remplacés par un fragment unique, chaque ligne sous le libellé que la
  page lui donne.

### La précision plafonne, et aucune constante n'y changera rien

Un seuil de rang a été ajouté puis **retiré**. Il écartait de bonnes réponses :

| Question | Meilleur fragment | Rang |
| --- | --- | --- |
| « Quand une donnée manque pour une ville… » | Données manquantes — **correct** | 0.08612 |
| « combien coûte un vélo à Tokyo » | Combien de temps nous les gardons — bruit | 0.07295 |

0.086 contre 0.073 : il n'y a pas de place pour une constante. La cause n'est pas le
préfixe `:*` — chercher les mêmes lexèmes à l'identique rend les mêmes lignes. C'est le
dictionnaire français : « données » et l'impératif « donne-moi » se réduisent au **même
radical `don`**, présent dans 10 des 24 fragments français. « donne-moi une recette de
gâteau » touche donc dix passages sur la protection des données, à des rangs
indiscernables d'une vraie question mal formulée.

La recall est donc conservée, et la précision est jugée là où elle peut l'être : le modèle
reçoit les passages et leurs liens, avec la consigne de ne répondre que d'après ce qu'un
passage dit. Vérifié en direct — interrogé sur le prix d'un vélo à Tokyo, il refuse et
signale que la ville n'est pas couverte, au lieu de citer un paragraphe sur la
conservation des journaux.

Le vrai correctif est un test d'informativité (ignorer une correspondance portée par un
radical présent dans une grande part du corpus — la moitié IDF du classement que Postgres
ne fait pas) ou pgvector. À décider et mesurer, pas à régler au doigt.

### Un piège trouvé en testant, pas en réfléchissant

La première version utilisait `websearch_to_tsquery`, qui joint les termes par **ET**.
Interrogée avec « prix de l'eau millésime », elle exigeait les trois — or le passage
sur l'eau dit « tarif » et « millésime », jamais « prix ». La bonne réponse marquait
zéro et le lecteur lisait « rien ne correspond ».

Les lexèmes de la question sont maintenant joints par **OU** et `ts_rank` fait le
classement : un passage qui touche trois termes devance celui qui n'en touche qu'un.
La précision vient du classement, pas du refus de chercher. Vérifié en base :

| Question | Résultat |
| --- | --- |
| « prix de l'eau millésime » | trouve la limite SISPEA (avant : rien) |
| « une donnée manquante compte-t-elle pour zéro ? » | trouve « Données manquantes » |
| « combien coûte un vélo à Tokyo » | **ne trouve rien**, ce qui rend crédible la consigne « dis que tu n'as pas trouvé » |

### Ce qui n'est pas indexé, délibérément

Le dossier `NOTES`. Ce sont des notes d'ingénierie : décisions, pièges, failles
refermées, travail encore dû. `ai_documents` est lisible par tout le monde, donc les
indexer serait les publier. N'entre que le texte déjà affiché sur une page — construit
depuis le dictionnaire, qui *est* la source de ce texte, donc l'index ne peut pas
diverger de ce que voit un lecteur.

### Indexation sans clé secrète

L'écriture était réservée à la clé service-role, ce qui obligeait à faire circuler un
secret pour réindexer. Une politique autorise désormais un **administrateur** à écrire,
et `/api/ai/reindex` tourne sous sa session : réindexer est un bouton dans la console,
pas une variable d'environnement dans un terminal. Le rôle n'étant pas auto-attribuable,
cela n'accorde rien qu'un compte puisse s'accorder seul.

## Historique des conversations

Tables `ai_conversations` / `ai_messages`, RLS par propriétaire, les messages atteints
**au travers** de leur conversation plutôt que par un `user_id` recopié sur chaque
ligne : une seule source de vérité sur qui possède un fil.

Le panneau restaure le fil à l'ouverture et l'enregistre à la fin de chaque flux.
Trois choix à retenir :

- **Remplacer, pas ajouter.** Le client détient déjà le fil complet et il est seul à
  connaître la forme finale d'un message diffusé en flux. Faire réconcilier des ajouts
  partiels au serveur inventerait un problème de synchronisation qui n'existe pas.
- **Écriture sans attente.** Perdre un fil est un petit dommage ; bloquer le panneau
  derrière une écriture qui échoue en est un plus grand.
- **Rien pour un invité.** Nous n'avons aucun endroit qui lui appartienne. Son fil vit
  et meurt avec l'onglet — et le panneau ne demande même pas l'historique, sinon chaque
  visiteur récolterait un 401 dans sa console. Une console pleine d'erreurs attendues
  est la façon dont une vraie erreur passe inaperçue.

## Console d'administration

`/{locale}/app/admin`, réservée au rôle `admin`, qui répond **404** et non 403 : une
page qui dit « interdit » confirme son existence.

Elle est en **lecture seule**, sauf la réindexation et le choix des trois modèles. Compétences, outils et serveurs MCP
sont déclarés dans le code et l'environnement, donc versionnés et relisibles ; les
déplacer dans des lignes de base éditables par un formulaire échangerait cela contre du
confort, et ce qui est configuré ici, c'est ce qu'une IA peut faire au nom d'autrui.

## Modèles : trois liens, et le passage au suivant

L'administrateur choisit trois modèles dans la console ; si le premier ne répond pas, le
suivant prend la requête. Les trois passerelles parlent le format OpenAI, donc une seule
fabrique les couvre : `src/lib/ai/providers.ts`.

Le point délicat n'est pas de choisir un modèle, c'est qu'**un flux engage**. Une fois
les premiers octets partis vers le navigateur, on ne peut plus changer d'avis sans que le
lecteur voie une réponse à deux voix. Chaque candidat est donc **sondé avant** d'être
diffusé : on tire ses premières parties, et seulement s'il produit quelque chose de réel
son flux devient la réponse — les parties consommées étant rejouées, sans quoi la réponse
perdrait ses premiers mots (`src/lib/ai/fallback.ts`).

Ne déclenche pas de bascule : une réponse de mauvaise qualité. Ce n'est pas jugeable ici,
et réessayer doublerait le coût de chaque requête pour échanger un avis contre un autre.

### Ce que les essais réels ont dit

Trois identifiants avaient été écrits de mémoire. Les trois étaient faux : un modèle Zen
inexistant, et deux gratuités OpenRouter supprimées depuis. La liste a donc été demandée
à la passerelle, puis **chaque modèle a reçu une vraie requête** :

| Passerelle | Modèle | Résultat |
| --- | --- | --- |
| OpenCode Zen | tous, y compris `/models` | **HTTP 403, Cloudflare 1010** |
| OpenRouter | `nvidia/nemotron-3-nano-30b-a3b:free` | répond |
| OpenRouter | `nvidia/nemotron-3-super-120b-a12b:free` | répond |
| OpenRouter | `google/gemma-4-31b-it:free` | 429, limité |

Le code 1010 est un refus de client : la même clé fonctionne depuis le CLI OpenCode, donc
la clé est bonne et c'est l'appel serveur qui est rejeté. Zen reste sélectionnable dans la
console, hors chaîne par défaut. **Kilo n'a aucune clé** — aucun compte dans
`auth.json` — et une passerelle sans clé n'est pas proposée : elle mettrait dans le
sélecteur un modèle qui répond 401 à tout.

Gemma est en troisième position parce qu'il était limité au moment de l'essai : le mettre
deuxième ferait payer à chaque requête un sondage voué à échouer.

## Wiki links

Les citations sont rendues cliquables (`src/components/ai/answer.tsx`) : un lien interne
devient un `<Link>` Next dans le même onglet, un lien externe s'ouvre à côté avec
`noopener`, et tout le reste est rendu en texte — un `href` inventé par un modèle ne doit
pas devenir un lien.

**Un domaine inventé.** Vérifié en production, pas en local : l'outil rend
`/fr/methodology#donnees-manquantes` et la réponse a cité
`https://wherewise.com/fr/methodology#donnees-manquantes` — un domaine que personne ne
possède. Rendu tel quel, c'est un lien qui sort du site vers un hôte que nous ne
contrôlons pas, ce qui est pire qu'une ancre cassée : ça ressemble à notre documentation
sans en être. `src/lib/own-path.ts` récupère le chemin quand il correspond à une de nos
routes sous un préfixe de langue, et laisse tranquille une source externe dont le chemin
commence par hasard par `/fr/` — réécrire celle-là casserait une vraie citation. La
consigne demande aussi de reproduire le lien tel quel, mais une consigne n'est pas une
garantie : cinq tests le sont.

**Les ancres étaient mortes.** L'index promettait `/fr/methodology#donnees-manquantes`
depuis le début, et la page ne posait **aucun `id`**. Le lien s'ouvrait, la page
répondait 200, et rien ne défilait : arriver au mauvais endroit ressemble à ne pas
arriver. Le calcul du slug est maintenant partagé (`src/lib/slug.ts`) entre la page et
l'index — deux copies, c'était deux choses à garder d'accord, et l'écart était invisible.
Vérifié : les 14 ancres citées existent dans le HTML servi.

## Le raisonnement, replié

Les modèles gratuits de cette chaîne pensent à voix haute, et beaucoup : une réponse
mesurée a diffusé **653 fragments de raisonnement pour 14 de texte**. Le panneau les
jetait. Ils sont maintenant dans un bloc replié, fermé par défaut : les afficher en clair
enterrerait une réponse de deux lignes sous une page de délibération, les jeter privait le
lecteur du seul récit du chemin suivi.

## Ce qui reste

- **Plusieurs fils** : un seul est restauré, le plus récent. Les tables en acceptent
  autant qu'on veut.
- **Précision de la recherche** — voir la section suivante. C'est la limite connue.
## Le corpus semé, et pourquoi il est généré

`supabase/seed.sql` est chargé par `supabase db reset` : une base neuve démarre avec les
48 fragments, plus jamais avec un index vide.

Il est **généré** depuis le dictionnaire (`npm run seed:corpus`), pas écrit à la main, et
ce n'est pas du confort. Ce projet a déjà payé deux fois pour une deuxième copie de ce
texte : le `{publisher}` indexé en clair et les titres coupés au milieu d'un mot venaient
tous deux d'un corpus qui s'écartait de ce que la page affiche. Un seed maintenu à la main
serait une troisième copie, et l'écart est invisible — l'assistant cite le texte périmé
avec une référence qui a l'air juste.

Ce que les tests tiennent (`src/lib/ai/documents.test.ts`, 10 cas) :

- le fichier sur disque **correspond** au dictionnaire, sinon l'échec dit
  « run `npm run seed:corpus` » ;
- aucun gabarit `{…}` n'entre dans le corpus ;
- aucun titre n'est le début de son propre contenu (le bug des titres tronqués) ;
- la clé naturelle est unique — un doublon ferait *modifier* une ligne au lieu d'en
  ajouter une, retirant silencieusement une section de l'index ;
- rien de `NOTES` n'y entre ;
- l'échappement des apostrophes est vérifié par aller-retour sur chaque fragment.

Ce dernier test s'est trompé d'abord : il comptait les apostrophes par ligne et échouait
sur du SQL parfaitement valide, le contenu étant multiligne. C'était le test qui avait
tort, pas le générateur.

Réindexer une base **en fonctionnement** reste le bouton de la console : pas de secret à
faire circuler, pas de déploiement.

## Le schéma, rapatrié dans le dépôt

Les dix migrations appliquées n'existaient que sur le serveur : comptes, simulations
enregistrées, documents, conversations, réglages, trigger de rôle. Reconstruire
l'environnement depuis le dépôt n'en recréait rien. Elles sont maintenant dans
`supabase/migrations/`, sous leur version d'origine, et **vérifiées au md5** contre ce qui
a réellement été appliqué — les huit rapatriées sont identiques octet pour octet.

### Cinq migrations écartées, et pourquoi c'était nécessaire

`0001` à `0005` décrivaient un dessin antérieur et **n'ont jamais été appliquées à ce
projet** : ni `postgis`, ni `reference.geo_communes`, ni `analytics.metric_values`, ni
`public.simulation_inputs` n'existent en base.

Elles ne pouvaient pas rester à côté des autres. Les migrations s'exécutent dans l'ordre
des noms, donc `0004` passerait **avant** `20260802165414`, et les deux créent
`public.profiles` en désaccord sur ce qu'est un profil : `display_name` d'un côté,
`first_name`/`last_name`/`home_city_id`/`role` de l'autre. `0004` utilise `if not exists`,
la migration appliquée non — un push sur une base vide créerait donc l'ancienne table puis
échouerait sur la vraie. Pire encore si l'échec passait inaperçu : l'application lirait un
`profiles` sans colonne `role`, celle dont dépend tout ce que l'assistant s'autorise.

Déplacées dans `supabase/superseded/`, avec un README qui dit tout cela — pas supprimées,
parce qu'elles sont le seul écrit sur les schémas `reference` et `analytics`, et que cet
ETL peut revenir.

## La console vérifiée dans un navigateur, et ce que ça a révélé

Vérifiée sur un stack local reconstruit depuis les migrations, avec un vrai compte, une
vraie session obtenue en cliquant le lien reçu par courrier. Ce qui marche :

| Vérification | Résultat |
| --- | --- |
| État : passerelles avec clé, fragments indexés, MCP | « OpenCode Zen, OpenRouter », 48, « aucun » |
| Kilo sans clé | proposé désactivé, « clé absente » |
| Enregistrer une chaîne de deux modèles | écrite en base, 3ᵉ ligne vide écartée, auteur noté |
| Relecture de la chaîne enregistrée | reprise dans le formulaire |
| Bouton Réindexer | les 48 lignes retouchées, sous la session admin, sans clé de service |
| Repli avec un 1ᵉʳ modèle inexistant | le visiteur a sa réponse, journal : « fell back to … is not a valid model ID » |
| `/app/admin` pour un membre | **404** |
| `PUT /api/ai/settings` et `POST /api/ai/reindex` pour un membre | **403**, chaîne inchangée |

### Trois défauts trouvés en le faisant

**1. Personne ne pouvait devenir administrateur.** `protect_profile_role` ne fait
confiance qu'à un JWT `service_role`. Hors PostgREST il n'y a pas de
`request.jwt.claims`, donc un `update … set role = 'admin'` depuis l'éditeur SQL réussit
et ne change rien. Il n'existait aucun chemin vers le premier admin sans faire circuler
la clé de service — le secret que cette console existe pour éviter. Corrigé : une
connexion base directe est reconnue, ce qui ne lui concède rien qu'elle n'ait déjà.

**Et la première correction a ouvert un trou.** Elle testait `current_user` — qui, dans
une fonction `SECURITY DEFINER`, est le *propriétaire* de la fonction, pas l'appelant. La
condition était donc vraie pour tout le monde, et un membre connecté s'est promu
administrateur du premier coup. Trouvé en tentant l'attaque, pas en relisant le code.
`session_user` traverse le changement de propriétaire, lui. Mesuré :

```
psql en postgres     current_user=postgres  session_user=postgres       membre_du_proprio=t
PostgREST, membre    current_user=postgres  session_user=authenticator  membre_du_proprio=f
```

`is_superuser` n'est pas utilisé : il vaut `off` même pour `postgres` chez Supabase, donc
un test dessus ressemblerait à une garantie sans jamais être vrai. Les quatre sens sont
vérifiés : l'opérateur promeut, le membre ne se promeut pas, le membre change toujours
son prénom, le membre ne dégrade pas l'admin.

**2. La connexion ne pouvait pas aboutir.** Le formulaire demande à revenir sur
`/auth/callback?next=…`, et la liste d'URL autorisées contenait l'adresse **exacte**, sans
query. Supabase refuse et substitue `site_url` : le lien du courriel pointait donc sur la
page d'accueil, le code n'était jamais échangé. Ce qui explique le seul compte du projet
cloud avec `last_sign_in_at = null` — **personne n'a jamais réussi à se connecter**. Vu
dans le courrier, dans les deux sens : adresse exacte → `redirect_to=https://wherewise-fr.vercel.app` ;
avec `**` → `http://localhost:3111/auth/callback?next=%2Ffr%2Fapp%2Faccount`, et la
connexion aboutit.

**3. L'en-tête ignorait la session.** Bouton « Se connecter » codé en dur : une personne
déjà connectée était invitée à se connecter, et aucun chemin ne menait à son compte ni à
la console — il fallait taper l'URL. Le rôle vient maintenant du serveur : invité →
« Se connecter », membre → « Compte », administrateur → « Console » en plus.

## Dette de dépendances constatée au passage

`npm audit` remonte 4 vulnérabilités **antérieures** à cette installation (`npm audit
fix` a fermé les 7 arrivées avec le SDK) :

- `next`, `postcss`, `sharp` — hautes, corrigées par un passage en **Next 16.3.0**,
  non majeur. À faire comme changement séparé et vérifié.
- `xlsx` — haute, **aucun correctif disponible sur npm**. SheetJS ne publie plus sur
  npm ; la version corrigée s'installe depuis leur propre CDN. Utilisé par l'export
  tableur du simulateur.
