# 💎 Bijouterie Étoile d'Or - Frontend Angular

Application web (Angular 21) qui consomme l'API Laravel **bijouterie-api**. Elle propose une interface adaptée à chacun des cinq rôles : le **client** parcourt le catalogue, remplit son panier, commande, paie et suit sa livraison ; le **gestionnaire**, l'**artisan**, le **livreur** et l'**administrateur** pilotent chacun leur partie de l'activité.

---

## 📦 Prérequis

- Node.js **20.19+** ou **22.12+** (vérifiez avec `node -v`)
- npm (installé avec Node.js)
- L'API **bijouterie-api** lancée sur `http://127.0.0.1:8000` (voir son README)

---

## 🚀 Installation

### 1. Récupérer le projet

```bash
git clone https://github.com/thiamaminata185-sys/gestion_Commande-Livraison_Bijouterie-.git
cd gestion_Commande-Livraison_Bijouterie-
```

> 

### 2. Installer les dépendances

```bash
npm install
```

### 3. Vérifier l'adresse de l'API

Ouvrez `src/environments/environment.ts` :

```ts
export const environment = {
  apiUrl: 'http://127.0.0.1:8000/api',
};
```

Modifiez `apiUrl` si votre API tourne sur une autre adresse ou un autre port.

### 4. Mettre l'API à jour (une seule fois)

Le frontend s'appuie sur les corrections de l'API (panier, annulation de commande, téléchargement de facture par le client) **et** sur une nouvelle route `GET /api/livreurs`, qui permet au gestionnaire de choisir un livreur. Le dossier `api-modifications/` fourni avec ce projet contient les deux fichiers à copier dans l'API .

### 5. Lancer l'application

Dans un premier terminal, l'API :

```bash
cd bijouterie-api
php artisan serve
```

Dans un second terminal, le frontend :

```bash
cd angular-bijouterie
npm start
```

L'application est accessible sur http://localhost:4200.

---

## 🔐 Comptes de test

Mot de passe de tous les comptes : `password`

| Email | Rôle | Page d'accueil après connexion |
|---|---|---|
| client@test.sn | Client | Catalogue |
| gestion@etoile-or.sn | Gestionnaire | Tableau de bord |
| artisan@etoile-or.sn | Artisan | Commandes à préparer |
| livreur@etoile-or.sn | Livreur | Mes livraisons |
| admin@etoile-or.sn | Administrateur | Tableau de bord |

La page de connexion propose aussi des boutons « Comptes de démonstration » qui remplissent le formulaire pour vous.

---

## Pages de l'application

### Pages publiques

| Route | Page |
|---|---|
| `/login` | Connexion |
| `/register` | Création d'un compte client |

### Client

| Route | Page | Fonctions |
|---|---|---|
| `/catalogue` | Catalogue | Recherche, filtre par catégorie et par prix, pagination, ajout au panier, favoris |
| `/bijoux/:id` | Détail d'un bijou | Galerie, prix, stock, quantité, favori |
| `/panier` | Panier | Changer les quantités, retirer un produit, vider, passer la commande |
| `/favoris` | Favoris | Liste, retrait, ajout au panier |
| `/mes-commandes` | Mes commandes | Historique paginé |
| `/commandes/:id` | Détail d'une commande | Frise d'avancement, paiement (Wave, Orange Money, carte, espèces), annulation, facture PDF, suivi de livraison |

### Gestionnaire et administrateur

| Route | Page | Fonctions |
|---|---|---|
| `/gestion/tableau-de-bord` | Tableau de bord | Indicateurs, graphique des ventes, alertes de stock, rapports du jour, de la semaine et du mois |
| `/gestion/commandes` | Commandes | Liste filtrable par statut |
| `/commandes/:id` | Détail d'une commande | Valider ou refuser un paiement, annuler, affecter un livreur |
| `/gestion/bijoux` | Bijoux | Créer, modifier, supprimer |
| `/gestion/categories` | Catégories | Créer, modifier, supprimer |
| `/gestion/factures` | Factures | Liste et téléchargement PDF |
| `/gestion/livraisons` | Livraisons | Suivi de toutes les livraisons |
| `/admin/utilisateurs` | Utilisateurs *(admin)* | Créer, modifier, activer / désactiver, supprimer |

### Artisan

| Route | Page | Fonctions |
|---|---|---|
| `/artisan` | Commandes à préparer | Lancer la production, marquer une commande prête |
| `/catalogue` | Catalogue | Consultation |

### Livreur

| Route | Page | Fonctions |
|---|---|---|
| `/livraisons` | Mes livraisons | Démarrer, marquer livrée ou échouée, appeler le client |

### Pour tous les rôles

| Route | Page |
|---|---|
| `/notifications` | Notifications (cloche en haut, rafraîchie chaque minute) |
| `/profil` | Modifier son profil |

Chaque rôle ne voit dans le menu que les pages qui le concernent. Si vous tapez l'adresse d'une page interdite, l'application vous renvoie vers votre page d'accueil.

---

## 🔄 Parcours complet à tester

