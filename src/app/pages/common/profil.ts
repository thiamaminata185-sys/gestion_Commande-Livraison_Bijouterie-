import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ROLE_LABEL } from '../../core/labels';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { errorMessage } from '../../core/utils';

@Component({
  selector: 'app-profil',
  imports: [FormsModule],
  template: `
    <h1>Mon profil</h1>
    <div class="card narrow">
      <p class="muted">{{ auth.user()?.email }} · <span class="badge info">{{ role() }}</span></p>
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
  `,
})
export class ProfilComponent {
  auth = inject(AuthService);
  private toast = inject(ToastService);

  envoi = signal(false);
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
}
