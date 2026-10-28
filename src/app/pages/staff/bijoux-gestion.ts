import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import { Bijou, Categorie } from '../../core/models';
import { CatalogueService } from '../../core/services/catalogue.service';
import { ToastService } from '../../core/services/toast.service';
import { errorMessage } from '../../core/utils';
import { BijouImageComponent, FcfaPipe, PaginationComponent } from '../../shared/shared';
import { ModalComponent } from '../../shared/modal';
import { IconComponent } from '../../shared/icon';

const TAILLE_MAX = 2 * 1024 * 1024; // 2 Mo par photo, comme côté API

interface FormBijou {
  nomBijou: string;
  idCategorie: number | null;
  type: string;
  prix: number | null;
  prixDorigine: number | null;
  quantiteStock: number | null;
  descriptionBijou: string;
  etiquette: string; // séparées par des virgules
}

const vide = (): FormBijou => ({
  nomBijou: '', idCategorie: null, type: '', prix: null, prixDorigine: null, quantiteStock: null,
  descriptionBijou: '', etiquette: '',
});

@Component({
  selector: 'app-bijoux-gestion',
  imports: [FormsModule, BijouImageComponent, FcfaPipe, PaginationComponent , ModalComponent, IconComponent],
  template: `
    <div class="page-head">
      <h1>Gestion des bijoux</h1>
      <button class="btn btn-gold has-icon" (click)="nouveau()"><app-icon nom="plus" [taille]="16" /> Nouveau bijou</button>
    </div>

    @if (formulaireOuvert()) {
        <app-modal [titre]="idEdition() ? 'Modifier le bijou' : 'Nouveau bijou'" (fermer)="formulaireOuvert.set(false)">
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
          <label>Étiquettes (séparées par des virgules)<input name="etiq" [(ngModel)]="f.etiquette" placeholder="nouveau, or" /></label>

          <!-- Photos -->
          <div class="field-title">Photos du bijou</div>
          <div class="upload-zone" [class.drag]="survol()"
               (dragover)="glisser($event)" (dragleave)="survol.set(false)" (drop)="deposer($event)">
            <div class="upload-icon">📷</div>
            <p>{{ envoiPhotos() ? 'Envoi des photos…' : 'Glissez vos photos ici' }}</p>
            <label class="btn btn-ghost" [class.disabled]="envoiPhotos()">
              Choisir des fichiers
              <input type="file" accept="image/png,image/jpeg,image/webp" multiple hidden
                     [disabled]="envoiPhotos()" (change)="choisir($event)" />
            </label>
            <small class="muted">JPG, PNG ou WebP · 2 Mo maximum par photo · la première photo est la photo principale</small>
          </div>

          @if (photos().length > 0) {
            <div class="photos">
              @for (p of photos(); track p; let i = $index) {
                <div class="photo" [class.main]="i === 0">
                  <app-bijou-image [src]="p" alt="Photo du bijou" />
                  @if (i === 0) { <span class="photo-tag">Principale</span> }
                  <div class="photo-actions">
                    @if (i > 0) { <button type="button" title="Définir comme photo principale" (click)="definirPrincipale(i)">★</button> }
                    <button type="button" title="Retirer cette photo" (click)="retirerPhoto(i)">✕</button>
                  </div>
                </div>
              }
            </div>
          }

          <div class="row url-row">
            <input name="urlPhoto" placeholder="…ou collez l'adresse d'une image (https://…)" [(ngModel)]="urlSaisie" />
            <button type="button" class="btn btn-ghost" (click)="ajouterUrl()">Ajouter</button>
          </div>

          <div class="row">
            <button class="btn btn-gold" [disabled]="envoi() || envoiPhotos()">{{ envoi() ? 'Enregistrement…' : 'Enregistrer' }}</button>
            <button type="button" class="btn btn-ghost" (click)="formulaireOuvert.set(false)">Annuler</button>
          </div>
        </form>
      </app-modal>
    }
        @if (stockBijou(); as sb) {
      <app-modal [titre]="'Stock : ' + sb.nomBijou" [petit]="true" (fermer)="stockBijou.set(null)">
        <p class="muted">Stock actuel : <strong>{{ sb.quantiteStock }}</strong></p>
        <form (ngSubmit)="enregistrerStock()">
          <label>Nouvelle quantité en stock
            <div class="stepper big">
              <button type="button" class="btn btn-ghost" (click)="ajusterStock(-1)">−</button>
              <input name="stock" type="number" min="0" [(ngModel)]="nouveauStock" required />
              <button type="button" class="btn btn-ghost" (click)="ajusterStock(1)">+</button>
            </div>
          </label>
          <div class="row quick">
            <button type="button" class="btn btn-ghost" (click)="ajusterStock(5)">+5</button>
            <button type="button" class="btn btn-ghost" (click)="ajusterStock(10)">+10</button>
            <button type="button" class="btn btn-ghost" (click)="nouveauStock = 0">Mettre à 0</button>
          </div>
          <div class="row">
            <button class="btn btn-gold grow" [disabled]="envoiStock()">{{ envoiStock() ? 'Enregistrement…' : 'Enregistrer le stock' }}</button>
            <button type="button" class="btn btn-ghost" (click)="stockBijou.set(null)">Annuler</button>
          </div>
        </form>
      </app-modal>
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
                <button class="btn-icon" title="Mettre à jour le stock" aria-label="Stock" (click)="ouvrirStock(b)"><app-icon nom="package" /></button>
                <button class="btn-icon" title="Modifier" aria-label="Modifier" (click)="modifier(b)"><app-icon nom="edit" /></button>
                <button class="btn-icon danger" title="Supprimer" aria-label="Supprimer" (click)="supprimer(b)"><app-icon nom="trash" /></button>
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

  /** Adresses des photos du bijou : la première est la photo principale. */
  photos = signal<string[]>([]);
  envoiPhotos = signal(false);
  survol = signal(false);
  urlSaisie = '';

  /** Fenêtre « Stock » : bijou concerné, quantité saisie, envoi en cours. */
  stockBijou = signal<Bijou | null>(null);
  envoiStock = signal(false);
  nouveauStock = 0;

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
    this.photos.set([]);
    this.urlSaisie = '';
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
      descriptionBijou: b.descriptionBijou ?? '',
      etiquette: (b.etiquette ?? []).join(', '),
    };
    this.photos.set([b.image, ...(b.images ?? [])].filter((x): x is string => !!x));
    this.urlSaisie = '';
    this.idEdition.set(b.idBijou);
    this.formulaireOuvert.set(true);
  }

    // ---- Mise à jour rapide du stock ----
  ouvrirStock(b: Bijou) {
    this.stockBijou.set(b);
    this.nouveauStock = b.quantiteStock;
  }

  ajusterStock(delta: number) {
    this.nouveauStock = Math.max(0, (Number(this.nouveauStock) || 0) + delta);
  }

  enregistrerStock() {
    const b = this.stockBijou();
    if (!b) return;
    const quantite = Math.max(0, Math.floor(Number(this.nouveauStock) || 0));
    this.envoiStock.set(true);
    // L'API accepte une modification partielle : on n'envoie que la quantité.
    this.catalogue.modifierBijou(b.idBijou, { quantiteStock: quantite }).subscribe({
      next: () => {
        this.toast.success(`Stock de « ${b.nomBijou} » : ${quantite}`);
        this.stockBijou.set(null);
        this.envoiStock.set(false);
        this.charger(this.page());
      },
      error: (e) => {
        this.toast.error(errorMessage(e));
        this.envoiStock.set(false);
      },
    });
  }

  // ---- Photos ----
  choisir(event: Event) {
    const champ = event.target as HTMLInputElement;
    const fichiers = Array.from(champ.files ?? []);
    champ.value = '';
    this.televerser(fichiers);
  }

  glisser(event: DragEvent) {
    event.preventDefault();
    this.survol.set(true);
  }

  deposer(event: DragEvent) {
    event.preventDefault();
    this.survol.set(false);
    this.televerser(Array.from(event.dataTransfer?.files ?? []));
  }

  private televerser(fichiers: File[]) {
    const valides = fichiers.filter((f) => {
      if (!f.type.startsWith('image/')) {
        this.toast.error(`« ${f.name} » n'est pas une image`);
        return false;
      }
      if (f.size > TAILLE_MAX) {
        this.toast.error(`« ${f.name} » dépasse 2 Mo`);
        return false;
      }
      return true;
    });
    if (valides.length === 0) return;

    this.envoiPhotos.set(true);
    forkJoin(
      valides.map((f) =>
        this.catalogue.televerserImage(f).pipe(
          catchError((e) => {
            this.toast.error(`« ${f.name} » : ${errorMessage(e)}`);
            return of(null);
          }),
        ),
      ),
    ).subscribe((resultats) => {
      const urls = resultats.filter((r): r is { url: string } => r !== null).map((r) => r.url);
      this.photos.update((p) => [...p, ...urls]);
      this.envoiPhotos.set(false);
      if (urls.length > 0) this.toast.success(urls.length > 1 ? `${urls.length} photos ajoutées` : 'Photo ajoutée');
    });
  }

  ajouterUrl() {
    const url = this.urlSaisie.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      this.toast.error("L'adresse doit commencer par http:// ou https://");
      return;
    }
    this.photos.update((p) => [...p, url]);
    this.urlSaisie = '';
  }

  definirPrincipale(index: number) {
    this.photos.update((p) => {
      const copie = [...p];
      const [choisie] = copie.splice(index, 1);
      return [choisie, ...copie];
    });
  }

  retirerPhoto(index: number) {
    this.photos.update((p) => p.filter((_, i) => i !== index));
  }

  // ---- Enregistrement ----
  private liste(texte: string): string[] {
    return texte.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
  }

  enregistrer() {
    const photos = this.photos();
    const donnees = {
      nomBijou: this.f.nomBijou,
      idCategorie: this.f.idCategorie,
      type: this.f.type || null,
      prix: this.f.prix,
      prixDorigine: this.f.prixDorigine,
      quantiteStock: this.f.quantiteStock,
      image: photos[0] ?? null,
      images: photos.slice(1),
      descriptionBijou: this.f.descriptionBijou || null,
      etiquette: this.liste(this.f.etiquette),
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
