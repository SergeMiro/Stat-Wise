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
- **Changer de modèle** = une chaîne `fournisseur/modèle` dans `models.ts`. Passer de
  Mistral à Claude à un Llama local est une ligne, sans nouvelle dépendance : c'est la
  raison d'utiliser l'AI Gateway plutôt qu'un paquet par fournisseur.

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

`AI_GATEWAY_API_KEY` dans Vercel et dans `.env.local`. Sans elle la route répond 503
et le panneau affiche une explication au lieu d'échouer. Sur Vercel, l'AI Gateway
peut aussi s'authentifier par OIDC sans clé.

Le modèle par défaut est `mistral/mistral-small-latest` : la plupart des questions ici
sont « résoudre une ville, appeler un outil, relire le nombre », et payer un modèle
frontière pour ça serait payer pour rien.

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

Elle est en **lecture seule**, sauf la réindexation. Compétences, outils et serveurs MCP
sont déclarés dans le code et l'environnement, donc versionnés et relisibles ; les
déplacer dans des lignes de base éditables par un formulaire échangerait cela contre du
confort, et ce qui est configuré ici, c'est ce qu'une IA peut faire au nom d'autrui.

## Ce qui reste

- **Wiki links.** L'index porte déjà l'ancre de chaque fragment
  (`/fr/methodology#donnees-manquantes`), donc le socle est là ; il manque le rendu des
  citations en liens cliquables dans le panneau.
- **Choix du modèle dans l'interface** pour un administrateur : la capacité
  `chooseModel` existe, le sélecteur non.
- **Plusieurs fils** : un seul est restauré, le plus récent. Les tables en acceptent
  autant qu'on veut.

## Dette de dépendances constatée au passage

`npm audit` remonte 4 vulnérabilités **antérieures** à cette installation (`npm audit
fix` a fermé les 7 arrivées avec le SDK) :

- `next`, `postcss`, `sharp` — hautes, corrigées par un passage en **Next 16.3.0**,
  non majeur. À faire comme changement séparé et vérifié.
- `xlsx` — haute, **aucun correctif disponible sur npm**. SheetJS ne publie plus sur
  npm ; la version corrigée s'installe depuis leur propre CDN. Utilisé par l'export
  tableur du simulateur.
