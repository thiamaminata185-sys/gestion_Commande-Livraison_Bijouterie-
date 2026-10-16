import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Categorie } from '../../core/models';
import { CatalogueService } from '../../core/services/catalogue.service';
import { ToastService } from '../../core/services/toast.service';
import { errorMessage } from '../../core/utils';

@Component({
  selector: 'app-categories-gestion',
  imports: [FormsModule],
  template: `
    <h1>Catégories</h1>

    <div class="card">
      <h2>{{ idEdition() ? 'Modifier la catégorie' : 'Nouvelle catégorie' }}</h2>
      <form class="row wrap" (ngSubmit)="enregistrer()">
        <input name="nom" placeholder="Nom (ex. Or)" [(ngModel)]="nom" required />
        <input name="desc" class="grow" placeholder="Description" [(ngModel)]="description" />
        <button class="btn btn-gold" [disabled]="envoi()">{{ idEdition() ? 'Enregistrer' : 'Ajouter' }}</button>
        @if (idEdition()) { <button type="button" class="btn btn-ghost" (click)="annulerEdition()">Annuler</button> }
      </form>
    </div>

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

  ngOnInit() {
    this.charger();
  }

  charger() {
    this.catalogue.categories().subscribe({
      next: (c) => this.categories.set(c),
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }

  modifier(c: Categorie) {
    this.idEdition.set(c.idCategorie);
    this.nom = c.nomCategorie;
    this.description = c.descriptionCategorie ?? '';
  }

  annulerEdition() {
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
