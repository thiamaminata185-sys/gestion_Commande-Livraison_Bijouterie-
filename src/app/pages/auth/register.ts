import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { errorMessage } from '../../core/utils';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-wrap">
      <div class="auth-card card wide">
        <div class="brand-lg">💎 Étoile d'Or</div>
        <h1>Créer un compte</h1>
        <form (ngSubmit)="valider()">
          <div class="grid-2">
            <label>Prénom<input name="prenom" [(ngModel)]="f.prenom" required /></label>
            <label>Nom<input name="nom" [(ngModel)]="f.nom" required /></label>
          </div>
          <label>Email<input name="email" type="email" [(ngModel)]="f.email" required /></label>
          <div class="grid-2">
            <label>Téléphone<input name="telephone" [(ngModel)]="f.telephone" /></label>
            <label>Adresse<input name="adresse" [(ngModel)]="f.adresse" /></label>
          </div>
          <div class="grid-2">
            <label>Mot de passe (8 caractères min.)
              <input name="mdp" type="password" [(ngModel)]="f.motDePasse" required minlength="8" autocomplete="new-password" />
            </label>
            <label>Confirmation
              <input name="mdp2" type="password" [(ngModel)]="f.motDePasse_confirmation" required autocomplete="new-password" />
            </label>
          </div>
          <button class="btn btn-gold block" [disabled]="chargement()">
            {{ chargement() ? 'Création…' : 'Créer mon compte' }}
          </button>
        </form>
        <p class="muted center">Déjà inscrit ? <a routerLink="/login">Se connecter</a></p>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  chargement = signal(false);
  f = { prenom: '', nom: '', email: '', telephone: '', adresse: '', motDePasse: '', motDePasse_confirmation: '' };

  valider() {
    if (this.f.motDePasse !== this.f.motDePasse_confirmation) {
      this.toast.error('Les deux mots de passe ne sont pas identiques');
      return;
    }
    this.chargement.set(true);
    this.auth.register({ ...this.f }).subscribe({
      next: () => {
        this.toast.success('Bienvenue ! Votre compte est créé.');
        this.router.navigateByUrl(this.auth.homeRoute());
      },
      error: (e) => {
        this.toast.error(errorMessage(e));
        this.chargement.set(false);
      },
    });
  }
}
