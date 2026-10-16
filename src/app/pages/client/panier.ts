import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CommandeService } from '../../core/services/commande.service';
import { PanierService } from '../../core/services/panier.service';
import { ToastService } from '../../core/services/toast.service';
import { errorMessage } from '../../core/utils';
import { BijouImageComponent, FcfaPipe } from '../../shared/shared';

@Component({
  selector: 'app-panier',
  imports: [FormsModule, RouterLink, BijouImageComponent, FcfaPipe],
  template: `
    <h1>Mon panier</h1>

    @if (panier.panier().lignes.length === 0) {
      <div class="card empty">
        Votre panier est vide.<br />
        <a class="btn btn-gold" routerLink="/catalogue">Découvrir la collection</a>
      </div>
    } @else {
      <div class="two-cols">
        <div class="card">
          <table class="table">
            <thead><tr><th>Bijou</th><th>Prix</th><th>Quantité</th><th>Sous-total</th><th></th></tr></thead>
            <tbody>
              @for (l of panier.panier().lignes; track l.idBijou) {
                <tr>
                  <td class="cell-bijou">
                    <div class="mini"><app-bijou-image [src]="l.image" [alt]="l.nomBijou" /></div>
                    <a [routerLink]="['/bijoux', l.idBijou]">{{ l.nomBijou }}</a>
                  </td>
                  <td>{{ l.prixUnitaire | fcfa }}</td>
                  <td>
                    <div class="stepper">
                      <button class="btn btn-ghost" [disabled]="l.quantite <= 1" (click)="changer(l.idBijou, l.quantite - 1)">−</button>
                      <span>{{ l.quantite }}</span>
                      <button class="btn btn-ghost" [disabled]="l.quantite >= l.stockDisponible" (click)="changer(l.idBijou, l.quantite + 1)">+</button>
                    </div>
                  </td>
                  <td><strong>{{ l.sousTotal | fcfa }}</strong></td>
                  <td><button class="btn btn-danger-ghost" (click)="retirer(l.idBijou)" title="Retirer">✕</button></td>
                </tr>
              }
            </tbody>
          </table>
          <button class="btn btn-ghost" (click)="vider()">Vider le panier</button>
        </div>

        <aside class="card summary">
          <h2>Récapitulatif</h2>
          <p class="line"><span>Articles</span><strong>{{ panier.panier().nombre_articles }}</strong></p>
          <p class="line total"><span>Total (TTC)</span><strong>{{ panier.panier().total | fcfa }}</strong></p>

          <form (ngSubmit)="commander()">
            <label>Adresse de livraison
              <textarea name="adresse" rows="3" required [(ngModel)]="adresse" placeholder="Quartier, rue, ville…"></textarea>
            </label>
            <button class="btn btn-gold block" [disabled]="envoi()">
              {{ envoi() ? 'Envoi…' : 'Passer la commande' }}
            </button>
          </form>
          <p class="muted small">Vous pourrez payer à l'étape suivante (Wave, Orange Money, carte ou espèces).</p>
        </aside>
      </div>
    }
  `,
})
export class PanierComponent implements OnInit {
  panier = inject(PanierService);
  private commandes = inject(CommandeService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  adresse = this.auth.user()?.adresse ?? '';
  envoi = signal(false);

  ngOnInit() {
    this.panier.charger();
  }

  changer(idBijou: number, quantite: number) {
    this.panier.changerQuantite(idBijou, quantite).subscribe({ error: (e) => this.toast.error(errorMessage(e)) });
  }

  retirer(idBijou: number) {
    this.panier.retirer(idBijou).subscribe({ error: (e) => this.toast.error(errorMessage(e)) });
  }

  vider() {
    if (!confirm('Vider tout le panier ?')) return;
    this.panier.vider().subscribe({ error: (e) => this.toast.error(errorMessage(e)) });
  }

  commander() {
    if (!this.adresse.trim()) {
      this.toast.error("Indiquez l'adresse de livraison");
      return;
    }
    this.envoi.set(true);
    this.commandes.creer(this.adresse.trim()).subscribe({
      next: (c) => {
        this.panier.reinitialiser();
        this.toast.success(`Commande n°${c.idCommande} enregistrée. Il reste à la payer.`);
        this.router.navigate(['/commandes', c.idCommande]);
      },
      error: (e) => {
        this.toast.error(errorMessage(e));
        this.envoi.set(false);
        this.panier.charger();
      },
    });
  }
}
