import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Bijou, Categorie } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { CatalogueService } from '../../core/services/catalogue.service';
import { ProductCardComponent } from '../../shared/product-card';
import { HeroSliderComponent } from './hero-slider';

interface Avis { texte: string; nom: string; ville: string; }

@Component({
  selector: 'app-accueil',
  imports: [RouterLink, HeroSliderComponent, ProductCardComponent],
  template: `
    <app-hero-slider />

    <p class="welcome">Bonjour <strong>{{ auth.user()?.prenom }}</strong>, bienvenue chez Étoile d'Or. </p>

    <!-- Catégories -->
    <section class="section">
      <div class="section-head">
        <span class="eyebrow-dark">Nos collections</span>
        <h2>Explorez nos catégories</h2>
        <p class="muted">De l'or éclatant aux pierres les plus rares, trouvez la pièce qui vous ressemble.</p>
      </div>
      <div class="cat-grid">
        @for (c of categories(); track c.idCategorie; let i = $index) {
          <a class="cat-card" [class]="'cat-card cat-' + (i % 4)" routerLink="/catalogue" [queryParams]="{ idCategorie: c.idCategorie }">
            <span class="cat-icon">{{ icone(c) }}</span>
            <h3>{{ c.nomCategorie }}</h3>
            <small>{{ c.descriptionCategorie || 'Découvrir la collection' }}</small>
            <span class="cat-link">Voir les bijoux →</span>
          </a>
        }
      </div>
    </section>

    <!-- Sélection -->
    @if (vedettes().length > 0) {
      <section class="section">
        <div class="section-head">
          <span class="eyebrow-dark">Sélection</span>
          <h2>Nos bijoux à découvrir</h2>
          <p class="muted">Une sélection de pièces de notre atelier, prêtes à être offertes… ou à vous faire plaisir.</p>
        </div>
        <div class="grid-cards">
          @for (b of vedettes(); track b.idBijou) {
            <app-product-card [bijou]="b" />
          }
        </div>
        <p class="center"><a class="btn btn-gold" routerLink="/catalogue">Voir tout le catalogue</a></p>
      </section>
    }

    <!-- Savoir-faire -->
    <section class="section">
      <div class="section-head">
        <span class="eyebrow-dark">Pourquoi Étoile d'Or</span>
        <h2>L'excellence, pièce après pièce</h2>
      </div>
      <div class="features">
        <div class="feature card">
          <span class="feature-icon">A</span>
          <h3>Un artisanat d'exception</h3>
          <p class="muted">Chaque bijou est dessiné, fondu et serti à la main par nos artisans, avec des gestes transmis de génération en génération.</p>
        </div>
        <div class="feature card">
          <span class="feature-icon">M</span>
          <h3>Des matières nobles</h3>
          <p class="muted">Or 18 carats, argent massif, perles et pierres sélectionnées pour leur pureté, avec certificat d'authenticité.</p>
        </div>
        <div class="feature card">
          <span class="feature-icon">S</span>
          <h3>Un service sur mesure</h3>
          <p class="muted">Gravure, retouche, création personnalisée, livraison à Dakar : nous vous accompagnons de la commande à la remise de votre bijou.</p>
        </div>
      </div>
    </section>

    <!-- Chiffres -->
    <section class="stats-band">
      <div><strong>15+</strong><span>années d'expérience</span></div>
      <div><strong>2 000+</strong><span>bijoux créés</span></div>
      <div><strong>100 %</strong><span>or et argent certifiés</span></div>
      <div><strong>4,9 / 5</strong><span>satisfaction clients</span></div>
    </section>

    <!-- Témoignages -->
    <section class="section">
      <div class="section-head">
        <span class="eyebrow-dark">Témoignages</span>
        <h2>Ils nous ont fait confiance</h2>
      </div>
      <div class="avis-grid">
        @for (a of avis; track a.nom) {
          <figure class="avis card">
            <div class="stars">★★★★★</div>
            <blockquote>« {{ a.texte }} »</blockquote>
            <figcaption><strong>{{ a.nom }}</strong><small class="muted"> · {{ a.ville }}</small></figcaption>
          </figure>
        }
      </div>
    </section>

    <!-- Appel à l'action -->
    <section class="cta-band">
      <div>
        <h2>Un projet de bijou sur mesure ?</h2>
        <p>Racontez-nous votre idée : nos artisans la transforment en une pièce unique.</p>
      </div>
      <div class="slide-actions">
        <a class="btn btn-dark" routerLink="/contact">Nous contacter</a>
        <a class="btn btn-outline-dark" routerLink="/a-propos">Découvrir l'atelier</a>
      </div>
    </section>
  `,
})
export class AccueilComponent implements OnInit {
  auth = inject(AuthService);
  private catalogue = inject(CatalogueService);

  categories = signal<Categorie[]>([]);
  vedettes = signal<Bijou[]>([]);

  /** Avis d'exemple : à remplacer par de vrais témoignages. */
  avis: Avis[] = [
    { texte: "Une bague magnifique, livrée dans un écrin superbe. Le service est irréprochable.", nom: 'Aminata D.', ville: 'Dakar' },
    { texte: "J'ai offert un collier de perles à ma mère : elle ne l'a plus quitté. Merci à toute l'équipe !", nom: 'Moussa S.', ville: 'Thiès' },
    { texte: "La création sur mesure a dépassé mes attentes. Un vrai travail d'artiste.", nom: 'Khady N.', ville: 'Saint-Louis' },
  ];

  ngOnInit() {
    this.catalogue.categories().subscribe({ next: (c) => this.categories.set(c), error: () => undefined });
    this.catalogue.bijoux({ page: 1 }).subscribe({ next: (r) => this.vedettes.set(r.data.slice(0, 8)), error: () => undefined });
  }

  icone(c: Categorie): string {
    const n = c.nomCategorie.toLowerCase();
    if (n === 'or' || n.startsWith('or ')) return 'O';
    if (n.includes('argent')) return 'A';
    if (n.includes('pierre')) return 'P';
    if (n.includes('perle')) return 'P';
    if (n.includes('bague')) return 'B';
    if (n.includes('montre')) return 'M';
    return '✨';
  }
}
