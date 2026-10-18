import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Role, User } from '../models';

interface AuthResponse { utilisateur: User; token: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private api = environment.apiUrl;

  private readonly _user = signal<User | null>(this.lireUtilisateur());
  readonly user = this._user.asReadonly();
  readonly role = computed<Role | null>(() => this._user()?.role ?? null);

  get token(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.token && !!this._user();
  }

  login(email: string, motDePasse: string) {
    return this.http.post<AuthResponse>(`${this.api}/login`, { email, motDePasse }).pipe(tap((r) => this.sauver(r)));
  }

  register(data: Record<string, unknown>) {
    return this.http.post<AuthResponse>(`${this.api}/register`, data).pipe(tap((r) => this.sauver(r)));
  }

  logout() {
    this.http.post(`${this.api}/logout`, {}).pipe(catchError(() => of(null))).subscribe();
    this.vider();
    this.router.navigateByUrl('/login');
  }

  /** Efface la session locale (sans appeler l'API) : utilisé aussi quand le token est refusé (401). */
  vider() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this._user.set(null);
  }

  modifierProfil(data: Partial<User>) {
    return this.http.patch<User>(`${this.api}/profil`, data).pipe(tap((u) => this.majUtilisateur(u)));
  }

  changerMotDePasse(data: { motDePasseActuel: string; motDePasse: string; motDePasse_confirmation: string }) {
    return this.http.patch<{ message: string }>(`${this.api}/profil/mot-de-passe`, data);
  }

  /** Envoie une nouvelle photo de profil (fichier image). */
  televerserPhoto(fichier: File) {
    const formulaire = new FormData();
    formulaire.append('image', fichier);
    return this.http.post<User>(`${this.api}/profil/image`, formulaire).pipe(tap((u) => this.majUtilisateur(u)));
  }

  supprimerPhoto() {
    return this.http.delete<User>(`${this.api}/profil/image`).pipe(tap((u) => this.majUtilisateur(u)));
  }

  private majUtilisateur(u: User) {
    this._user.set(u);
    localStorage.setItem('user', JSON.stringify(u));
  }

  /** Page d'accueil de chaque rôle après connexion. */
  homeRoute(): string {
    switch (this.role()) {
      case 'client': return '/accueil';
      case 'gestionnaire':
      case 'admin': return '/gestion/tableau-de-bord';
      case 'artisan': return '/artisan';
      case 'livreur': return '/livraisons';
      default: return '/login';
    }
  }

  private sauver(r: AuthResponse) {
    localStorage.setItem('token', r.token);
    localStorage.setItem('user', JSON.stringify(r.utilisateur));
    this._user.set(r.utilisateur);
  }

  private lireUtilisateur(): User | null {
    try {
      const raw = localStorage.getItem('user');
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }
}
