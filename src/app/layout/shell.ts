import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { interval } from 'rxjs';
import { ROLE_LABEL } from '../core/labels';
import { AuthService } from '../core/services/auth.service';
import { CatalogueService } from '../core/services/catalogue.service';
import { NotificationService } from '../core/services/notification.service';
import { PanierService } from '../core/services/panier.service';

interface Lien { path: string; label: string; }

/** Cadre commun des pages connectées : barre de navigation selon le rôle + contenu. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="topbar">
      <div class="topbar-inner">
        <a class="brand" [routerLink]="auth.homeRoute()"><span>Étoile d'Or</span></a>

        <button class="burger" (click)="menuOuvert.set(!menuOuvert())" aria-label="Menu">☰</button>

        <nav class="nav" [class.open]="menuOuvert()" (click)="menuOuvert.set(false)">
          @for (l of liens(); track l.path) {
            <a [routerLink]="l.path" routerLinkActive="active">{{ l.label }}</a>
          }
        </nav>

        <div class="topbar-actions">
          @if (auth.role() === 'client') {
            <a class="icon-btn" routerLink="/panier" title="Mon panier">
              🛒 @if (panier.nombre() > 0) { <span class="dot">{{ panier.nombre() }}</span> }
            </a>
          }
          <a class="icon-btn" routerLink="/notifications" title="Notifications">
            🔔 @if (notifs.nonLues() > 0) { <span class="dot">{{ notifs.nonLues() }}</span> }
          </a>
          <a class="user-chip" routerLink="/profil" title="Mon profil">
            <strong>{{ auth.user()?.prenom }}</strong>
            <small>{{ roleLabel() }}</small>
          </a>
          <button class="btn btn-ghost" (click)="deconnexion()">Déconnexion</button>
        </div>
      </div>
    </header>

    <main class="container"><router-outlet /></main>
  `,
})
export class ShellComponent implements OnInit {
  auth = inject(AuthService);
  panier = inject(PanierService);
  notifs = inject(NotificationService);
  private catalogue = inject(CatalogueService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  menuOuvert = signal(false);

  roleLabel = computed(() => {
    const r = this.auth.role();
    return r ? ROLE_LABEL[r] : '';
  });

  liens = computed<Lien[]>(() => {
    switch (this.auth.role()) {
      case 'client':
        return [
          { path: '/catalogue', label: 'Catalogue' },
          { path: '/favoris', label: 'Favoris' },
          { path: '/mes-commandes', label: 'Mes commandes' },
        ];
      case 'gestionnaire':
      case 'admin': {
        const l: Lien[] = [
          { path: '/gestion/tableau-de-bord', label: 'Tableau de bord' },
          { path: '/gestion/commandes', label: 'Commandes' },
          { path: '/gestion/bijoux', label: 'Bijoux' },
          { path: '/gestion/categories', label: 'Catégories' },
          { path: '/gestion/factures', label: 'Factures' },
          { path: '/gestion/livraisons', label: 'Livraisons' },
        ];
        if (this.auth.role() === 'admin') l.push({ path: '/admin/utilisateurs', label: 'Utilisateurs' });
        return l;
      }
      case 'artisan':
        return [
          { path: '/artisan', label: 'À préparer' },
          { path: '/catalogue', label: 'Catalogue' },
        ];
      case 'livreur':
        return [{ path: '/livraisons', label: 'Mes livraisons' }];
      default:
        return [];
    }
  });

  ngOnInit() {
    this.notifs.charger();
    if (this.auth.role() === 'client') {
      this.panier.charger();
      this.catalogue.chargerFavoris();
    }
    interval(60_000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.notifs.charger());
  }

  deconnexion() {
    this.notifs.vider();
    this.panier.reinitialiser();
    this.auth.logout();
  }
}
