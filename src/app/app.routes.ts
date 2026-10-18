import { Routes } from '@angular/router';
import { authGuard, guestGuard, homeGuard, roleGuard } from './core/guards/guards';

const personnel = roleGuard('gestionnaire', 'admin');

export const routes: Routes = [
  // ---- Pages publiques ----
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/login').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/register').then((m) => m.RegisterComponent),
  },

  // ---- Pages connectées (dans le cadre avec la barre de navigation) ----
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', canActivate: [homeGuard], children: [] },

      // Communes
      { path: 'catalogue', loadComponent: () => import('./pages/client/catalogue').then((m) => m.CatalogueComponent) },
      { path: 'bijoux/:id', loadComponent: () => import('./pages/client/bijou-detail').then((m) => m.BijouDetailComponent) },
      { path: 'commandes/:id', loadComponent: () => import('./pages/common/commande-detail').then((m) => m.CommandeDetailComponent) },
      { path: 'notifications', loadComponent: () => import('./pages/common/notifications').then((m) => m.NotificationsComponent) },
      { path: 'profil', loadComponent: () => import('./pages/common/profil').then((m) => m.ProfilComponent) },

      { path: 'a-propos', loadComponent: () => import('./pages/client/a-propos').then((m) => m.AProposComponent) },
      { path: 'contact', loadComponent: () => import('./pages/client/contact').then((m) => m.ContactComponent) },

      // Client
      { path: 'accueil', canActivate: [roleGuard('client')], loadComponent: () => import('./pages/client/accueil').then((m) => m.AccueilComponent) },
      { path: 'panier', canActivate: [roleGuard('client')], loadComponent: () => import('./pages/client/panier').then((m) => m.PanierComponent) },
      { path: 'favoris', canActivate: [roleGuard('client')], loadComponent: () => import('./pages/client/favoris').then((m) => m.FavorisComponent) },
      { path: 'mes-commandes', canActivate: [roleGuard('client')], loadComponent: () => import('./pages/client/mes-commandes').then((m) => m.MesCommandesComponent) },

      // Gestionnaire + admin
      { path: 'gestion/tableau-de-bord', canActivate: [personnel], loadComponent: () => import('./pages/staff/dashboard').then((m) => m.DashboardComponent) },
      { path: 'gestion/commandes', canActivate: [personnel], loadComponent: () => import('./pages/staff/commandes-gestion').then((m) => m.CommandesGestionComponent) },
      { path: 'gestion/bijoux', canActivate: [personnel], loadComponent: () => import('./pages/staff/bijoux-gestion').then((m) => m.BijouxGestionComponent) },
      { path: 'gestion/categories', canActivate: [personnel], loadComponent: () => import('./pages/staff/categories-gestion').then((m) => m.CategoriesGestionComponent) },
      { path: 'gestion/factures', canActivate: [personnel], loadComponent: () => import('./pages/staff/factures').then((m) => m.FacturesComponent) },
      { path: 'gestion/livraisons', canActivate: [personnel], loadComponent: () => import('./pages/staff/livraisons-gestion').then((m) => m.LivraisonsGestionComponent) },

      // Artisan, livreur, admin
      { path: 'artisan', canActivate: [roleGuard('artisan')], loadComponent: () => import('./pages/artisan/artisan').then((m) => m.ArtisanComponent) },
      { path: 'livraisons', canActivate: [roleGuard('livreur')], loadComponent: () => import('./pages/livreur/livreur').then((m) => m.LivreurComponent) },
      { path: 'admin/utilisateurs', canActivate: [roleGuard('admin')], loadComponent: () => import('./pages/admin/utilisateurs').then((m) => m.UtilisateursComponent) },
    ],
  },

  { path: '**', redirectTo: '' },
];
