import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Rapport, Statistiques } from '../../core/models';
import { AdminService } from '../../core/services/admin.service';
import { ToastService } from '../../core/services/toast.service';
import { errorMessage, toNumber } from '../../core/utils';
import { BadgeComponent, FcfaPipe } from '../../shared/shared';

type Periode = 'journalier' | 'hebdomadaire' | 'mensuel';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DatePipe, BadgeComponent, FcfaPipe],
  template: `
    <h1>Tableau de bord</h1>

    @if (stats(); as s) {
      <div class="kpis">
        <div class="kpi card"><small>Chiffre d'affaires</small><strong>{{ s.chiffre_affaires | fcfa }}</strong></div>
        <div class="kpi card"><small>Commandes</small><strong>{{ s.commandes_total }}</strong></div>
        <div class="kpi card"><small>En cours</small><strong>{{ s.commandes_en_cours }}</strong></div>
        <div class="kpi card"><small>Clients</small><strong>{{ s.clients_total }}</strong></div>
        <div class="kpi card"><small>Bijoux au catalogue</small><strong>{{ s.bijoux_total }}</strong></div>
        <div class="kpi card"><small>Pièces en stock</small><strong>{{ s.stock_total }}</strong></div>
      </div>

      <div class="two-cols">
        <div class="card">
          <h2>Ventes des derniers jours</h2>
          @if (barres().length === 0) {
            <p class="muted">Aucune vente enregistrée.</p>
          } @else {
            <div class="bars">
              @for (b of barres(); track b.date) {
                <div class="bar-col" [title]="b.date + ' : ' + b.total + ' commande(s)'">
                  <span class="bar-value">{{ b.montant | fcfa }}</span>
                  <div class="bar" [style.height.%]="b.hauteur"></div>
                  <span class="bar-label">{{ b.jour }}</span>
                </div>
              }
            </div>
          }
        </div>

        <div class="card">
          <h2>Alertes de stock</h2>
          @if (s.alertes_stock.length === 0) {
            <p class="muted">Tous les stocks sont suffisants. 👍</p>
          } @else {
            <ul class="plain">
              @for (a of s.alertes_stock; track a.idBijou) {
                <li class="line">
                  <span>{{ a.nomBijou }}</span>
                  <span class="badge" [class]="a.quantiteStock === 0 ? 'ko' : 'warn'">{{ a.quantiteStock }} restant(s)</span>
                </li>
              }
            </ul>
            <a class="btn btn-ghost" routerLink="/gestion/bijoux">Gérer le stock</a>
          }
        </div>
      </div>
    } @else if (!erreurStats()) {
      <p class="muted">Chargement…</p>
    }

    <div class="card">
      <div class="page-head">
        <h2>Rapports</h2>
        <div class="tabs">
          @for (p of periodes; track p.value) {
            <button class="tab" [class.on]="periode() === p.value" (click)="chargerRapport(p.value)">{{ p.label }}</button>
          }
        </div>
      </div>

      @if (rapport(); as r) {
        <p><strong>{{ r.nombre_commandes }}</strong> commande(s) · chiffre d'affaires : <strong>{{ r.chiffre_affaires | fcfa }}</strong></p>
        @if (r.commandes.length > 0) {
          <table class="table">
            <thead><tr><th>N°</th><th>Date</th><th>Client</th><th>Total</th><th>Statut</th><th></th></tr></thead>
            <tbody>
              @for (c of r.commandes; track c.idCommande) {
                <tr>
                  <td>#{{ c.idCommande }}</td>
                  <td>{{ c.dateCommande | date: 'dd/MM/yyyy HH:mm' }}</td>
                  <td>{{ c.client?.prenom }} {{ c.client?.nom }}</td>
                  <td>{{ c.montantTotal | fcfa }}</td>
                  <td><app-badge [statut]="c.statutCommande" /></td>
                  <td><a class="btn btn-ghost" [routerLink]="['/commandes', c.idCommande]">Voir</a></td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <p class="muted">Aucune commande sur cette période.</p>
        }
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private admin = inject(AdminService);
  private toast = inject(ToastService);

  stats = signal<Statistiques | null>(null);
  erreurStats = signal(false);
  rapport = signal<Rapport | null>(null);
  periode = signal<Periode>('journalier');

  periodes: { value: Periode; label: string }[] = [
    { value: 'journalier', label: "Aujourd'hui" },
    { value: 'hebdomadaire', label: 'Cette semaine' },
    { value: 'mensuel', label: 'Ce mois' },
  ];

  /** Les ventes arrivent du plus récent au plus ancien : on les remet dans l'ordre et on calcule la hauteur des barres. */
  barres = computed(() => {
    const ventes = [...(this.stats()?.ventes_par_jour ?? [])].reverse().slice(-14);
    const max = Math.max(1, ...ventes.map((v) => toNumber(v.montant)));
    return ventes.map((v) => ({
      date: v.date,
      total: v.total,
      montant: v.montant,
      jour: String(v.date).slice(8, 10) + '/' + String(v.date).slice(5, 7),
      hauteur: Math.max(4, (toNumber(v.montant) / max) * 100),
    }));
  });

  ngOnInit() {
    this.admin.statistiques().subscribe({
      next: (s) => this.stats.set(s),
      error: (e) => {
        this.erreurStats.set(true);
        this.toast.error(errorMessage(e));
      },
    });
    this.chargerRapport('journalier');
  }

  chargerRapport(p: Periode) {
    this.periode.set(p);
    this.admin.rapport(p).subscribe({
      next: (r) => this.rapport.set(r),
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }
}
