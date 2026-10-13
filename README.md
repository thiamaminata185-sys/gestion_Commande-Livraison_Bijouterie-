# Bijouterie Étoile d'Or - API Laravel

Application backend de gestion d'une bijouterie développée avec **Laravel** et **Sanctum**.
Cette API REST est le socle d'une application web complète (frontend Angular) permettant aux clients de parcourir le catalogue, remplir un panier, passer et payer des commandes et suivre leur livraison, et aux équipes de la bijouterie (gestionnaire, artisan, livreur, administrateur) de piloter l'ensemble des opérations (catalogue, production, paiements, factures, livraisons, statistiques).

Cinq rôles : **client**, **gestionnaire**, **artisan**, **livreur**, **admin**.

---

##  Prérequis

- PHP >= 8.3
- Composer
- PostgreSQL
- Postman (pour tester l'API)
- (Optionnel) Node.js / NPM pour le frontend Angular

---

##  Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/thiamaminata185-sys/gestion_Commande-Livraison_Bijouterie-.git
cd gestion_Commande-Livraison_Bijouterie
```

> Adaptez l'URL au nom réel de votre dépôt GitHub.

### 2. Installer les dépendances PHP

```bash
composer install
```

### 3. Configurer l'environnement

Copier le fichier d'environnement :

```bash
cp .env.example .env
```

Créer la base `bijouterie_etoile_or` dans PostgreSQL, puis modifier les paramètres de connexion dans `.env` :

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=bijouterie_etoile_or
DB_USERNAME=postgres
DB_PASSWORD=
```

### 4. Générer la clé de l'application

```bash
php artisan key:generate
```

### 5. Lancer les migrations et les seeders

```bash
php artisan migrate:fresh --seed
```

Cela créera les tables, ajoutera 5 comptes (un par rôle), 3 catégories, 3 bijoux et une commande d'exemple en attente.

> `migrate:fresh` efface toute la base. Les identifiants cités dans ce document (bijou n°1, livreur n°4…) valent pour une base fraîchement peuplée.

### 6. Lancer le serveur de développement

```bash
php artisan serve
```

L'API est maintenant accessible sur http://127.0.0.1:8000/api.

---

## Comptes de test

Mot de passe de tous les comptes : `password`

| Email | Mot de passe | Rôle | id |
|---|---|---|---|
| admin@etoile-or.sn | password | Admin | 1 |
| gestion@etoile-or.sn | password | Gestionnaire | 2 |
| client@test.sn | password | Client (avec une commande en attente) | 3 |
| livreur@etoile-or.sn | password | Livreur | 4 |
| artisan@etoile-or.sn | password | Artisan | 5 |

Données de départ :

- Catégories : `1` Or, `2` Argent, `3` Pierres précieuses
- Bijoux : `1` Bague Alliance Or 18K (250 000 FCFA, stock 9 après la commande d'exemple), `2` Collier Perles de Tahiti (180 000, stock 5), `3` Bracelet Argent Massif (45 000, stock 25)
- Commande d'exemple n°1 (client Aminata, `en_attente`, 250 000 FCFA)

> En production, changez ces mots de passe.

---

## Documentation de l'API

Toutes les routes sont préfixées par `/api/`.
L'authentification est gérée par Sanctum (tokens Bearer). Les rôles autorisés sont indiqués pour chaque route ; « Tous » = tout utilisateur connecté.

### Authentification

| Méthode | Route | Rôle requis | Description |
|---|---|---|---|
| POST | `/register` | Aucun | Inscription d'un nouveau client |
| POST | `/login` | Aucun | Connexion et récupération d'un token |
| POST | `/logout` | Tous | Déconnexion (suppression du token) |
| GET | `/me` | Tous | Récupérer l'utilisateur connecté |
| PATCH | `/profil` | Tous | Modifier son profil (`prenom`, `nom`, `telephone`, `adresse`, `image`) |

**POST /register** (crée toujours un compte `client`)

```json
{
  "prenom": "Fatou",
  "nom": "Sarr",
  "email": "fatou@test.sn",
  "telephone": "776666666",
  "adresse": "Dakar, Almadies",
  "motDePasse": "motdepasse123",
  "motDePasse_confirmation": "motdepasse123"
}
```

Le mot de passe doit faire **8 caractères minimum** et `motDePasse_confirmation` est obligatoire.

**POST /login** → `{ "email": "client@test.sn", "motDePasse": "password" }`

```json
{ "utilisateur": { "id": 3, "role": "client", "...": "..." }, "token": "1|abc..." }
```

Un compte désactivé reçoit **403 « Compte désactivé »**. Le login et l'inscription sont limités à 10 tentatives par minute (429 au-delà).

### Catalogue

| Méthode | Route | Rôle requis | Description |
|---|---|---|---|
| GET | `/bijoux` | Tous | Liste paginée (filtres : `search`, `idCategorie`, `type`, `prixMin`, `prixMax`, `page`) |
| GET | `/bijoux/{id}` | Tous | Détail d'un bijou |
| POST | `/bijoux` | Gestionnaire, Admin | Créer un bijou |
| PUT/PATCH | `/bijoux/{id}` | Gestionnaire, Admin | Modifier un bijou |
| DELETE | `/bijoux/{id}` | Gestionnaire, Admin | Supprimer un bijou (409 s'il figure dans une commande) |
| GET | `/categories` | Tous | Liste des catégories |
| GET | `/categories/{id}` | Tous | Détail d'une catégorie |
| POST | `/categories` | Gestionnaire, Admin | Créer une catégorie |
| PUT/PATCH | `/categories/{id}` | Gestionnaire, Admin | Modifier une catégorie |
| DELETE | `/categories/{id}` | Gestionnaire, Admin | Supprimer une catégorie (409 si elle contient des bijoux) |

Exemple de recherche : `GET /bijoux?search=bague&prixMax=300000` (insensible à la casse).

**POST /bijoux**

```json
{
  "idCategorie": 1,
  "nomBijou": "Boucles d'oreilles Or 18K",
  "descriptionBijou": "Paire de boucles en or jaune",
  "type": "Boucles",
  "prix": 120000,
  "prixDorigine": 100000,
  "quantiteStock": 8,
  "image": "boucles.jpg",
  "images": ["boucles1.jpg", "boucles2.jpg"],
  "etiquette": ["nouveau", "or"],
  "idArtisan": 5
}
```

Obligatoires : `idCategorie`, `nomBijou`, `prix`, `quantiteStock`. `idArtisan` doit être un utilisateur de rôle `artisan`.

**POST /categories** → `{ "nomCategorie": "Montres", "descriptionCategorie": "Montres de luxe" }`

### Panier

| Méthode | Route | Rôle requis | Description |
|---|---|---|---|
| GET | `/panier` | Client | Voir son panier avec le total |
| POST | `/panier` | Client | Ajouter un bijou (`{ "idBijou": 1, "quantite": 2 }`, `quantite` = 1 par défaut) |
| PATCH | `/panier/{idBijou}` | Client | Changer la quantité (`{ "quantite": 3 }`) |
| DELETE | `/panier/{idBijou}` | Client | Retirer un produit |
| DELETE | `/panier` | Client | Vider le panier |

Ajouter un bijou déjà présent **augmente** sa quantité. Chaque opération vérifie le stock disponible (422 sinon). Toutes les réponses renvoient le panier complet :

```json
{
  "lignes": [
    { "idBijou": 1, "nomBijou": "Bague Alliance Or 18K", "prixUnitaire": "250000.00",
      "quantite": 2, "stockDisponible": 9, "sousTotal": 500000 }
  ],
  "nombre_articles": 2,
  "total": 500000
}
```

### Favoris

| Méthode | Route | Rôle requis | Description |
|---|---|---|---|
| GET | `/favoris` | Client | Liste de ses favoris |
| POST | `/favoris/{idBijou}` | Client | Ajouter aux favoris (201 si créé, 200 s'il existait déjà) |
| DELETE | `/favoris/{idBijou}` | Client | Retirer des favoris |

### Gestion des commandes

| Méthode | Route | Rôle requis | Description |
|---|---|---|---|
| POST | `/commandes` | Client | Créer une commande (depuis le panier ou avec des lignes) |
| GET | `/mes-commandes` | Client | Liste de ses commandes |
| GET | `/commandes` | Tous | Liste (client : les siennes ; livreur : celles qui lui sont assignées ; personnel : toutes). Filtre `?statut=validee` |
| GET | `/commandes/{id}` | Tous | Détail d'une commande (403 si ce n'est pas la vôtre) |
| PATCH | `/commandes/{id}/annuler` | Client, Gestionnaire, Admin | Annuler une commande (remet le stock) |
| PATCH | `/commandes/{id}/statut` | Gestionnaire, Admin, Artisan | Changer le statut (`{ "statutCommande": "validee" }`) |

**POST /commandes** — deux façons de l'appeler :

1. **Depuis le panier** (recommandé) : seule l'adresse est envoyée, le panier est utilisé puis vidé.

```json
{ "adresseLivraison": "Dakar, Plateau" }
```

2. **Avec des lignes explicites** (le panier n'est pas touché) :

```json
{
  "adresseLivraison": "Dakar, Plateau",
  "lignes": [
    { "idBijou": 1, "quantite": 1 },
    { "idBijou": 3, "quantite": 2 }
  ]
}
```

Le stock est décrémenté immédiatement. Un stock insuffisant ou un panier vide renvoie **422**.

Règles de `/annuler` : un **client** ne peut annuler que sa propre commande `en_attente`. Le personnel peut aussi annuler une commande `validee`. Le stock est remis, et un paiement en attente est annulé.

Règles de `/statut` : un **artisan** ne peut mettre que `en_production` ou `prete`. Pour `en_livraison` et `livree`, passez plutôt par les livraisons.

### Gestion des paiements et factures

| Méthode | Route | Rôle requis | Description |
|---|---|---|---|
| POST | `/commandes/{id}/paiement` | Client (propriétaire) | Enregistrer un paiement (`{ "mode": "wave" }`) |
| PATCH | `/paiements/{id}/valider` | Gestionnaire, Admin | Valider le paiement (crée la facture, valide la commande) |
| PATCH | `/paiements/{id}/annuler` | Gestionnaire, Admin | Annuler un paiement en attente |
| GET | `/factures` | Gestionnaire, Admin | Liste des factures |
| GET | `/factures/{id}` | Gestionnaire, Admin | Détail d'une facture |
| GET | `/factures/{id}/telecharger` | Gestionnaire, Admin | Télécharger la facture en PDF |
| GET | `/mes-factures/{id}/telecharger` | Client (propriétaire) | Télécharger sa facture en PDF |

- Modes de paiement : `orange_money`, `wave`, `carte`, `especes`.
- Le **montant** n'est jamais envoyé : il vient de la commande.
- La commande doit être `en_attente`. Un deuxième paiement renvoie **409**, sauf si le précédent a été annulé.
- On ne peut valider ou annuler qu'un paiement `en_attente` (sinon 422).
- Les prix sont **TTC** : sur la facture, HT = TTC ÷ 1,18 et TVA = TTC − HT.

### Production (artisan)

| Méthode | Route | Rôle requis | Description |
|---|---|---|---|
| GET | `/commandes-a-preparer` | Artisan | Commandes `validee` et `en_production` |
| PATCH | `/commandes/{id}/produire` | Artisan | Passer la commande en `en_production` |
| PATCH | `/commandes/{id}/prete` | Artisan | Passer en `prete` (notifie gestionnaires et admins) |

### Gestion des livraisons

| Méthode | Route | Rôle requis | Description |
|---|---|---|---|
| POST | `/commandes/{id}/livraison` | Gestionnaire, Admin | Affecter un livreur à une commande prête |
| GET | `/livraisons` | Gestionnaire, Admin | Liste des livraisons |
| GET | `/livraisons/{id}` | Gestionnaire, Admin | Détail d'une livraison |
| GET | `/mes-livraisons` | Livreur | Ses livraisons `en_attente` et `en_cours` |
| PATCH | `/livraisons/{id}/statut` | Livreur (assigné) | Changer le statut (`{ "statutLivraison": "en_cours" }`) |

**POST /commandes/{id}/livraison**

```json
{ "idLivreur": 4, "adresseLivraison": "Dakar, Plateau", "dateLivraison": "2026-10-20" }
```

- `idLivreur` obligatoire : doit être un utilisateur **livreur actif**.
- `adresseLivraison` est facultative : à défaut, l'adresse de la commande est utilisée.
- La commande doit être `prete`. Elle passe alors à `en_livraison`, et le livreur et le client sont notifiés.
- Un livreur ne peut modifier **que ses livraisons** (403 sinon).
- Quand la livraison passe à `livree`, la commande passe à `livree` et le client est notifié.

### Notifications

| Méthode | Route | Rôle requis | Description |
|---|---|---|---|
| GET | `/notifications` | Tous | Ses notifications (paginées) |
| PATCH | `/notifications/{id}/lu` | Tous | Marquer une notification comme lue |
| PATCH | `/notifications/tout-lu` | Tous | Tout marquer comme lu |

### Statistiques et rapports

| Méthode | Route | Rôle requis | Description |
|---|---|---|---|
| GET | `/statistiques` | Gestionnaire, Admin | Indicateurs globaux (commandes, chiffre d'affaires, ventes par jour sur 30 jours, alertes de stock) |
| GET | `/rapports/journalier` | Gestionnaire, Admin | Rapport du jour |
| GET | `/rapports/hebdomadaire` | Gestionnaire, Admin | Rapport de la semaine |
| GET | `/rapports/mensuel` | Gestionnaire, Admin | Rapport du mois |

Un autre type de rapport renvoie **400**. Le chiffre d'affaires ne compte que les commandes vendues (`validee` et au-delà), pas `en_attente` ni `annulee`.

### Administration des utilisateurs

| Méthode | Route | Rôle requis | Description |
|---|---|---|---|
| GET | `/utilisateurs` | Admin | Liste des utilisateurs |
| POST | `/utilisateurs` | Admin | Créer un utilisateur (avec son rôle) |
| GET | `/utilisateurs/{id}` | Admin | Détail d'un utilisateur |
| PUT/PATCH | `/utilisateurs/{id}` | Admin | Modifier (`motDePasse` vide = inchangé) |
| DELETE | `/utilisateurs/{id}` | Admin | Supprimer (409 s'il est lié à des commandes : désactivez-le) |
| PATCH | `/utilisateurs/{id}/toggle-actif` | Admin | Activer / désactiver (révoque ses tokens) |

**POST /utilisateurs**

```json
{
  "prenom": "Ousmane",
  "nom": "Ba",
  "email": "ousmane@etoile-or.sn",
  "telephone": "777777777",
  "adresse": "Dakar",
  "role": "livreur",
  "motDePasse": "motdepasse123"
}
```

Un admin ne peut ni supprimer ni désactiver son propre compte (422).

---

## Cycle de vie d'une commande

| Objet | Statuts |
|---|---|
| Commande | `en_attente` → `validee` → `en_production` → `prete` → `en_livraison` → `livree`, ou `annulee` |
| Paiement | `en_attente`, `valide`, `annule` |
| Livraison | `en_attente` → `en_cours` → `livree` (ou `echouee`, puis `en_cours` pour retenter) |

Transitions autorisées pour une commande (toute autre renvoie **422**) :

| De | Vers |
|---|---|
| `en_attente` | `validee`, `annulee` |
| `validee` | `en_production`, `prete`, `annulee` |
| `en_production` | `prete` |
| `prete` | `en_livraison` (via la création de la livraison) |
| `en_livraison` | `livree` (via le statut de livraison) |

Qui fait quoi : le **client** passe la commande et paie → le **gestionnaire** valide le paiement → l'**artisan** produit puis marque la commande prête → le **gestionnaire** affecte un **livreur** → le **livreur** livre.

---

## Factures PDF et notifications

L'application utilise DomPDF (`barryvdh/laravel-dompdf`) pour les factures, et une table `notifications` pour informer les utilisateurs dans l'application.

- **Validation d'un paiement** : la facture PDF est générée (numéro `FAC-AAAAMMJJ-xxxxx`) et le client est notifié.
- **Nouvelle commande** : les gestionnaires et administrateurs sont notifiés.
- **Commande prête** : les gestionnaires et administrateurs sont notifiés pour affecter un livreur.
- **Livraison créée, livrée ou échouée** : le client (et le livreur à l'affectation) sont notifiés.

Pour voir un PDF dans Postman : requête `GET /api/mes-factures/1/telecharger` (en client) puis bouton **Send and Download**.

---

## Tester avec Postman

### Environnement

Créez un environnement **Bijouterie** avec ces variables :

| Variable | Valeur |
|---|---|
| `base_url` | `http://127.0.0.1:8000/api` |
| `token_client` | *(rempli automatiquement)* |
| `token_gestionnaire` | *(rempli automatiquement)* |
| `token_artisan` | *(rempli automatiquement)* |
| `token_livreur` | *(rempli automatiquement)* |
| `token_admin` | *(rempli automatiquement)* |

### En-têtes à ajouter sur toute la collection

| Header | Valeur |
|---|---|
| `Accept` | `application/json` |
| `Content-Type` | `application/json` |

Sans `Accept: application/json`, une erreur peut revenir en HTML au lieu de JSON.

### Authentification

Onglet **Authorization** de la requête (ou du dossier) : type **Bearer Token**, valeur `{{token_client}}`, `{{token_gestionnaire}}`, etc. selon le rôle testé.

Astuce : créez un dossier par rôle et réglez le Bearer Token sur le dossier, les requêtes l'héritent.

### Enregistrer le token automatiquement

Dans l'onglet **Tests** (ou **Scripts → Post-response**) de chaque requête `POST /login` :

```javascript
const r = pm.response.json();
pm.environment.set("token_" + r.utilisateur.role, r.token);
```

Une seule requête de login suffit : elle remplit la bonne variable selon le rôle du compte.

### Codes d'erreur

| Code | Signification |
|---|---|
| 401 | Token absent, invalide ou révoqué (ou identifiants incorrects au login) |
| 403 | Rôle insuffisant, ou ressource d'un autre utilisateur |
| 404 | Ressource introuvable |
| 409 | Conflit (paiement déjà enregistré, suppression impossible…) |
| 422 | Données invalides ou transition interdite. Les erreurs de validation sont dans l'objet `errors` |
| 429 | Trop de tentatives sur `/login` ou `/register` (10 par minute) |

Pagination : `?page=2`. Taille par page : bijoux 12, commandes 15, mes commandes 10, livraisons et factures 20, notifications 20.

### Scénario complet à rejouer

Sur une base fraîche (`migrate:fresh --seed`). Les numéros supposent que la commande d'exemple n°1 existe déjà.

| # | Qui | Requête | Résultat attendu |
|---|---|---|---|
| 1 | tous | `POST /login` pour les 5 comptes | 200 + token (variables remplies) |
| 2 | client | `GET /bijoux` | 3 bijoux |
| 3 | client | `POST /panier` `{ "idBijou": 1, "quantite": 2 }` | 201, total 500 000 |
| 4 | client | `PATCH /panier/1` `{ "quantite": 1 }` | total 250 000 |
| 5 | client | `POST /commandes` `{ "adresseLivraison": "Dakar, Plateau" }` | 201, commande n°2 `en_attente`, panier vidé |
| 6 | client | `GET /panier` | `lignes` vide |
| 7 | client | `POST /commandes/2/paiement` `{ "mode": "wave" }` | 201, paiement n°1 `en_attente`, montant 250 000 |
| 8 | gestionnaire | `PATCH /paiements/1/valider` | 200, paiement `valide`, facture créée |
| 9 | client | `GET /mes-commandes` | commande n°2 `validee` avec sa facture |
| 10 | client | `GET /mes-factures/1/telecharger` | PDF (HT 211 864 / TVA 38 136 / TTC 250 000) |
| 11 | artisan | `GET /commandes-a-preparer` | commande n°2 |
| 12 | artisan | `PATCH /commandes/2/produire` | `en_production` |
| 13 | artisan | `PATCH /commandes/2/prete` | `prete` |
| 14 | gestionnaire | `POST /commandes/2/livraison` `{ "idLivreur": 4 }` | 201, commande `en_livraison` |
| 15 | livreur | `GET /mes-livraisons` | la livraison n°1 |
| 16 | livreur | `PATCH /livraisons/1/statut` `{ "statutLivraison": "en_cours" }` | 200 |
| 17 | livreur | `PATCH /livraisons/1/statut` `{ "statutLivraison": "livree" }` | 200, commande `livree` |
| 18 | client | `GET /notifications` | paiement confirmé, en livraison, livrée |
| 19 | client | `PATCH /notifications/tout-lu` | 200 |
| 20 | gestionnaire | `GET /statistiques` et `GET /rapports/mensuel` | chiffre d'affaires de 250 000 |

**Scénario d'annulation**

1. Client : `POST /panier` `{ "idBijou": 3, "quantite": 2 }`, puis `POST /commandes` (commande n°3).
2. Vérifiez que le stock du bijou n°3 est passé de 25 à 23 (`GET /bijoux/3`).
3. Client : `PATCH /commandes/3/annuler` → statut `annulee`.
4. `GET /bijoux/3` : le stock est revenu à 25.

### Cas d'erreur à tester

Chacun doit renvoyer l'erreur indiquée : c'est le meilleur moyen de vérifier que les protections fonctionnent.

| Test | Attendu |
|---|---|
| Appeler `GET /bijoux` sans token | 401 |
| `POST /register` avec un mot de passe de 5 caractères | 422 |
| `POST /register` sans `motDePasse_confirmation` | 422 |
| `POST /login` avec un mauvais mot de passe | 401 |
| `POST /login` 11 fois en moins d'une minute | 429 |
| Client : `POST /bijoux` | 403 |
| Client : `GET /commandes/{id d'une commande d'un autre client}` | 403 |
| Client : `POST /commandes/{commande d'un autre}/paiement` | 403 |
| Client : `POST /panier` avec une quantité supérieure au stock | 422 |
| Client : `POST /commandes` avec un panier vide | 422 |
| Client : payer deux fois la même commande | 409 |
| Gestionnaire : `PATCH /paiements/1/valider` deux fois | 422 |
| Artisan : `PATCH /commandes/2/prete` alors que la commande est `en_attente` | 422 |
| Artisan : `PATCH /commandes/2/statut` avec `livree` | 403 |
| Gestionnaire : `POST /commandes/{id}/livraison` avec `idLivreur` = 3 (un client) | 422 |
| Gestionnaire : livraison sur une commande qui n'est pas `prete` | 422 |
| Livreur : modifier la livraison d'un autre livreur | 403 |
| Livreur : passer une livraison de `en_attente` directement à `livree` | 422 |
| Gestionnaire : `DELETE /bijoux/1` (bijou déjà commandé) | 409 |
| Admin : `PATCH /utilisateurs/1/toggle-actif` (son propre compte) | 422 |
| Admin : désactiver un client, puis réutiliser son ancien token | 401 |
| Gestionnaire : `GET /rapports/annuel` | 400 |

---

## Structure de la base de données

| Table | Description |
|---|---|
| `users` | Utilisateurs (client, gestionnaire, artisan, livreur ou admin) |
| `categories` | Catégories de bijoux (Or, Argent, Pierres précieuses…) |
| `bijoux` | Catalogue des bijoux (prix, stock, images, étiquettes) |
| `paniers` | Panier du client (1 ligne par bijou, avec la quantité) |
| `favoris` | Bijoux favoris des clients |
| `commandes` | Commandes (statut, montant total, adresse de livraison) |
| `ligne_commandes` | Lignes de commande (bijou, quantité, prix unitaire, sous-total) |
| `paiements` | Paiements (1 par commande maximum) |
| `factures` | Factures (HT, TVA, TTC, chemin du PDF), 1 par commande |
| `livraisons` | Livraisons (livreur, adresse, statut), 1 par commande |
| `notifications` | Notifications des utilisateurs |
| `personal_access_tokens` | Tokens Sanctum |

---

## Technologies utilisées

- **Backend** : Laravel
- **Authentification** : Laravel Sanctum (tokens)
- **Base de données** : PostgreSQL
- **Génération de PDF** : barryvdh/laravel-dompdf
- **Notifications** : table `notifications` (dans l'application)
- **Tests** : PHPUnit (intégré, aucun test métier écrit pour l'instant)

---

##  Configuration GitHub

### 1. Configurer Git (une seule fois sur votre machine)

```bash
git config --global user.name  "Votre Nom"
git config --global user.email "votre-email@exemple.com"   # le même email que sur GitHub
git config --global init.defaultBranch main
```

### 2. Vérifier ce qui sera envoyé

Le fichier `.gitignore` du projet exclut déjà `.env`, `vendor/`, les `*.log` et les factures PDF (`storage/app/public`). Ajoutez aussi les bases SQLite locales en ajoutant cette ligne à la fin du `.gitignore` :

```
/database/*.sqlite*
```

Ne mettez **jamais** sur GitHub : `.env` (mot de passe de base de données, `APP_KEY`), `vendor/`, `laravel.log`, `database.sqlite`.

### 3. Créer le dépôt sur GitHub

1. Sur github.com : **New repository**.
2. Nom : `gestion_Commande-Livraison_Bijouterie-`. Choisissez **Private** si le projet n'est pas encore à rendre.
3. Ne cochez **ni** README, **ni** .gitignore, **ni** licence (le projet a déjà les siens).
4. Cliquez sur **Create repository** et copiez l'URL du dépôt.

### 4. Premier envoi (push)

À la racine du projet :

```bash
git init
git add .
git status                # vérifiez que .env et vendor/ n'apparaissent PAS dans la liste
git commit -m "feat: première version de l'API bijouterie"
git branch -M backend
git remote add originhttps://github.com/thiamaminata185-sys/gestion_Commande-Livraison_Bijouterie-.git
git push -u origin backend
```

Si `git status` montre `.env`, arrêtez-vous : ajoutez `.env` au `.gitignore`, puis lancez `git rm --cached .env` avant de commiter.

Si `.env` a déjà été envoyé sur GitHub : supprimer le fichier ne suffit pas, il reste dans l'historique. Changez immédiatement le mot de passe PostgreSQL et régénérez la clé avec `php artisan key:generate`.

### 5. Authentification

GitHub n'accepte plus le mot de passe de votre compte pour `git push`. Deux solutions :

- **HTTPS + jeton** : GitHub → *Settings* → *Developer settings* → *Personal access tokens* → créez un jeton avec la permission `repo`. Collez-le à la place du mot de passe quand Git le demande.
- **SSH** (plus pratique ensuite) :

```bash
ssh-keygen -t ed25519 -C "votre-email@exemple.com"
cat ~/.ssh/id_ed25519.pub        # copiez ce texte dans GitHub → Settings → SSH and GPG keys
git remote set-url origin https://github.com/thiamaminata185-sys/gestion_Commande-Livraison_Bijouterie-.git
```

### 6. Travailler avec des branches

```bash
git checkout -b backend        
# ... vous modifiez le code ...
git add .
git commit -m "feat: ajout du panier"
git push -u origin feature/panier
```

Puis sur GitHub : **Compare & pull request**, puis **Merge**. Ensuite, mettez votre copie locale à jour :

```bash
git checkout main
git pull
```

Convention de messages de commit conseillée :

| Préfixe | Usage |
|---|---|
| `feat:` | nouvelle fonctionnalité |
| `fix:` | correction de bug |
| `docs:` | documentation (README…) |
| `refactor:` | réorganisation du code sans changer le comportement |

### 7. Donner accès à votre enseignant

Si le dépôt est privé : sur GitHub, ouvrez le dépôt → *Settings* → *Collaborators* → *Add people*, puis saisissez son nom d'utilisateur GitHub ou son email.

---

## Commandes utiles

```bash
# Lancer les migrations + seeders (efface la base)
php artisan migrate:fresh --seed

# Créer la table du panier si vous venez de mettre à jour le code
php artisan migrate

# Vider le cache des routes et de la configuration
php artisan route:clear
php artisan config:clear

# Afficher toutes les routes de l'API
php artisan route:list --path=api

# Lancer les tests
php artisan test
```

---

## Dépannage

| Symptôme | Cause probable |
|---|---|
| `could not find driver` | extension `pdo_pgsql` non activée dans `php.ini` |
| `SQLSTATE ... base de données n'existe pas` | créez la base `bijouterie_etoile_or` dans PostgreSQL |
| 500 sur le téléchargement d'une facture | lancez `composer install` (le package `barryvdh/laravel-dompdf` doit être présent) |
| Modifier / supprimer un bijou ne fait rien | vérifiez dans `route:list` que l'URL est bien `bijoux/{bijou}` |
| Toutes les requêtes en 401 | token mal collé : Bearer Token, sans guillemets ni espace en trop |
| Les routes ne changent pas après modification | `php artisan route:clear` puis `php artisan config:clear` |
| Les anciens identifiants ne correspondent plus | refaites `php artisan migrate:fresh --seed` |

---

## Sécurité

- Ne partagez jamais votre fichier `.env` (mot de passe de base de données, `APP_KEY`). Il est dans `.gitignore`.
- Changez les mots de passe des comptes de test avant toute mise en ligne.
- Mettez `APP_DEBUG=false` en production.

---

© 2026 - Bijouterie Étoile d'Or
