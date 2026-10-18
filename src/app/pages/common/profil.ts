import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ROLE_LABEL } from '../../core/labels';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { errorMessage } from '../../core/utils';
import { AvatarComponent } from '../../shared/shared';

const TAILLE_MAX = 2 * 1024 * 1024; // 2 Mo, comme côté API

@Component({
  selector: 'app-profil',
  imports: [FormsModule, AvatarComponent],
  template: `
    <h1>Mon profil</h1>

    <div class="profile-grid">
      <!-- Photo -->
      <div class="card profile-photo">
        <app-avatar [image]="auth.user()?.image" [prenom]="auth.user()?.prenom ?? ''" [nom]="auth.user()?.nom ?? ''" [taille]="130" />
        <h2>{{ auth.user()?.prenom }} {{ auth.user()?.nom }}</h2>
        <p class="muted">{{ auth.user()?.email }}<br /><span class="badge info">{{ role() }}</span></p>

        <label class="btn btn-gold" [class.disabled]="envoiPhoto()">
          {{ envoiPhoto() ? 'Envoi…' : '📷 Changer la photo' }}
          <input type="file" accept="image/png,image/jpeg,image/webp" hidden [disabled]="envoiPhoto()" (change)="choisirPhoto($event)" />
        </label>
        @if (auth.user()?.image) {
          <button class="btn btn-danger-ghost" [disabled]="envoiPhoto()" (click)="retirerPhoto()">Supprimer la photo</button>
        }
        <small class="muted">JPG, PNG ou WebP · 2 Mo maximum</small>
      </div>

      <div>
        <!-- Informations -->
        <div class="card">
          <h2>Mes informations</h2>
          <form (ngSubmit)="enregistrer()">
            <div class="grid-2">
              <label>Prénom<input name="prenom" [(ngModel)]="f.prenom" required /></label>
              <label>Nom<input name="nom" [(ngModel)]="f.nom" required /></label>
            </div>
            <label>Téléphone<input name="telephone" [(ngModel)]="f.telephone" /></label>
            <label>Adresse<input name="adresse" [(ngModel)]="f.adresse" /></label>
            <button class="btn btn-gold" [disabled]="envoi()">{{ envoi() ? 'Enregistrement…' : 'Enregistrer' }}</button>
          </form>
        </div>

        <!-- Mot de passe -->
        <div class="card">
          <h2>🔒 Changer mon mot de passe</h2>
          <form (ngSubmit)="changerMotDePasse()">
            <label>Mot de passe actuel
              <input name="actuel" [type]="afficher() ? 'text' : 'password'" [(ngModel)]="mdp.actuel" required autocomplete="current-password" />
            </label>
            <label>Nouveau mot de passe (8 caractères minimum)
              <input name="nouveau" [type]="afficher() ? 'text' : 'password'" [(ngModel)]="mdp.nouveau" required minlength="8" autocomplete="new-password" />
            </label>
            @if (mdp.nouveau) {
              <div class="strength">
                <div class="strength-bar"><span [class]="force().classe" [style.width.%]="force().niveau * 25"></span></div>
                <small>Sécurité : <strong>{{ force().label }}</strong></small>
              </div>
            }
            <label>Confirmer le nouveau mot de passe
              <input name="confirmation" [type]="afficher() ? 'text' : 'password'" [(ngModel)]="mdp.confirmation" required autocomplete="new-password" />
            </label>
            <label class="check">
              <input type="checkbox" name="voir" [checked]="afficher()" (change)="afficher.set(!afficher())" /> Afficher les mots de passe
            </label>
            <button class="btn btn-gold" [disabled]="envoiMdp()">{{ envoiMdp() ? 'Modification…' : 'Modifier le mot de passe' }}</button>
          </form>
          <p class="muted small">Pour votre sécurité, vos autres appareils connectés seront déconnectés.</p>
        </div>
      </div>
    </div>
  `,
})
export class ProfilComponent {
  auth = inject(AuthService);
  private toast = inject(ToastService);

