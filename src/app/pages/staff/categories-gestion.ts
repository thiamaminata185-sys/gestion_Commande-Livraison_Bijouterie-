import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Categorie } from '../../core/models';
import { CatalogueService } from '../../core/services/catalogue.service';
import { ToastService } from '../../core/services/toast.service';
import { errorMessage } from '../../core/utils';
import { ModalComponent } from '../../shared/modal';

@Component({
  selector: 'app-categories-gestion',
  imports: [FormsModule,ModalComponent],
  template: `

      <div class="page-head">
      <h1>Catégories</h1>
      <button class="btn btn-gold" (click)="nouvelle()">+ Nouvelle catégorie</button>
    </div>

    @if (formulaireOuvert()) {
      <app-modal [titre]="idEdition() ? 'Modifier la catégorie' : 'Nouvelle catégorie'" [petit]="true" (fermer)="annulerEdition()">
        <form (ngSubmit)="enregistrer()">
          <label>Nom<input name="nom" placeholder="Ex. Or" [(ngModel)]="nom" required /></label>
          <label>Description<textarea name="desc" rows="3" [(ngModel)]="description"></textarea></label>
          <div class="row">
            <button class="btn btn-gold grow" [disabled]="envoi()">{{ envoi() ? 'Enregistrement…' : 'Enregistrer' }}</button>
            <button type="button" class="btn btn-ghost" (click)="annulerEdition()">Annuler</button>
          </div>
        </form>
      </app-modal>
    }

    <div class="card table-wrap">
      <table class="table">
        <thead><tr><th>Nom</th><th>Description</th><th>Bijoux</th><th></th></tr></thead>
        <tbody>
          @for (c of categories(); track c.idCategorie) {
            <tr>
              <td><strong>{{ c.nomCategorie }}</strong></td>
              <td>{{ c.descriptionCategorie }}</td>
              <td>{{ c.bijoux_count ?? 0 }}</td>
              <td class="actions">
                <button class="btn btn-ghost" (click)="modifier(c)">Modifier</button>
                <button class="btn btn-danger-ghost" (click)="supprimer(c)">Supprimer</button>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class CategoriesGestionComponent implements OnInit {
  private catalogue = inject(CatalogueService);
  private toast = inject(ToastService);

  categories = signal<Categorie[]>([]);
  idEdition = signal<number | null>(null);
  envoi = signal(false);
  nom = '';
  description = '';
  formulaireOuvert = signal(false);

  ngOnInit() {
    this.charger();
  }

  charger() {
    this.catalogue.categories().subscribe({
      next: (c) => this.categories.set(c),
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }

   nouvelle() {
    this.idEdition.set(null);
    this.nom = '';
    this.description = '';
    this.formulaireOuvert.set(true);
  }

  modifier(c: Categorie) {
    this.idEdition.set(c.idCategorie);
    this.nom = c.nomCategorie;
    this.description = c.descriptionCategorie ?? '';
    this.formulaireOuvert.set(true);
  }

  /** Ferme la fenêtre et vide le formulaire. */
  annulerEdition() {
    this.formulaireOuvert.set(false);
    this.idEdition.set(null);
    this.nom = '';
    this.description = '';
  }

  enregistrer() {
    const donnees = { nomCategorie: this.nom, descriptionCategorie: this.description || null };
    const id = this.idEdition();
    this.envoi.set(true);
    const requete = id ? this.catalogue.modifierCategorie(id, donnees) : this.catalogue.creerCategorie(donnees);
    requete.subscribe({
      next: () => {
        this.toast.success(id ? 'Catégorie modifiée' : 'Catégorie créée');
        this.annulerEdition();
        this.envoi.set(false);
        this.charger();
      },
      error: (e) => {
        this.toast.error(errorMessage(e));
        this.envoi.set(false);
      },
    });
  }

  supprimer(c: Categorie) {
    if (!confirm(`Supprimer la catégorie « ${c.nomCategorie} » ?`)) return;
    this.catalogue.supprimerCategorie(c.idCategorie).subscribe({
      next: () => {
        this.toast.success('Catégorie supprimée');
        this.charger();
      },
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }
}
