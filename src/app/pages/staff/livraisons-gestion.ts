import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Livraison } from '../../core/models';
import { CommandeService } from '../../core/services/commande.service';
import { ToastService } from '../../core/services/toast.service';
import { errorMessage } from '../../core/utils';
import { BadgeComponent, PaginationComponent } from '../../shared/shared';

@Component({
  selector: 'app-livraisons-gestion',
  imports: [DatePipe, RouterLink, BadgeComponent, PaginationComponent],
  template: `
    <h1>Livraisons</h1>
    @if (livraisons().length === 0 && !chargement()) {
      <div class="card empty">Aucune livraison. Affectez un livreur depuis une commande « prête ».</div>
    } @else {
      <div class="card table-wrap">
        <table class="table">
          <thead><tr><th>N°</th><th>Commande</th><th>Client</th><th>Livreur</th><th>Adresse</th><th>Date prévue</th><th>Statut</th></tr></thead>
          <tbody>
            @for (l of livraisons(); track l.idLivraison) {
              <tr>
                <td>#{{ l.idLivraison }}</td>
                <td><a [routerLink]="['/commandes', l.idCommande]">#{{ l.idCommande }}</a></td>
                <td>{{ l.commande?.client?.prenom }} {{ l.commande?.client?.nom }}</td>
                <td>{{ l.livreur?.prenom }} {{ l.livreur?.nom }}</td>
                <td>{{ l.adresseLivraison }}</td>
                <td>{{ l.dateLivraison | date: 'dd/MM/yyyy' }}</td>
                <td><app-badge [statut]="l.statutLivraison" type="livraison" /></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <app-pagination [page]="page()" [last]="last()" (changed)="charger($event)" />
    }
  `,
})
export class LivraisonsGestionComponent implements OnInit {
  private service = inject(CommandeService);
  private toast = inject(ToastService);

  livraisons = signal<Livraison[]>([]);
  page = signal(1);
  last = signal(1);
  chargement = signal(true);

  ngOnInit() {
    this.charger(1);
  }

  charger(p: number) {
    this.service.livraisons(p).subscribe({
      next: (r) => {
        this.livraisons.set(r.data);
        this.page.set(r.current_page);
        this.last.set(r.last_page);
        this.chargement.set(false);
      },
      error: (e) => {
        this.toast.error(errorMessage(e));
        this.chargement.set(false);
      },
    });
  }
}
