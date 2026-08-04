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

### Non fait, par honnêteté sur l'état

- **RAG.** L'interface n'est pas encore écrite. Le socle existe pourtant : Supabase
  avec pgvector, et des documents à indexer (les NOTES, la méthodologie, les sources).
  À faire : extension `vector`, table `ai_documents`, un ETL d'indexation, et un outil
  `searchDocs` gardé par `useRetrieval`.
- **Wiki links.** Dépend du RAG : résoudre `[[méthodologie#pondération]]` vers une
  ancre réelle demande d'abord un index des documents.
- **Historique des conversations.** Rien n'est persisté : fermer le panneau perd le
  fil. Tables `ai_conversations` / `ai_messages` avec RLS, comme `simulations`.
- **Interface d'administration** pour les compétences, les serveurs MCP et les rôles.
  Aujourd'hui tout se déclare dans le code ou l'environnement, ce qui est le bon
  premier état : versionné et relisible.

## Dette de dépendances constatée au passage

`npm audit` remonte 4 vulnérabilités **antérieures** à cette installation (`npm audit
fix` a fermé les 7 arrivées avec le SDK) :

- `next`, `postcss`, `sharp` — hautes, corrigées par un passage en **Next 16.3.0**,
  non majeur. À faire comme changement séparé et vérifié.
- `xlsx` — haute, **aucun correctif disponible sur npm**. SheetJS ne publie plus sur
  npm ; la version corrigée s'installe depuis leur propre CDN. Utilisé par l'export
  tableur du simulateur.
