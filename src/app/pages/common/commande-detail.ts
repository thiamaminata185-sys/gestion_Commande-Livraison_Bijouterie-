import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { ETAPES_COMMANDE, MODES, MODE_LABEL } from '../../core/labels';
import { Commande, Livraison, Livreur, ModePaiement, StatutLivraison } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { CommandeService } from '../../core/services/commande.service';
import { ToastService } from '../../core/services/toast.service';
import { errorMessage, telecharger } from '../../core/utils';
import { BadgeComponent, BijouImageComponent, FcfaPipe } from '../../shared/shared';

interface ActionLivraison { statut: StatutLivraison; label: string; classe: string; }

/** Page d'une commande, commune à tous les rôles : chacun n'y voit que les actions qui le concernent. */
@Component({
  selector: 'app-commande-detail',
  imports: [DatePipe, FormsModule, RouterLink, BadgeComponent, BijouImageComponent, FcfaPipe],
  template: `
    <a class="back" [routerLink]="retour()">← Retour</a>

    @if (commande(); as c) {
      <div class="page-head">
        <h1>Commande #{{ c.idCommande }} <app-badge [statut]="c.statutCommande" /></h1>
        <div class="row">
          @if (peutAnnuler()) {
            <button class="btn btn-danger-ghost" [disabled]="occupe()" (click)="annuler(c)">Annuler la commande</button>
          }
        </div>
      </div>

      <!-- Frise d'avancement -->
      @if (c.statutCommande === 'annulee') {
        <div class="alert ko">Cette commande a été annulée.</div>
      } @else {
        <div class="steps">
          @for (e of etapes; track e; let i = $index) {
            <div class="step" [class.done]="i < etapeIndex()" [class.current]="i === etapeIndex()">
              <span class="step-dot">{{ i < etapeIndex() ? '✓' : i + 1 }}</span>
              <span class="step-label">{{ libelle(e) }}</span>
            </div>
          }
        </div>
      }

      <div class="two-cols">
        <div>
          <!-- Articles -->
          <div class="card">
            <h2>Articles</h2>
            <table class="table">
              <thead><tr><th>Bijou</th><th>Prix</th><th>Qté</th><th>Sous-total</th></tr></thead>
              <tbody>
                @for (l of c.lignes ?? []; track l.id) {
                  <tr>
                    <td class="cell-bijou">
                      <div class="mini"><app-bijou-image [src]="l.bijou?.image" [alt]="l.bijou?.nomBijou ?? 'Bijou'" /></div>
                      {{ l.bijou?.nomBijou ?? 'Bijou #' + l.idBijou }}
                    </td>
                    <td>{{ l.prixUnitaire | fcfa }}</td>
                    <td>{{ l.quantite }}</td>
                    <td>{{ l.sousTotal | fcfa }}</td>
                  </tr>
                }
              </tbody>
              <tfoot><tr><td colspan="3" class="right"><strong>Total TTC</strong></td><td><strong>{{ c.montantTotal | fcfa }}</strong></td></tr></tfoot>
            </table>
          </div>

          <!-- Livraison -->
          <div class="card">
            <h2>Livraison</h2>
            <p><strong>Adresse :</strong> {{ c.adresseLivraison || '—' }}</p>
            @if (c.livraison; as l) {
              <p><strong>Livreur :</strong> {{ l.livreur ? l.livreur.prenom + ' ' + l.livreur.nom : '#' + l.idLivreur }}
                @if (l.livreur?.telephone) { · {{ l.livreur?.telephone }} }
              </p>
              <p><strong>Statut :</strong> <app-badge [statut]="l.statutLivraison" type="livraison" /></p>
              @for (a of actionsLivraison(l); track a.statut) {
                <button class="btn" [class]="'btn ' + a.classe" [disabled]="occupe()" (click)="changerLivraison(l, a.statut)">{{ a.label }}</button>
              }
            } @else if (peutAffecter()) {
              <form class="row" (ngSubmit)="affecter(c)">
                <select name="livreur" [(ngModel)]="idLivreur" required>
                  <option [ngValue]="null">Choisir un livreur…</option>
                  @for (l of livreurs(); track l.id) { <option [ngValue]="l.id">{{ l.prenom }} {{ l.nom }}</option> }
                </select>
                <button class="btn btn-gold" [disabled]="occupe() || !idLivreur">Affecter</button>
              </form>
              @if (livreurs().length === 0) { <p class="muted small">Aucun livreur actif disponible.</p> }
            } @else {
              <p class="muted">Pas encore de livreur affecté.</p>
            }
          </div>
        </div>

        <aside>
          <!-- Informations -->
          <div class="card">
            <h2>Informations</h2>
            <p class="line"><span>Date</span><strong>{{ c.dateCommande | date: 'dd/MM/yyyy HH:mm' }}</strong></p>
            @if (estPersonnel() && c.client) {
              <p class="line"><span>Client</span><strong>{{ c.client.prenom }} {{ c.client.nom }}</strong></p>
              <p class="line"><span>Contact</span><strong>{{ c.client.telephone || c.client.email }}</strong></p>
            }
          </div>

          <!-- Paiement -->
          <div class="card">
            <h2>Paiement</h2>
            @if (c.paiement; as p) {
              <p class="line"><span>Mode</span><strong>{{ modeLabel(p.mode) }}</strong></p>
              <p class="line"><span>Montant</span><strong>{{ p.montant | fcfa }}</strong></p>
              <p class="line"><span>Statut</span><app-badge [statut]="p.statut" type="paiement" /></p>
              <p class="line"><span>Référence</span><code>{{ p.referenceTransaction }}</code></p>
              @if (estPersonnel() && p.statut === 'en_attente') {
                <div class="row">
                  <button class="btn btn-gold grow" [disabled]="occupe()" (click)="validerPaiement(p.id)">Valider le paiement</button>
                  <button class="btn btn-danger-ghost" [disabled]="occupe()" (click)="annulerPaiement(p.id)">Refuser</button>
                </div>
              }
              @if (estClient() && p.statut === 'en_attente') {
                <p class="muted small">Paiement enregistré, en attente de validation par la bijouterie.</p>
              }
            } @else {
              <p class="muted">Aucun paiement enregistré.</p>
            }

            @if (peutPayer()) {
              <form (ngSubmit)="payer(c)">
                <label>Mode de paiement
                  <select name="mode" [(ngModel)]="mode">
                    @for (m of modes; track m.value) { <option [value]="m.value">{{ m.label }}</option> }
                  </select>
                </label>
                <button class="btn btn-gold block" [disabled]="occupe()">Payer {{ c.montantTotal | fcfa }}</button>
              </form>
            }
          </div>

          <!-- Facture -->
          @if (c.facture; as f) {
            <div class="card">
              <h2>Facture</h2>
              <p class="line"><span>Numéro</span><strong>{{ f.numero }}</strong></p>
              <p class="line"><span>HT</span><span>{{ f.montantHT | fcfa }}</span></p>
              <p class="line"><span>TVA (18 %)</span><span>{{ f.tva | fcfa }}</span></p>
              <p class="line"><span>TTC</span><strong>{{ f.montantTTC | fcfa }}</strong></p>
              <button class="btn btn-ghost block" (click)="telechargerFacture(c)">📄 Télécharger le PDF</button>
            </div>
          }

          <!-- Artisan -->
          @if (estArtisan() && (c.statutCommande === 'validee' || c.statutCommande === 'en_production')) {
            <div class="card">
              <h2>Production</h2>
              @if (c.statutCommande === 'validee') {
                <button class="btn btn-ghost block" [disabled]="occupe()" (click)="produire(c)">Lancer la production</button>
              }
              <button class="btn btn-gold block" [disabled]="occupe()" (click)="prete(c)">Marquer comme prête</button>
            </div>
          }
        </aside>
      </div>
    } @else if (erreur()) {
      <div class="card empty">Commande introuvable ou accès refusé.</div>
    } @else {
      <p class="muted">Chargement…</p>
    }
  `,
})
export class CommandeDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private service = inject(CommandeService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  commande = signal<Commande | null>(null);
  livreurs = signal<Livreur[]>([]);
  erreur = signal(false);
  occupe = signal(false);

  etapes = ETAPES_COMMANDE;
  modes = MODES;
  mode: ModePaiement = 'wave';
  idLivreur: number | null = null;

  estClient = computed(() => this.auth.role() === 'client');
  estPersonnel = computed(() => this.auth.role() === 'gestionnaire' || this.auth.role() === 'admin');
  estArtisan = computed(() => this.auth.role() === 'artisan');
  estLivreur = computed(() => this.auth.role() === 'livreur');

  retour = computed(() => {
    switch (this.auth.role()) {
      case 'client': return '/mes-commandes';
      case 'gestionnaire':
      case 'admin': return '/gestion/commandes';
      case 'artisan': return '/artisan';
      default: return '/livraisons';
    }
  });

  etapeIndex = computed(() => {
    const c = this.commande();
    return c ? this.etapes.indexOf(c.statutCommande) : 0;
  });

  peutAnnuler = computed(() => {
    const s = this.commande()?.statutCommande;
    if (this.estClient()) return s === 'en_attente';
    if (this.estPersonnel()) return s === 'en_attente' || s === 'validee';
    return false;
  });

  peutPayer = computed(() => {
    const c = this.commande();
    return this.estClient() && !!c && c.statutCommande === 'en_attente' && (!c.paiement || c.paiement.statut === 'annule');
  });

  peutAffecter = computed(() => {
    const c = this.commande();
    return this.estPersonnel() && !!c && c.statutCommande === 'prete' && !c.livraison;
  });

  ngOnInit() {
    this.charger();
  }

  libelle(statut: string): string {
    const l: Record<string, string> = {
      en_attente: 'En attente', validee: 'Validée', en_production: 'Production',
      prete: 'Prête', en_livraison: 'Livraison', livree: 'Livrée',
    };
    return l[statut] ?? statut;
  }

  modeLabel(m: string) {
    return MODE_LABEL[m] ?? m;
  }

  charger() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.service.detail(id).subscribe({
      next: (c) => {
        this.commande.set(c);
        this.occupe.set(false);
        if (this.estPersonnel() && c.statutCommande === 'prete' && !c.livraison) {
          this.service.livreurs().subscribe({ next: (l) => this.livreurs.set(l), error: () => undefined });
        }
      },
      error: () => this.erreur.set(true),
    });
  }

  /** Lance une action API puis recharge la commande. */
  private action(obs: Observable<unknown>, message: string) {
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

  annuler(c: Commande) {
    if (!confirm(`Annuler la commande #${c.idCommande} ? Les bijoux seront remis en stock.`)) return;
    this.action(this.service.annuler(c.idCommande), 'Commande annulée');
  }

  payer(c: Commande) {
    this.action(this.service.payer(c.idCommande, this.mode), 'Paiement enregistré');
  }

  validerPaiement(id: number) {
    this.action(this.service.validerPaiement(id), 'Paiement validé, facture générée');
  }

  annulerPaiement(id: number) {
    this.action(this.service.annulerPaiement(id), 'Paiement refusé');
  }

  produire(c: Commande) {
    this.action(this.service.produire(c.idCommande), 'Production lancée');
  }

  prete(c: Commande) {
    this.action(this.service.marquerPrete(c.idCommande), 'Commande prête pour la livraison');
  }

  affecter(c: Commande) {
    if (!this.idLivreur) return;
    this.action(this.service.affecterLivreur(c.idCommande, this.idLivreur), 'Livreur affecté');
  }

  /** Boutons de changement de statut, visibles seulement par le livreur assigné. */
  actionsLivraison(l: Livraison): ActionLivraison[] {
    if (!this.estLivreur() || l.idLivreur !== this.auth.user()?.id) return [];
    switch (l.statutLivraison) {
      case 'en_attente': return [{ statut: 'en_cours', label: 'Démarrer la livraison', classe: 'btn-gold' }];
      case 'en_cours':
        return [
          { statut: 'livree', label: 'Marquer comme livrée', classe: 'btn-gold' },
          { statut: 'echouee', label: 'Livraison échouée', classe: 'btn-danger-ghost' },
        ];
      case 'echouee': return [{ statut: 'en_cours', label: 'Reprendre la livraison', classe: 'btn-gold' }];
      default: return [];
    }
  }

  changerLivraison(l: Livraison, statut: StatutLivraison) {
    this.action(this.service.changerStatutLivraison(l.idLivraison, statut), 'Livraison mise à jour');
  }

  telechargerFacture(c: Commande) {
    if (!c.facture) return;
    const numero = c.facture.numero;
    this.service.telechargerFacture(c.facture.id, this.estClient()).subscribe({
      next: (blob) => telecharger(blob, `${numero}.pdf`),
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }
}
