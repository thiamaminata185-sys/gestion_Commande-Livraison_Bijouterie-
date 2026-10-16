import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Favori } from '../../core/models';
import { CatalogueService } from '../../core/services/catalogue.service';
import { PanierService } from '../../core/services/panier.service';
import { ToastService } from '../../core/services/toast.service';
import { errorMessage } from '../../core/utils';
import { BijouImageComponent, FcfaPipe } from '../../shared/shared';

@Component({
  selector: 'app-favoris',
  imports: [RouterLink, BijouImageComponent, FcfaPipe],
  template: `
    <h1>Mes favoris</h1>
    @if (chargement()) {
      <p class="muted">Chargement…</p>
    } @else if (favoris().length === 0) {
      <div class="card empty">
        Vous n'avez pas encore de favori.<br />
        <a class="btn btn-gold" routerLink="/catalogue">Parcourir le catalogue</a>
      </div>
    } @else {
      <div class="grid-cards">
        @for (f of favoris(); track f.idFavori) {
          <article class="product card">
            <a class="product-img" [routerLink]="['/bijoux', f.bijou.idBijou]">
              <app-bijou-image [src]="f.bijou.image" [alt]="f.bijou.nomBijou" />
            </a>
            <div class="product-body">
              <small class="muted">{{ f.bijou.categorie?.nomCategorie }}</small>
              <h3><a [routerLink]="['/bijoux', f.bijou.idBijou]">{{ f.bijou.nomBijou }}</a></h3>
              <div class="price">{{ f.bijou.prix | fcfa }}</div>
              <div class="row">
                <button class="btn btn-gold grow" [disabled]="f.bijou.quantiteStock === 0" (click)="ajouter(f)">Ajouter au panier</button>
                <button class="btn btn-ghost heart on" (click)="retirer(f)" title="Retirer des favoris">♥</button>
              </div>
            </div>
          </article>
        }
      </div>
    }
  `,
})
export class FavorisComponent implements OnInit {
  private catalogue = inject(CatalogueService);
  private panier = inject(PanierService);
  private toast = inject(ToastService);

  favoris = signal<Favori[]>([]);
  chargement = signal(true);

  ngOnInit() {
    this.catalogue.favoris().subscribe({
      next: (l) => {
        this.favoris.set(l);
        this.chargement.set(false);
      },
      error: (e) => {
        this.toast.error(errorMessage(e));
        this.chargement.set(false);
      },
    });
  }

  retirer(f: Favori) {
    this.catalogue.retirerFavori(f.idBijou).subscribe({
      next: () => this.favoris.update((l) => l.filter((x) => x.idFavori !== f.idFavori)),
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }

  ajouter(f: Favori) {
    this.panier.ajouter(f.idBijou, 1).subscribe({
      next: () => this.toast.success('Ajouté au panier'),
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }
}
