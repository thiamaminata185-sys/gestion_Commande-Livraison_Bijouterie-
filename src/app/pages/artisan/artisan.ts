import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Commande } from '../../core/models';
import { CommandeService } from '../../core/services/commande.service';
import { ToastService } from '../../core/services/toast.service';
import { errorMessage } from '../../core/utils';
import { BadgeComponent } from '../../shared/shared';
import { IconComponent } from '../../shared/icon';

@Component({
  selector: 'app-artisan',
  imports: [DatePipe, RouterLink, BadgeComponent,IconComponent],
  template: `
    <h1>Commandes à préparer</h1>

    @if (chargement()) {
      <p class="muted">Chargement…</p>
    } @else if (commandes().length === 0) {
      <div class="card empty">Rien à préparer pour le moment. </div>
    } @else {
      <div class="grid-cards wide">
        @for (c of commandes(); track c.idCommande) {
          <article class="card">
            <div class="page-head">
              <h2>Commande #{{ c.idCommande }}</h2>
              <app-badge [statut]="c.statutCommande" />
            </div>
            <p class="muted">{{ c.client?.prenom }} {{ c.client?.nom }} · {{ c.dateCommande | date: 'dd/MM/yyyy' }}</p>
            <ul class="plain">
              @for (l of c.lignes ?? []; track l.id) {
                <li class="line"><span>{{ l.bijou?.nomBijou }}</span><strong>× {{ l.quantite }}</strong></li>
              }
            </ul>
            <div class="row">
              @if (c.statutCommande === 'validee') {
                <button class="btn btn-ghost block has-icon" (click)="produire(c)"><app-icon nom="play" [taille]="16" /> Lancer la production</button>
              }
              <button class="btn btn-gold grow" [disabled]="occupe()" (click)="prete(c)">Marquer prête</button>
              <td><a class="btn-icon" [routerLink]="['/commandes', c.idCommande]" title="Voir la commande" aria-label="Voir"><app-icon nom="eye" /></a></td>
            </div>
          </article>
        }
      </div>
    }
  `,
})
export class ArtisanComponent implements OnInit {
  private service = inject(CommandeService);
  private toast = inject(ToastService);

  commandes = signal<Commande[]>([]);
  chargement = signal(true);
  occupe = signal(false);

  ngOnInit() {
    this.charger();
  }

  charger() {
    this.service.aPreparer().subscribe({
      next: (l) => {
        this.commandes.set(l);
        this.chargement.set(false);
        this.occupe.set(false);
      },
      error: (e) => {
        this.toast.error(errorMessage(e));
        this.chargement.set(false);
        this.occupe.set(false);
      },
    });
  }

  produire(c: Commande) {
    this.lancer(this.service.produire(c.idCommande), 'Production lancée');
  }

  prete(c: Commande) {
    this.lancer(this.service.marquerPrete(c.idCommande), 'Commande prête : le gestionnaire est prévenu');
  }

  private lancer(obs: ReturnType<CommandeService['produire']>, message: string) {
    this.occupe.set(true);
    obs.subscribe({
      next: () => {
        this.toast.success(message);
        this.charger();
      },
      error: (e) => {
        this.toast.error(errorMessage(e));
        this.occupe.set(false);
      },
    });
  }
}
