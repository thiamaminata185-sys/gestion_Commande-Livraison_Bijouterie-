import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Bijou, Categorie } from '../../core/models';
import { CatalogueService } from '../../core/services/catalogue.service';
import { ToastService } from '../../core/services/toast.service';
import { errorMessage } from '../../core/utils';
import { BijouImageComponent, FcfaPipe, PaginationComponent } from '../../shared/shared';

interface FormBijou {
  nomBijou: string;
  idCategorie: number | null;
  type: string;
  prix: number | null;
  prixDorigine: number | null;
  quantiteStock: number | null;
  image: string;
  descriptionBijou: string;
  etiquette: string; // séparées par des virgules
  images: string;    // séparées par des virgules
}

const vide = (): FormBijou => ({
  nomBijou: '', idCategorie: null, type: '', prix: null, prixDorigine: null, quantiteStock: null,
  image: '', descriptionBijou: '', etiquette: '', images: '',
});

@Component({
  selector: 'app-bijoux-gestion',
  imports: [FormsModule, BijouImageComponent, FcfaPipe, PaginationComponent],
  template: `
    <div class="page-head">
      <h1>Gestion des bijoux</h1>
      <button class="btn btn-gold" (click)="nouveau()">+ Nouveau bijou</button>
    </div>

    @if (formulaireOuvert()) {
      <div class="card">
        <h2>{{ idEdition() ? 'Modifier le bijou' : 'Nouveau bijou' }}</h2>
        <form (ngSubmit)="enregistrer()">
          <div class="grid-2">
            <label>Nom<input name="nom" [(ngModel)]="f.nomBijou" required /></label>
            <label>Catégorie
              <select name="cat" [(ngModel)]="f.idCategorie" required>
                <option [ngValue]="null">Choisir…</option>
                @for (c of categories(); track c.idCategorie) { <option [ngValue]="c.idCategorie">{{ c.nomCategorie }}</option> }
              </select>
            </label>
          </div>
          <div class="grid-4">
            <label>Type<input name="type" [(ngModel)]="f.type" placeholder="Bague, Collier…" /></label>
            <label>Prix (FCFA)<input name="prix" type="number" min="0" [(ngModel)]="f.prix" required /></label>
            <label>Prix d'origine<input name="prixO" type="number" min="0" [(ngModel)]="f.prixDorigine" /></label>
            <label>Stock<input name="stock" type="number" min="0" [(ngModel)]="f.quantiteStock" required /></label>
          </div>
          <label>Description<textarea name="desc" rows="2" [(ngModel)]="f.descriptionBijou"></textarea></label>
          <label>Image principale (URL)<input name="image" [(ngModel)]="f.image" placeholder="https://…" /></label>
          <div class="grid-2">
            <label>Autres images (URLs séparées par des virgules)<input name="images" [(ngModel)]="f.images" /></label>
            <label>Étiquettes (séparées par des virgules)<input name="etiq" [(ngModel)]="f.etiquette" placeholder="nouveau, or" /></label>
          </div>
          <div class="row">
            <button class="btn btn-gold" [disabled]="envoi()">{{ envoi() ? 'Enregistrement…' : 'Enregistrer' }}</button>
            <button type="button" class="btn btn-ghost" (click)="formulaireOuvert.set(false)">Annuler</button>
          </div>
        </form>
      </div>
    }

    <div class="card table-wrap">
      <table class="table">
        <thead><tr><th></th><th>Nom</th><th>Catégorie</th><th>Prix</th><th>Stock</th><th></th></tr></thead>
        <tbody>
          @for (b of bijoux(); track b.idBijou) {
            <tr>
              <td><div class="mini"><app-bijou-image [src]="b.image" [alt]="b.nomBijou" /></div></td>
              <td><strong>{{ b.nomBijou }}</strong><br /><small class="muted">{{ b.type }}</small></td>
              <td>{{ b.categorie?.nomCategorie }}</td>
              <td>{{ b.prix | fcfa }}</td>
              <td><span class="badge" [class]="b.quantiteStock === 0 ? 'ko' : b.quantiteStock < 5 ? 'warn' : 'ok'">{{ b.quantiteStock }}</span></td>
              <td class="actions">
                <button class="btn btn-ghost" (click)="modifier(b)">Modifier</button>
                <button class="btn btn-danger-ghost" (click)="supprimer(b)">Supprimer</button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
    <app-pagination [page]="page()" [last]="last()" (changed)="charger($event)" />
  `,
})
export class BijouxGestionComponent implements OnInit {
  private catalogue = inject(CatalogueService);
  private toast = inject(ToastService);

  bijoux = signal<Bijou[]>([]);
  categories = signal<Categorie[]>([]);
  page = signal(1);
  last = signal(1);
  formulaireOuvert = signal(false);
  idEdition = signal<number | null>(null);
  envoi = signal(false);
  f: FormBijou = vide();

  ngOnInit() {
    this.catalogue.categories().subscribe((c) => this.categories.set(c));
    this.charger(1);
  }

  charger(p: number) {
    this.catalogue.bijoux({ page: p }).subscribe({
      next: (r) => {
        this.bijoux.set(r.data);
        this.page.set(r.current_page);
        this.last.set(r.last_page);
      },
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }

  nouveau() {
    this.f = vide();
    this.idEdition.set(null);
    this.formulaireOuvert.set(true);
  }

  modifier(b: Bijou) {
    this.f = {
      nomBijou: b.nomBijou,
      idCategorie: b.idCategorie,
      type: b.type ?? '',
      prix: Number(b.prix),
      prixDorigine: b.prixDorigine ? Number(b.prixDorigine) : null,
      quantiteStock: b.quantiteStock,
      image: b.image ?? '',
      descriptionBijou: b.descriptionBijou ?? '',
      etiquette: (b.etiquette ?? []).join(', '),
      images: (b.images ?? []).join(', '),
    };
    this.idEdition.set(b.idBijou);
    this.formulaireOuvert.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private liste(texte: string): string[] {
    return texte.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
  }

  enregistrer() {
    const donnees = {
      nomBijou: this.f.nomBijou,
      idCategorie: this.f.idCategorie,
      type: this.f.type || null,
      prix: this.f.prix,
      prixDorigine: this.f.prixDorigine,
      quantiteStock: this.f.quantiteStock,
      image: this.f.image || null,
      descriptionBijou: this.f.descriptionBijou || null,
      etiquette: this.liste(this.f.etiquette),
      images: this.liste(this.f.images),
    };
    const id = this.idEdition();
    this.envoi.set(true);
    const requete = id ? this.catalogue.modifierBijou(id, donnees) : this.catalogue.creerBijou(donnees);
    requete.subscribe({
      next: () => {
        this.toast.success(id ? 'Bijou modifié' : 'Bijou créé');
        this.formulaireOuvert.set(false);
        this.envoi.set(false);
        this.charger(this.page());
      },
      error: (e) => {
        this.toast.error(errorMessage(e));
        this.envoi.set(false);
      },
    });
  }

  supprimer(b: Bijou) {
    if (!confirm(`Supprimer « ${b.nomBijou} » ?`)) return;
    this.catalogue.supprimerBijou(b.idBijou).subscribe({
      next: () => {
        this.toast.success('Bijou supprimé');
        this.charger(this.page());
      },
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }
}
