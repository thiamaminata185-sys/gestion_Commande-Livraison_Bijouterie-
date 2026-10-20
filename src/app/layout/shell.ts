import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { interval } from 'rxjs';
import { ROLE_LABEL } from '../core/labels';
import { AuthService } from '../core/services/auth.service';
import { CatalogueService } from '../core/services/catalogue.service';
import { NotificationService } from '../core/services/notification.service';
import { PanierService } from '../core/services/panier.service';
import { AvatarComponent } from '../shared/shared';

interface Lien { path: string; label: string; }

/** Cadre commun des pages connectées : barre de navigation selon le rôle + contenu. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AvatarComponent],
  host: { class: 'shell' },
  template: `
    <header class="topbar">
      <div class="topbar-inner">
        <a class="brand" [routerLink]="auth.homeRoute()"> <span><img src="images/logo-horizontal-fond-sombre.svg" alt="Logo Étoile d'Or" width="100" height="50" /></span></a>

        <button class="burger" (click)="menuOuvert.set(!menuOuvert())" aria-label="Menu">☰</button>

        <nav class="nav" [class.open]="menuOuvert()" (click)="menuOuvert.set(false)">
          @for (l of liens(); track l.path) {
            <a [routerLink]="l.path" routerLinkActive="active">{{ l.label }}</a>
          }
        </nav>

        <div class="topbar-actions">
          @if (auth.role() === 'client') {
            <a class="icon-btn" routerLink="/panier" title="Mon panier">
              <svg xmlns="http://w3.org" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="8" cy="21" r="1"/>
  <circle cx="19" cy="21" r="1"/>
  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
</svg>
 @if (panier.nombre() > 0) { <span class="dot">{{ panier.nombre() }}</span> }
            </a>
          }
          <a class="icon-btn" routerLink="/notifications" title="Notifications">
            <svg xmlns="http://w3.org" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
</svg>
 @if (notifs.nonLues() > 0) { <span class="dot">{{ notifs.nonLues() }}</span> }
          </a>
          <a class="user-chip" routerLink="/profil" title="Mon profil">
            <app-avatar [image]="auth.user()?.image" [prenom]="auth.user()?.prenom ?? ''" [nom]="auth.user()?.nom ?? ''" [taille]="36" />
            <span class="user-text">
              <strong>{{ auth.user()?.prenom }}</strong>
              <small>{{ roleLabel() }}</small>
            </span>
          </a>
          <button class="btn btn-ghost" (click)="deconnexion()">Déconnexion</button>
        </div>
      </div>
    </header>

    <main class="container"><router-outlet /></main>

    @if (auth.role() === 'client') {
      <section class="promises">
        <div class="promises-inner">
          <div class="promise"><span>B</span><div><strong>Bijoux certifiés</strong><small>Or 18K et argent massif</small></div></div>
          <div class="promise"><span>L</span><div><strong>Livraison à Dakar</strong><small>Suivi de votre commande</small></div></div>
          <div class="promise"><span>P</span><div><strong>Paiement sécurisé</strong><small>Wave, Orange Money, carte</small></div></div>
          <div class="promise"><span>É</span><div><strong>Écrin offert</strong><small>Avec chaque commande</small></div></div>
        </div>
      </section>
    }

    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <div class="footer-logo"><img src="images/logo-horizontal-fond-sombre.svg" alt="Logo Étoile d'Or" width="150" height="80" /></div>
          <p>Bijouterie d'exception à Dakar. Or, argent et pierres précieuses, façonnés avec passion par nos artisans.</p>
          <div class="socials">
            <a href="#" title="Instagram" aria-label="Instagram"><svg xmlns="http://w3.org" width="24" height="24" viewBox="0 0 24 24" fill="#E4405F">
  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
</svg>
</a>
            <a href="#" title="Facebook" aria-label="Facebook"><svg xmlns="http://w3.org" width="24" height="24" viewBox="0 0 24 24" fill="#1877F2">
  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
</svg></a>
            <a href="#" title="WhatsApp" aria-label="WhatsApp"><svg xmlns="http://w3.org" width="24" height="24" viewBox="0 0 24 24" fill="#25D366">
  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.713-1.455L0 24zm6.59-4.846c1.66.986 3.288 1.488 4.743 1.49 5.341 0 9.681-4.321 9.684-9.649.002-2.58-1.001-5.005-2.825-6.83-1.824-1.826-4.247-2.831-6.828-2.832-5.343 0-9.685 4.321-9.688 9.65-.001 2.136.56 4.225 1.624 6.06l-.992 3.626 3.71-.973zm11.233-5.265c-.328-.164-1.94-.957-2.242-1.067-.302-.11-.522-.164-.742.164-.22.328-.85.106-1.041.328-.192.221-.384.246-.712.082-.328-.164-1.386-.51-2.64-1.627-.975-.87-1.633-1.946-1.825-2.274-.192-.329-.02-.507.144-.671.148-.148.329-.384.493-.575.165-.192.22-.329.329-.548.11-.219.055-.411-.027-.575-.083-.164-.742-1.79-.1015-2.61-.266-.639-.544-.727-.742-.727-.193-.001-.412-.001-.631-.001-.22 0-.576.082-.878.411-.302.329-1.153 1.123-1.153 2.738 0 1.615 1.18 3.176 1.344 3.4 1.644 2.229 2.514 3.313 4.148 3.917.438.163.85.26 1.171.361.94.298 1.796.256 2.473.155.755-.112 2.316-.947 2.641-1.861.325-.914.325-1.696.228-1.861-.097-.166-.356-.264-.685-.427z"/>
</svg>
</a>
          </div>
        </div>

        <div class="footer-col">
          <h4>Navigation</h4>
          <ul>
            @for (l of liens(); track l.path) {
              <li><a [routerLink]="l.path">{{ l.label }}</a></li>
            }
            @if (auth.role() !== 'client') {
              <li><a routerLink="/a-propos">À propos</a></li>
              <li><a routerLink="/contact">Contact</a></li>
            }
            <li><a routerLink="/profil">Mon profil</a></li>
            <li><a routerLink="/notifications">Notifications</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Notre boutique</h4>
          <ul class="infos">
            <li><span><svg xmlns="http://w3.org" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
  <circle cx="12" cy="10" r="3"/>
</svg></span> Plateau, Dakar, Sénégal</li>
            <li><span><svg xmlns="http://w3.org" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
  <path d="M12 18h.01"/>
</svg>
</span> +221 77 632 10 98</li>
            <li><span><svg xmlns="http://w3.org" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect width="20" height="16" x="2" y="4" rx="2"/>
  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
</svg>
</span> bijouterieetoiledor@gmail.com</li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Horaires</h4>
          <ul class="infos">
            <li>Lundi - Vendredi : 9h - 19h</li>
            <li>Samedi : 10h - 18h</li>
            <li>Dimanche : fermé</li>
          </ul>
          <h4 class="spaced">Paiements acceptés</h4>
          <div class="pay-chips">
            <span>Wave</span><span>Orange Money</span><span>Carte</span><span>Espèces</span>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <span>© {{ annee }} Étoile d'Or. Tous droits réservés.</span>
        <span>Fait avec <b class="heart-red">♥</b> à Dakar</span>
      </div>
    </footer>
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
  annee = new Date().getFullYear();

  roleLabel = computed(() => {
    const r = this.auth.role();
    return r ? ROLE_LABEL[r] : '';
  });

  liens = computed<Lien[]>(() => {
    switch (this.auth.role()) {
      case 'client':
        return [
          { path: '/accueil', label: 'Accueil' },
          { path: '/catalogue', label: 'Catalogue' },
          { path: '/favoris', label: 'Favoris' },
          { path: '/mes-commandes', label: 'Mes commandes' },
          { path: '/a-propos', label: 'À propos' },
          { path: '/contact', label: 'Contact' },
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
