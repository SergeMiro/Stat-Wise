# Comptes et simulations enregistrées

Mis en place le 2026-08-02.

## L'idée

Un visiteur arrive sans compte, lance une simulation, et voit ses propres chiffres.
C'est le seul moment où un compte a une valeur évidente : pas « inscrivez-vous »
sur la page d'accueil, mais « gardez ce résultat » sous le résultat.

## Ce qui tourne

| Élément | Où |
| --- | --- |
| Projet Supabase `statwise` | `eiwbtcrwvkylppmykfqq`, région **eu-west-3 (Paris)**, gratuit |
| Tables `profiles` et `simulations` | RLS active, chacun ne voit que ses lignes |
| Connexion | lien par e-mail, **sans mot de passe** |
| Bouton Google | prêt, masqué tant que `NEXT_PUBLIC_GOOGLE_SIGN_IN=1` n'est pas posé |
| Bouton « Gardez ce résultat » | bas de `/app/job/result` |
| Page `/app/account` | liste, suppression, déconnexion |

### Pas de mot de passe, et c'est voulu

Le visiteur saisit son adresse, reçoit un lien, clique. Ce lien **confirme
l'adresse et ouvre la session en une seule fois** — exactement le parcours
demandé. Corollaire : nous ne stockons aucun identifiant qui pourrait fuiter.

### Ce que le compte reprend de la simulation

Le simulateur ne demande **pas** de nom, et n'en demandera pas : rien dans le
calcul n'en a besoin, et la promesse est « deux minutes, aucun document ». Le nom
est demandé au moment de créer le compte, pas avant.

En revanche la **ville de résidence** est déjà connue : elle est reprise du
brouillon et écrite dans le profil sans rien redemander. Vérifié en base après une
inscription réelle : `first_name: Sergiy, last_name: Testeur, home_city_id: dijon`.

### Le trajet par la boîte mail

Entre « je veux garder ce résultat » et le retour depuis l'e-mail, il n'y a pas de
session : rien ne peut être écrit. La simulation attend donc dans le stockage local
(`statwise:pending-simulation:v1`) et la page compte la reprend à l'arrivée. En cas
d'échec elle **reste** en attente plutôt que d'être perdue : réessayer ne coûte
rien, perdre en silence coûte la promesse qu'on vient de faire.

## Sécurité

- Le `user_id` n'est **jamais** lu depuis le corps de la requête : il vient du
  cookie de session, et la politique RLS le revérifie en base. Deux contrôles
  indépendants pour la seule question qui compte.
- Vérifié : un appelant anonyme voit `0` profil et `0` simulation.
- `/api/simulations` répond 401 sans session, 400 sur un corps invalide, 413
  au-delà de 64 Ko.
- Les erreurs Postgres ne sont pas renvoyées telles quelles : elles nomment des
  colonnes et des politiques.
- Le paramètre `next` du lien de confirmation passe par `safeRedirect()`, testé
  contre `//evil`, `/\evil`, les espaces et les caractères de contrôle. C'est une
  valeur qui arrive dans une URL cliquée dans un e-mail.
- Les deux fonctions `SECURITY DEFINER` étaient exposées en RPC appelables par
  `anon` — le linter Supabase l'a signalé, `EXECUTE` leur a été retiré.

## Deux pièges rencontrés

1. **Le proxy de langue avalait `/auth/callback`.** Il préfixait toutes les URL
   sans locale, donc le lien de l'e-mail partait en redirection vers
   `/fr/auth/callback` et le code à usage unique se perdait en route : **aucune
   confirmation n'aurait fonctionné**. `auth` est maintenant exclu du matcher.
2. **Deux balises `<main>`.** Le layout en fournit déjà une ; mes pages en
   ajoutaient une seconde. Un lecteur d'écran y voit deux fois le repère principal.

## Ce qu'il reste à faire — trois réglages, hors du code

### 1. URL de redirection — **obligatoire, sinon les liens ne marchent pas**

Supabase → Authentication → URL Configuration :

- **Site URL** : `https://statwise-lime.vercel.app`
- **Redirect URLs** : `https://statwise-lime.vercel.app/auth/callback`
  et `http://localhost:3111/auth/callback` pour le développement

Par défaut un projet neuf pointe sur `http://localhost:3000`. Tant que ce n'est pas
changé, le bouton de l'e-mail envoie les gens sur une adresse locale.

### 2. SMTP — **obligatoire avant le moindre trafic**

Le serveur d'envoi intégré est limité à **quelques e-mails par heure** et n'est pas
prévu pour la production. Constaté pendant les essais : le deuxième envoi a répondu
`over_email_send_rate_limit`. Brancher un SMTP (Resend, Brevo, Postmark) dans
Authentication → Emails.

### 3. Google — optionnel

Créer un identifiant OAuth dans Google Cloud Console, le coller dans Supabase →
Authentication → Providers → Google, puis poser `NEXT_PUBLIC_GOOGLE_SIGN_IN=1` sur
Vercel. Le bouton apparaît tout seul. Apple suit la même mécanique le jour venu.

## La remise de 20 %

Il n'y a aucun paiement dans le produit aujourd'hui. La ligne « −20 % sur toutes
les simulations à venir, quand elles deviendront payantes » est donc une promesse
affichée, sans mécanique derrière — c'est ce qui a été décidé plutôt que de coder
une remise sur un prix qui n'existe pas. Le jour où un prix existera, il faudra :
un compteur de simulations, un prix, Stripe, et le rabais appliqué aux comptes.

## RGPD

Données conservées : e-mail, prénom, nom, ville de résidence, et les simulations
que la personne a explicitement enregistrées — lesquelles contiennent un salaire,
un loyer et un nombre d'enfants. Rien n'est écrit sans un geste volontaire.
Serveurs en France. La suppression du compte efface tout par cascade.

La page `/privacy` a été réécrite en politique complète, sur la liste de mentions
qu'exige la CNIL : responsable, finalités, bases légales, destinataires, durées,
droits, réclamation. Elle est en tableaux plutôt qu'en paragraphes, parce que
l'obligation est d'être « concise, transparente et aisément accessible ».

**Reste une valeur à renseigner** : `SITE_PUBLISHER.contactEmail` dans
`src/lib/site-publisher.ts`. Tant qu'elle est vide, la page n'affiche aucune adresse
plutôt qu'une adresse qui rebondirait — un contact injoignable pour une demande RGPD
est pire que pas de contact du tout.

## Les fonctions serveur tournaient aux États-Unis

Vercel exécute les fonctions à Washington (`iad1`) par défaut, pour **tout nouveau
projet**. `/api/fiscal` reçoit un salaire et un loyer, `/api/simulations` les écrit
en base : les deux traitaient donc des données financières hors de l'UE, vers une
base située à Paris. Corrigé par un `vercel.json` :

```json
{ "regions": ["cdg1"] }
```

C'est le genre de réglage qu'on ne voit pas : rien ne casse, rien n'avertit, et la
politique de confidentialité aurait annoncé un hébergement français en toute bonne
foi.
