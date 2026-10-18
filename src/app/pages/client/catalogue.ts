import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Bijou, Categorie } from '../../core/models';
import { CatalogueService } from '../../core/services/catalogue.service';
import { ToastService } from '../../core/services/toast.service';
import { errorMessage } from '../../core/utils';
import { PaginationComponent } from '../../shared/shared';
import { ProductCardComponent } from '../../shared/product-card';

@Component({
  selector: 'app-catalogue',
  imports: [FormsModule, PaginationComponent, ProductCardComponent],
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
          <app-product-card [bijou]="b" />
        }
      </div>
      <app-pagination [page]="page()" [last]="last()" (changed)="charger($event)" />
    }
  `,
})
export class CatalogueComponent implements OnInit {
  private catalogue = inject(CatalogueService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);

  items = signal<Bijou[]>([]);
  categories = signal<Categorie[]>([]);
  page = signal(1);
  last = signal(1);
  total = signal(0);
  chargement = signal(true);

  search = '';
  idCategorie: number | '' = '';
  prixMin: number | null = null;
  prixMax: number | null = null;

  ngOnInit() {
    // Les liens de l'accueil peuvent pré-remplir la recherche : /catalogue?search=bague ou ?idCategorie=2
    const params = this.route.snapshot.queryParamMap;
    this.search = params.get('search') ?? '';
    const categorie = Number(params.get('idCategorie'));
    if (categorie) this.idCategorie = categorie;

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
}