  envoi = signal(false);
  envoiPhoto = signal(false);
  envoiMdp = signal(false);
  afficher = signal(false);

  role = computed(() => {
    const r = this.auth.role();
    return r ? ROLE_LABEL[r] : '';
  });

  f = {
    prenom: this.auth.user()?.prenom ?? '',
    nom: this.auth.user()?.nom ?? '',
    telephone: this.auth.user()?.telephone ?? '',
    adresse: this.auth.user()?.adresse ?? '',
  };

  mdp = { actuel: '', nouveau: '', confirmation: '' };

  enregistrer() {
    this.envoi.set(true);
    this.auth.modifierProfil({ ...this.f }).subscribe({
      next: () => {
        this.toast.success('Profil mis à jour');
        this.envoi.set(false);
      },
      error: (e) => {
        this.toast.error(errorMessage(e));
        this.envoi.set(false);
      },
    });
  }

  choisirPhoto(event: Event) {
    const champ = event.target as HTMLInputElement;
    const fichier = champ.files?.[0];
    champ.value = ''; // permet de rechoisir le même fichier plus tard
    if (!fichier) return;

    if (!fichier.type.startsWith('image/')) {
      this.toast.error('Choisissez une image (JPG, PNG ou WebP)');
      return;
    }
    if (fichier.size > TAILLE_MAX) {
      this.toast.error('Cette image dépasse 2 Mo');
      return;
    }

    this.envoiPhoto.set(true);
    this.auth.televerserPhoto(fichier).subscribe({
      next: () => {
        this.toast.success('Photo de profil mise à jour');
        this.envoiPhoto.set(false);
      },
      error: (e) => {
        this.toast.error(errorMessage(e));
        this.envoiPhoto.set(false);
      },
    });
  }

  retirerPhoto() {
    this.envoiPhoto.set(true);
    this.auth.supprimerPhoto().subscribe({
      next: () => {
        this.toast.success('Photo supprimée');
        this.envoiPhoto.set(false);
      },
      error: (e) => {
        this.toast.error(errorMessage(e));
        this.envoiPhoto.set(false);
      },
    });
  }

  /** Indicateur de robustesse : longueur, majuscule, chiffre, symbole. */
  force(): { niveau: number; label: string; classe: string } {
    const m = this.mdp.nouveau;
    let niveau = 0;
    if (m.length >= 8) niveau++;
    if (/[A-Z]/.test(m) && /[a-z]/.test(m)) niveau++;
    if (/\d/.test(m)) niveau++;
    if (/[^A-Za-z0-9]/.test(m)) niveau++;
    const labels = ['Très faible', 'Faible', 'Moyen', 'Bon', 'Excellent'];
    const classes = ['ko', 'ko', 'warn', 'ok', 'ok'];
    return { niveau, label: labels[niveau], classe: classes[niveau] };
  }

  changerMotDePasse() {
    if (this.mdp.nouveau.length < 8) {
      this.toast.error('Le nouveau mot de passe doit faire 8 caractères minimum');
      return;
    }
    if (this.mdp.nouveau !== this.mdp.confirmation) {
      this.toast.error('Les deux nouveaux mots de passe ne sont pas identiques');
      return;
    }
    this.envoiMdp.set(true);
    this.auth
      .changerMotDePasse({
        motDePasseActuel: this.mdp.actuel,
        motDePasse: this.mdp.nouveau,
        motDePasse_confirmation: this.mdp.confirmation,
      })
      .subscribe({
        next: () => {
          this.toast.success('Mot de passe modifié');
          this.mdp = { actuel: '', nouveau: '', confirmation: '' };
          this.envoiMdp.set(false);
        },
        error: (e) => {
          this.toast.error(errorMessage(e));
          this.envoiMdp.set(false);
        },
      });
  }
}
