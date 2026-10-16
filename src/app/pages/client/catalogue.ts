import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Bijou, Categorie } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { CatalogueService } from '../../core/services/catalogue.service';
import { PanierService } from '../../core/services/panier.service';
import { ToastService } from '../../core/services/toast.service';
import { errorMessage } from '../../core/utils';
import { BijouImageComponent, FcfaPipe, PaginationComponent } from '../../shared/shared';

@Component({
  selector: 'app-catalogue',
  imports: [FormsModule, RouterLink, BijouImageComponent, PaginationComponent, FcfaPipe],
  template: `
    <h1>Notre collection</h1>

    <form class="filters card" (ngSubmit)="charger(1)">
      <input name="search" placeholder="Rechercher un bijou…" [(ngModel)]="search" />
      <select name="categorie" [(ngModel)]="idCategorie">
        <option [ngValue]="''">Toutes les catégories</option>
        @for (c of categories(); track c.idCategorie) {
          <option [ngValue]="c.idCategorie">{{ c.nomCategorie }}</option>
        }
      </select>
      <input name="prixMin" type="number" min="0" placeholder="Prix min" [(ngModel)]="prixMin" />
      <input name="prixMax" type="number" min="0" placeholder="Prix max" [(ngModel)]="prixMax" />
      <button class="btn btn-gold">Filtrer</button>
      <button type="button" class="btn btn-ghost" (click)="reinitialiser()">Réinitialiser</button>
    </form>

    @if (chargement()) {
      <p class="muted">Chargement…</p>
    } @else if (items().length === 0) {
      <div class="card empty">Aucun bijou ne correspond à votre recherche.</div>
    } @else {
      <p class="muted">{{ total() }} bijou(x)</p>
      <div class="grid-cards">
        @for (b of items(); track b.idBijou) {
          <article class="product card">
            <a class="product-img" [routerLink]="['/bijoux', b.idBijou]">
              <app-bijou-image [src]="b.image" [alt]="b.nomBijou" />
              @if (b.quantiteStock === 0) { <span class="ribbon ko">Épuisé</span> }
              @else if (b.quantiteStock < 5) { <span class="ribbon warn">Plus que {{ b.quantiteStock }}</span> }
            </a>
            <div class="product-body">
              <small class="muted">{{ b.categorie?.nomCategorie }}</small>
              <h3><a [routerLink]="['/bijoux', b.idBijou]">{{ b.nomBijou }}</a></h3>
              <div class="price">{{ b.prix | fcfa }}</div>
              @if (estClient()) {
                <div class="row">
                  <button class="btn btn-gold grow" [disabled]="b.quantiteStock === 0" (click)="ajouter(b)">
                    Ajouter au panier
                  </button>
                  <button class="btn btn-ghost heart" [class.on]="estFavori(b)" (click)="basculerFavori(b)" title="Favori">
                    {{ estFavori(b) ? '♥' : '♡' }}
                  </button>
                </div>
              }
            </div>
          </article>
        }
      </div>
      <app-pagination [page]="page()" [last]="last()" (changed)="charger($event)" />
    }
  `,
})
export class CatalogueComponent implements OnInit {
  private catalogue = inject(CatalogueService);
  private panier = inject(PanierService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  items = signal<Bijou[]>([]);
  categories = signal<Categorie[]>([]);
  page = signal(1);
  last = signal(1);
  total = signal(0);
  chargement = signal(true);
  estClient = computed(() => this.auth.role() === 'client');

  search = '';
  idCategorie: number | '' = '';
  prixMin: number | null = null;
  prixMax: number | null = null;

  ngOnInit() {
    this.catalogue.categories().subscribe((c) => this.categories.set(c));
    this.charger(1);
  }

  charger(page: number) {
    this.chargement.set(true);
    this.catalogue
      .bijoux({
        search: this.search,
        idCategorie: this.idCategorie,
        prixMin: this.prixMin ?? '',
        prixMax: this.prixMax ?? '',
        page,
      })
      .subscribe({
        next: (r) => {
          this.items.set(r.data);
          this.page.set(r.current_page);
          this.last.set(r.last_page);
          this.total.set(r.total);
          this.chargement.set(false);
        },
        error: (e) => {
          this.toast.error(errorMessage(e));
          this.chargement.set(false);
        },
      });
  }

  reinitialiser() {
    this.search = '';
    this.idCategorie = '';
    this.prixMin = null;
    this.prixMax = null;
    this.charger(1);
  }

  estFavori(b: Bijou) {
    return this.catalogue.favoriIds().has(b.idBijou);
  }

  basculerFavori(b: Bijou) {
    const action = this.estFavori(b) ? this.catalogue.retirerFavori(b.idBijou) : this.catalogue.ajouterFavori(b.idBijou);
    action.subscribe({ error: (e) => this.toast.error(errorMessage(e)) });
  }

  ajouter(b: Bijou) {
    this.panier.ajouter(b.idBijou, 1).subscribe({
      next: () => this.toast.success(`« ${b.nomBijou} » ajouté au panier`),
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }
}
