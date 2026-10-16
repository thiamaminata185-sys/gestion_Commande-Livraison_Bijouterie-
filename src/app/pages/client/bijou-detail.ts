import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Bijou } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { CatalogueService } from '../../core/services/catalogue.service';
import { PanierService } from '../../core/services/panier.service';
import { ToastService } from '../../core/services/toast.service';
import { errorMessage } from '../../core/utils';
import { BijouImageComponent, FcfaPipe } from '../../shared/shared';

@Component({
  selector: 'app-bijou-detail',
  imports: [FormsModule, RouterLink, BijouImageComponent, FcfaPipe],
  template: `
    <a routerLink="/catalogue" class="back">← Retour au catalogue</a>

    @if (bijou(); as b) {
      <div class="detail card">
        <div class="detail-gallery">
          <div class="detail-main"><app-bijou-image [src]="imageCourante()" [alt]="b.nomBijou" /></div>
          @if (galerie().length > 1) {
            <div class="thumbs">
              @for (img of galerie(); track img) {
                <button type="button" class="thumb" [class.on]="img === imageCourante()" (click)="imageCourante.set(img)">
                  <app-bijou-image [src]="img" [alt]="b.nomBijou" />
                </button>
              }
            </div>
          }
        </div>

        <div class="detail-info">
          <small class="muted">{{ b.categorie?.nomCategorie }} @if (b.type) { · {{ b.type }} }</small>
          <h1>{{ b.nomBijou }}</h1>
          <div class="price big">
            {{ b.prix | fcfa }}
            @if (aPromo()) { <s class="muted">{{ b.prixDorigine | fcfa }}</s> }
          </div>
          <p>{{ b.descriptionBijou || 'Aucune description.' }}</p>

          @if (b.etiquette?.length) {
            <div class="chips">@for (e of b.etiquette; track e) { <span class="chip static">{{ e }}</span> }</div>
          }

          <p>
            @if (b.quantiteStock === 0) { <span class="badge ko">Épuisé</span> }
            @else { <span class="badge ok">{{ b.quantiteStock }} en stock</span> }
          </p>

          @if (estClient()) {
            <div class="row">
              <input type="number" class="qty" min="1" [max]="b.quantiteStock" name="qte" [(ngModel)]="quantite" />
              <button class="btn btn-gold" [disabled]="b.quantiteStock === 0" (click)="ajouter(b)">Ajouter au panier</button>
              <button class="btn btn-ghost heart" [class.on]="estFavori()" (click)="basculerFavori(b)">
                {{ estFavori() ? '♥ Favori' : '♡ Favori' }}
              </button>
            </div>
          }
        </div>
      </div>
    } @else if (erreur()) {
      <div class="card empty">Ce bijou est introuvable.</div>
    } @else {
      <p class="muted">Chargement…</p>
    }
  `,
})
export class BijouDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private catalogue = inject(CatalogueService);
  private panier = inject(PanierService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  bijou = signal<Bijou | null>(null);
  erreur = signal(false);
  imageCourante = signal<string>('');
  quantite = 1;

  estClient = computed(() => this.auth.role() === 'client');
  galerie = computed(() => {
    const b = this.bijou();
    if (!b) return [];
    return [b.image, ...(b.images ?? [])].filter((x): x is string => !!x);
  });
  aPromo = computed(() => {
    const b = this.bijou();
    return !!b && !!b.prixDorigine && Number(b.prixDorigine) > Number(b.prix);
  });
  estFavori = computed(() => {
    const b = this.bijou();
    return !!b && this.catalogue.favoriIds().has(b.idBijou);
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.catalogue.bijou(id).subscribe({
      next: (b) => {
        this.bijou.set(b);
        this.imageCourante.set(b.image ?? '');
      },
      error: () => this.erreur.set(true),
    });
  }

  ajouter(b: Bijou) {
    this.panier.ajouter(b.idBijou, Math.max(1, Number(this.quantite) || 1)).subscribe({
      next: () => this.toast.success('Ajouté au panier'),
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }

  basculerFavori(b: Bijou) {
    const action = this.estFavori() ? this.catalogue.retirerFavori(b.idBijou) : this.catalogue.ajouterFavori(b.idBijou);
    action.subscribe({ error: (e) => this.toast.error(errorMessage(e)) });
  }
}
