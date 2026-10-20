import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { errorMessage } from '../../core/utils';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="auth-wrap">
      <div class="auth-card card">
        <div class="brand-lg"><img src="images/logo-horizontal-pour-fond-clair.svg" alt="Logo Étoile d'Or" width="150" height="80" /></div>
        <h1>Connexion</h1>
        <form (ngSubmit)="valider()">
          <label>Email
            <input name="email" type="email" [(ngModel)]="email" required autocomplete="username" />
          </label>
          <label>Mot de passe
            <input name="motDePasse" type="password" [(ngModel)]="motDePasse" required autocomplete="current-password" />
          </label>
          <button class="btn btn-gold block" [disabled]="chargement()">
            {{ chargement() ? 'Connexion…' : 'Se connecter' }}
          </button>
        </form>
        <p class="muted center">Pas encore de compte ? <a routerLink="/register">Créer un compte client</a></p>

        <details class="demo">
          <summary>Comptes de démonstration</summary>
          <p class="muted">Mot de passe : <code>password</code></p>
          <div class="chips">
            @for (d of demos; track d.email) {
              <button type="button" class="chip" (click)="remplir(d.email)">{{ d.label }}</button>
            }
          </div>
        </details>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  email = '';
  motDePasse = '';
  chargement = signal(false);

  demos = [
    { label: 'Client', email: 'client@test.sn' },
    { label: 'Gestionnaire', email: 'gestion@etoile-or.sn' },
    { label: 'Artisan', email: 'artisan@etoile-or.sn' },
    { label: 'Livreur', email: 'livreur@etoile-or.sn' },
    { label: 'Admin', email: 'admin@etoile-or.sn' },
  ];

  remplir(email: string) {
    this.email = email;
    this.motDePasse = 'password';
  }

  valider() {
    this.chargement.set(true);
    this.auth.login(this.email, this.motDePasse).subscribe({
      next: () => {
        const retour = this.route.snapshot.queryParamMap.get('retour');
        this.router.navigateByUrl(retour || this.auth.homeRoute());
      },
      error: (e) => {
        this.toast.error(errorMessage(e));
        this.chargement.set(false);
      },
    });
  }
}
