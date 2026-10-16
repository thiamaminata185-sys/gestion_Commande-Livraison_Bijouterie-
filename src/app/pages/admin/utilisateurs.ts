import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ROLE_LABEL } from '../../core/labels';
import { Role, User } from '../../core/models';
import { AdminService } from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { errorMessage } from '../../core/utils';
import { PaginationComponent } from '../../shared/shared';

interface FormUser {
  prenom: string; nom: string; email: string; telephone: string; adresse: string; role: Role; motDePasse: string;
}

const vide = (): FormUser => ({ prenom: '', nom: '', email: '', telephone: '', adresse: '', role: 'client', motDePasse: '' });

@Component({
  selector: 'app-utilisateurs',
  imports: [FormsModule, PaginationComponent],
  template: `
    <div class="page-head">
      <h1>Utilisateurs</h1>
      <button class="btn btn-gold" (click)="nouveau()">+ Nouvel utilisateur</button>
    </div>

    @if (formulaireOuvert()) {
      <div class="card">
        <h2>{{ idEdition() ? "Modifier l'utilisateur" : 'Nouvel utilisateur' }}</h2>
        <form (ngSubmit)="enregistrer()">
          <div class="grid-2">
            <label>Prénom<input name="prenom" [(ngModel)]="f.prenom" required /></label>
            <label>Nom<input name="nom" [(ngModel)]="f.nom" required /></label>
          </div>
          <div class="grid-2">
            <label>Email<input name="email" type="email" [(ngModel)]="f.email" required /></label>
            <label>Rôle
              <select name="role" [(ngModel)]="f.role">
                @for (r of roles; track r[0]) { <option [value]="r[0]">{{ r[1] }}</option> }
              </select>
            </label>
          </div>
          <div class="grid-2">
            <label>Téléphone<input name="tel" [(ngModel)]="f.telephone" /></label>
            <label>Adresse<input name="adresse" [(ngModel)]="f.adresse" /></label>
          </div>
          <label>Mot de passe @if (idEdition()) { <small class="muted">(laisser vide pour ne pas le changer)</small> }
            <input name="mdp" type="password" minlength="8" [(ngModel)]="f.motDePasse" [required]="!idEdition()" autocomplete="new-password" />
          </label>
          <div class="row">
            <button class="btn btn-gold" [disabled]="envoi()">{{ envoi() ? 'Enregistrement…' : 'Enregistrer' }}</button>
            <button type="button" class="btn btn-ghost" (click)="formulaireOuvert.set(false)">Annuler</button>
          </div>
        </form>
      </div>
    }

    <div class="card table-wrap">
      <table class="table">
        <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Statut</th><th></th></tr></thead>
        <tbody>
          @for (u of utilisateurs(); track u.id) {
            <tr>
              <td><strong>{{ u.prenom }} {{ u.nom }}</strong><br /><small class="muted">{{ u.telephone }}</small></td>
              <td>{{ u.email }}</td>
              <td><span class="badge info">{{ roleLabel(u.role) }}</span></td>
              <td><span class="badge" [class]="u.actif ? 'ok' : 'ko'">{{ u.actif ? 'Actif' : 'Désactivé' }}</span></td>
              <td class="actions">
                <button class="btn btn-ghost" (click)="modifier(u)">Modifier</button>
                @if (u.id !== auth.user()?.id) {
                  <button class="btn btn-ghost" (click)="basculer(u)">{{ u.actif ? 'Désactiver' : 'Activer' }}</button>
                  <button class="btn btn-danger-ghost" (click)="supprimer(u)">Supprimer</button>
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
    <app-pagination [page]="page()" [last]="last()" (changed)="charger($event)" />
  `,
})
export class UtilisateursComponent implements OnInit {
  private admin = inject(AdminService);
  private toast = inject(ToastService);
  auth = inject(AuthService);

  utilisateurs = signal<User[]>([]);
  page = signal(1);
  last = signal(1);
  formulaireOuvert = signal(false);
  idEdition = signal<number | null>(null);
  envoi = signal(false);
  roles = Object.entries(ROLE_LABEL);
  f: FormUser = vide();

  ngOnInit() {
    this.charger(1);
  }

  roleLabel(r: Role) {
    return ROLE_LABEL[r];
  }

  charger(p: number) {
    this.admin.utilisateurs(p).subscribe({
      next: (r) => {
        this.utilisateurs.set(r.data);
        this.page.set(r.current_page);
        this.last.set(r.last_page);
      },
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }

  nouveau() {
    this.f = vide();
    this.idEdition.set(null);
    this.formulaireOuvert.set(true);
  }

  modifier(u: User) {
    this.f = {
      prenom: u.prenom, nom: u.nom, email: u.email,
      telephone: u.telephone ?? '', adresse: u.adresse ?? '', role: u.role, motDePasse: '',
    };
    this.idEdition.set(u.id);
    this.formulaireOuvert.set(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  enregistrer() {
    const id = this.idEdition();
    const donnees: Record<string, unknown> = {
      prenom: this.f.prenom, nom: this.f.nom, email: this.f.email,
      telephone: this.f.telephone || null, adresse: this.f.adresse || null, role: this.f.role,
    };
    if (this.f.motDePasse) donnees['motDePasse'] = this.f.motDePasse;

    this.envoi.set(true);
    const requete = id ? this.admin.modifierUtilisateur(id, donnees) : this.admin.creerUtilisateur(donnees);
    requete.subscribe({
      next: () => {
        this.toast.success(id ? 'Utilisateur modifié' : 'Utilisateur créé');
        this.formulaireOuvert.set(false);
        this.envoi.set(false);
        this.charger(this.page());
      },
      error: (e) => {
        this.toast.error(errorMessage(e));
        this.envoi.set(false);
      },
    });
  }

  basculer(u: User) {
    this.admin.basculerActif(u.id).subscribe({
      next: (r) => {
        this.toast.success(r.actif ? 'Compte activé' : 'Compte désactivé');
        this.charger(this.page());
      },
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }

  supprimer(u: User) {
    if (!confirm(`Supprimer ${u.prenom} ${u.nom} ?`)) return;
    this.admin.supprimerUtilisateur(u.id).subscribe({
      next: () => {
        this.toast.success('Utilisateur supprimé');
        this.charger(this.page());
      },
      error: (e) => this.toast.error(errorMessage(e)),
    });
  }
}
