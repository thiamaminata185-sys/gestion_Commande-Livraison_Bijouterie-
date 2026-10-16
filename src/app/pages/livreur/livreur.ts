import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Livraison, StatutLivraison } from '../../core/models';
import { CommandeService } from '../../core/services/commande.service';
import { ToastService } from '../../core/services/toast.service';
import { errorMessage } from '../../core/utils';
import { BadgeComponent, FcfaPipe } from '../../shared/shared';

@Component({
  selector: 'app-livreur',
  imports: [RouterLink, BadgeComponent, FcfaPipe],
  template: `
    <h1>Mes livraisons</h1>

    @if (chargement()) {
      <p class="muted">Chargement…</p>
    } @else if (livraisons().length === 0) {
      <div class="card empty">Aucune livraison en cours. 👍</div>
    } @else {
      <div class="grid-cards wide">
        @for (l of livraisons(); track l.idLivraison) {
          <article class="card">
            <div class="page-head">
              <h2>Commande #{{ l.idCommande }}</h2>
              <app-badge [statut]="l.statutLivraison" type="livraison" />
            </div>
            <p><strong>Client :</strong> {{ l.commande?.client?.prenom }} {{ l.commande?.client?.nom }}</p>
            @if (l.commande?.client?.telephone; as tel) {
              <p><strong>Téléphone :</strong> <a [href]="'tel:' + tel">{{ tel }}</a></p>
            }
            <p><strong>Adresse :</strong> {{ l.adresseLivraison }}</p>
            @if (l.commande) { <p><strong>Montant :</strong> {{ l.commande.montantTotal | fcfa }}</p> }

            <div class="row wrap">
              @if (l.statutLivraison === 'en_attente') {
                <button class="btn btn-gold grow" [disabled]="occupe()" (click)="changer(l, 'en_cours')">Démarrer la livraison</button>
              }
              @if (l.statutLivraison === 'en_cours') {
                <button class="btn btn-gold grow" [disabled]="occupe()" (click)="changer(l, 'livree')">Marquer comme livrée</button>
                <button class="btn btn-danger-ghost" [disabled]="occupe()" (click)="changer(l, 'echouee')">Échec</button>
              }
              <a class="btn btn-ghost" [routerLink]="['/commandes', l.idCommande]">Détail</a>
            </div>
          </article>
        }
      </div>
    }
  `,
})
export class LivreurComponent implements OnInit {
  private service = inject(CommandeService);
  private toast = inject(ToastService);

  livraisons = signal<Livraison[]>([]);
  chargement = signal(true);
  occupe = signal(false);

  ngOnInit() {
    this.charger();
  }

  charger() {
    this.service.mesLivraisons().subscribe({
      next: (l) => {
        this.livraisons.set(l);
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

  changer(l: Livraison, statut: StatutLivraison) {
    this.occupe.set(true);
    this.service.changerStatutLivraison(l.idLivraison, statut).subscribe({
      next: () => {
        this.toast.success(statut === 'livree' ? 'Livraison terminée, le client est prévenu' : 'Statut mis à jour');
        this.charger();
      },
      error: (e) => {
        this.toast.error(errorMessage(e));
        this.occupe.set(false);
      },
    });
  }
}