1. **Client** : ouvrez le catalogue, ajoutez un bijou au panier, saisissez l'adresse, cliquez sur « Passer la commande ».
2. **Client** : sur la page de la commande, choisissez un mode de paiement et cliquez sur « Payer ».
3. **Gestionnaire** : ouvrez la commande et cliquez sur « Valider le paiement » (la facture est créée).
4. **Artisan** : dans « À préparer », cliquez sur « Lancer la production » puis « Marquer prête ».
5. **Gestionnaire** : ouvrez la commande (statut « Prête »), choisissez un livreur et cliquez sur « Affecter ».
6. **Livreur** : dans « Mes livraisons », cliquez sur « Démarrer la livraison » puis « Marquer comme livrée ».
7. **Client** : la commande est « Livrée », la facture PDF est téléchargeable et les notifications sont arrivées.

---

## Structure du projet

```
src/
├── environments/environment.ts      Adresse de l'API
├── styles.css                       Thème (noir et or) et composants visuels
└── app/
    ├── app.config.ts                Configuration (HttpClient, routeur, langue française)
    ├── app.routes.ts                Routes protégées par rôle (chargement à la demande)
    ├── core/
    │   ├── models.ts                Types TypeScript des données de l'API
    │   ├── labels.ts                Libellés des statuts, rôles et modes de paiement
    │   ├── utils.ts                 Messages d'erreur, téléchargement de fichiers
    │   ├── guards/                  Protection des pages (connecté ? bon rôle ?)
    │   ├── interceptors/            Ajoute le token Bearer, gère l'erreur 401
    │   └── services/                Auth, catalogue, panier, commandes, admin, notifications, toasts
    ├── layout/shell.ts              Barre de navigation selon le rôle
    ├── shared/shared.ts             Pastilles de statut, pagination, image, toasts, format FCFA
    └── pages/
        ├── auth/                    Connexion, inscription
        ├── client/                  Catalogue, détail, panier, favoris, mes commandes
        ├── common/                  Détail d'une commande, notifications, profil
        ├── staff/                   Tableau de bord, commandes, bijoux, catégories, factures, livraisons
        ├── artisan/                 Commandes à préparer
        ├── livreur/                 Mes livraisons
        └── admin/                   Utilisateurs
```

---

## Technologies utilisées

- **Framework** : Angular 21 (composants autonomes, signaux, nouvelle syntaxe `@if` / `@for`)
- **Langage** : TypeScript (mode strict)
- **HTTP** : `HttpClient` avec un intercepteur pour le token Sanctum
- **Formulaires** : `FormsModule` (`ngModel`)
- **Style** : CSS pur, aucune bibliothèque d'interface
- **Dépendances externes** : aucune en plus d'Angular et RxJS

---

## Commandes utiles

```bash
# Lancer le serveur de développement (http://localhost:4200)
npm start

# Compiler pour la production (résultat dans dist/)
npm run build

# Recompiler automatiquement à chaque modification
npm run watch
```

---

## Dépannage

| Symptôme | Cause probable |
|---|---|
| « Impossible de joindre l'API » | L'API n'est pas lancée (`php artisan serve`) ou `apiUrl` est mauvais dans `environment.ts` |
| Erreur CORS dans la console du navigateur | Dans l'API : `php artisan config:publish cors`, puis dans `config/cors.php` mettez `'allowed_origins' => ['http://localhost:4200']` et lancez `php artisan config:clear` |
| Renvoyé sur la page de connexion tout le temps | Le token a expiré, a été révoqué ou le compte a été désactivé : reconnectez-vous |
| Le menu « Livreur » n'affiche aucun livreur à affecter | La route `GET /api/livreurs` n'est pas dans votre API : copiez les fichiers de `api-modifications/` |
| Les boutons panier, annulation ou facture client donnent 404 | Votre API n'a pas les corrections « v2 » (panier, `/annuler`, `/mes-factures`) |
| Les bijoux n'ont pas de photo (icône ) | L'API ne stocke que le texte du champ `image` : saisissez une **URL complète** (`https://…`) dans la gestion des bijoux |
| `ng : commande introuvable` | Utilisez `npm start` (qui appelle le Angular CLI installé dans le projet) après `npm install` |
| Erreur « Node.js version … » | Installez Node.js 20.19+ ou 22.12+ |

### Limites connues

- Quand un livreur déclare une livraison « échouée », elle disparaît de sa liste, car l'API `GET /mes-livraisons` ne renvoie que les livraisons `en_attente` et `en_cours`. Le gestionnaire la voit toujours dans « Livraisons ».
- Les images de bijoux se saisissent par URL : il n'y a pas de téléversement de fichier dans l'API.

---

## Configuration GitHub

```bash
git config --global user.name  "Votre Nom"
git config --global user.email "votre-email@exemple.com"

git init
git add .
git status                 # node_modules/, dist/ et .angular/ ne doivent PAS apparaître
git commit -m "feat: première version du frontend"
git branch -M main
git remote add origin https://github.com/thiamaminata185-sys/gestion_Commande-Livraison_Bijouterie-.git
git push -u origin fronted
```

Le fichier `.gitignore` fourni exclut déjà `node_modules/`, `dist/` et le cache `.angular/`. Pour les jetons d'accès, les clés SSH et les branches, voir la section « Configuration GitHub » du README de l'API.

---

© 2026 - Bijouterie Étoile d'Or
