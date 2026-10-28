import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Facture } from '../../core/models';
import { CommandeService } from '../../core/services/commande.service';
import { ToastService } from '../../core/services/toast.service';
import { errorMessage, telecharger } from '../../core/utils';
import { FcfaPipe, PaginationComponent } from '../../shared/shared';
import { IconComponent } from '../../shared/icon';

@Component({
  selector: 'app-factures',
  imports: [DatePipe, RouterLink, FcfaPipe, PaginationComponent,IconComponent],
  template: `
    <h1>Factures</h1>
    @if (factures().length === 0 && !chargement()) {
      <div class="card empty">Aucune facture pour le moment. Elles sont créées à la validation d'un paiement.</div>
    } @else {
      <div class="card table-wrap">
        <table class="table">
          <thead><tr><th>Numéro</th><th>Commande</th><th>Client</th><th>Date</th><th>HT</th><th>TVA</th><th>TTC</th><th></th></tr></thead>
          <tbody>
            @for (f of factures(); track f.id) {
              <tr>
                <td><strong>{{ f.numero }}</strong></td>
                <td><a [routerLink]="['/commandes', f.idCommande]">#{{ f.idCommande }}</a></td>
                <td>{{ f.commande?.client?.prenom }} {{ f.commande?.client?.nom }}</td>
                <td>{{ f.date | date: 'dd/MM/yyyy' }}</td>
                <td>{{ f.montantHT | fcfa }}</td>
                <td>{{ f.tva | fcfa }}</td>
                <td><strong>{{ f.montantTTC | fcfa }}</strong></td>
                <td><button class="btn-icon info" title="Télécharger le PDF" aria-label="Télécharger" (click)="telecharger(f)"><app-icon nom="download" /></button></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <app-pagination [page]="page()" [last]="last()" (changed)="charger($event)" />
    }
  `,
})
export class FacturesComponent implements OnInit {
  private service = inject(CommandeService);
  private toast = inject(ToastService);

  factures = signal<Facture[]>([]);
  page = signal(1);
  last = signal(1);
  chargement = signal(true);

  ngOnInit() {
    this.charger(1);
  }

  charger(p: number) {
    this.service.factures(p).subscribe({
      next: (r) => {
        this.factures.set(r.data);
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

  telecharger(f: Facture) {
    this.service.telechargerFacture(f.id, false).subscribe({
      next: (blob) => telecharger(blob, `${f.numero}.pdf`),
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }
}
