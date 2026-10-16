import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Commande } from '../../core/models';
import { CommandeService } from '../../core/services/commande.service';
import { ToastService } from '../../core/services/toast.service';
import { errorMessage } from '../../core/utils';
import { BadgeComponent, FcfaPipe, PaginationComponent } from '../../shared/shared';

@Component({
  selector: 'app-mes-commandes',
  imports: [RouterLink, DatePipe, BadgeComponent, FcfaPipe, PaginationComponent],
  template: `
    <h1>Mes commandes</h1>
    @if (chargement()) {
      <p class="muted">Chargement…</p>
    } @else if (commandes().length === 0) {
      <div class="card empty">
        Vous n'avez pas encore passé de commande.<br />
        <a class="btn btn-gold" routerLink="/catalogue">Découvrir la collection</a>
      </div>
    } @else {
      <div class="card table-wrap">
        <table class="table">
          <thead><tr><th>N°</th><th>Date</th><th>Articles</th><th>Total</th><th>Statut</th><th></th></tr></thead>
          <tbody>
            @for (c of commandes(); track c.idCommande) {
              <tr>
                <td><strong>#{{ c.idCommande }}</strong></td>
                <td>{{ c.dateCommande | date: 'dd/MM/yyyy HH:mm' }}</td>
                <td>{{ resume(c) }}</td>
                <td>{{ c.montantTotal | fcfa }}</td>
                <td><app-badge [statut]="c.statutCommande" /></td>
                <td><a class="btn btn-ghost" [routerLink]="['/commandes', c.idCommande]">Voir</a></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <app-pagination [page]="page()" [last]="last()" (changed)="charger($event)" />
    }
  `,
})
export class MesCommandesComponent implements OnInit {
  private service = inject(CommandeService);
  private toast = inject(ToastService);

  commandes = signal<Commande[]>([]);
  page = signal(1);
  last = signal(1);
  chargement = signal(true);

  ngOnInit() {
    this.charger(1);
  }

  charger(p: number) {
    this.chargement.set(true);
    this.service.mesCommandes(p).subscribe({
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

  resume(c: Commande): string {
    const n = (c.lignes ?? []).reduce((s, l) => s + l.quantite, 0);
    return n ? `${n} article(s)` : '—';
  }
}
