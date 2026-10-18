import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Bijou } from '../core/models';
import { AuthService } from '../core/services/auth.service';
import { CatalogueService } from '../core/services/catalogue.service';
import { PanierService } from '../core/services/panier.service';
import { ToastService } from '../core/services/toast.service';
import { errorMessage } from '../core/utils';
import { BijouImageComponent, FcfaPipe } from './shared';

/** Carte d'un bijou (catalogue, accueil) : photo, prix, ajout au panier et favori. */
@Component({
  selector: 'app-product-card',
  imports: [RouterLink, BijouImageComponent, FcfaPipe],
  template: `
    @let b = bijou();
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
            <button class="btn btn-gold grow" [disabled]="b.quantiteStock === 0" (click)="ajouter()">Ajouter au panier</button>
            <button class="btn btn-ghost heart" [class.on]="estFavori()" (click)="basculerFavori()" title="Favori">
              {{ estFavori() ? '♥' : '♡' }}
            </button>
          </div>
        }
      </div>
    </article>
  `,
})
export class ProductCardComponent {
  bijou = input.required<Bijou>();

  private auth = inject(AuthService);
  private catalogue = inject(CatalogueService);
  private panier = inject(PanierService);
  private toast = inject(ToastService);

  estClient = computed(() => this.auth.role() === 'client');
  estFavori = computed(() => this.catalogue.favoriIds().has(this.bijou().idBijou));

  ajouter() {
    const b = this.bijou();
    this.panier.ajouter(b.idBijou, 1).subscribe({
      next: () => this.toast.success(`« ${b.nomBijou} » ajouté au panier`),
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }

  basculerFavori() {
    const id = this.bijou().idBijou;
    const action = this.estFavori() ? this.catalogue.retirerFavori(id) : this.catalogue.ajouterFavori(id);
    action.subscribe({ error: (e) => this.toast.error(errorMessage(e)) });
  }
}
