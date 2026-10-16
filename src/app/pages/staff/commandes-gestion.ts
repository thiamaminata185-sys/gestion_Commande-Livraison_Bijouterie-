import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { STATUT_COMMANDE } from '../../core/labels';
import { Commande } from '../../core/models';
import { CommandeService } from '../../core/services/commande.service';
import { ToastService } from '../../core/services/toast.service';
import { errorMessage } from '../../core/utils';
import { BadgeComponent, FcfaPipe, PaginationComponent } from '../../shared/shared';

@Component({
  selector: 'app-commandes-gestion',
  imports: [FormsModule, RouterLink, DatePipe, BadgeComponent, FcfaPipe, PaginationComponent],
  template: `
    <div class="page-head">
      <h1>Commandes</h1>
      <select name="statut" [(ngModel)]="statut" (ngModelChange)="charger(1)">
        <option value="">Tous les statuts</option>
        @for (s of statuts; track s[0]) { <option [value]="s[0]">{{ s[1] }}</option> }
      </select>
    </div>

    @if (chargement()) {
      <p class="muted">Chargement…</p>
    } @else if (commandes().length === 0) {
      <div class="card empty">Aucune commande.</div>
    } @else {
      <div class="card table-wrap">
        <table class="table">
          <thead><tr><th>N°</th><th>Date</th><th>Client</th><th>Total</th><th>Paiement</th><th>Statut</th><th></th></tr></thead>
          <tbody>
            @for (c of commandes(); track c.idCommande) {
              <tr>
                <td><strong>#{{ c.idCommande }}</strong></td>
                <td>{{ c.dateCommande | date: 'dd/MM/yyyy HH:mm' }}</td>
                <td>{{ c.client?.prenom }} {{ c.client?.nom }}</td>
                <td>{{ c.montantTotal | fcfa }}</td>
                <td>
                  @if (c.paiement) { <app-badge [statut]="c.paiement.statut" type="paiement" /> }
                  @else { <span class="muted">—</span> }
                </td>
                <td><app-badge [statut]="c.statutCommande" /></td>
                <td><a class="btn btn-ghost" [routerLink]="['/commandes', c.idCommande]">Gérer</a></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <app-pagination [page]="page()" [last]="last()" (changed)="charger($event)" />
    }
  `,
})
export class CommandesGestionComponent implements OnInit {
  private service = inject(CommandeService);
  private toast = inject(ToastService);

  commandes = signal<Commande[]>([]);
  page = signal(1);
  last = signal(1);
  chargement = signal(true);
  statut = '';
  statuts = Object.entries(STATUT_COMMANDE);

  ngOnInit() {
    this.charger(1);
  }

  charger(p: number) {
    this.chargement.set(true);
    this.service.liste(p, this.statut).subscribe({
      next: (r) => {
        this.commandes.set(r.data);
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
