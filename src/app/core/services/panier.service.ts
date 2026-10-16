import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Panier } from '../models';

@Injectable({ providedIn: 'root' })
export class PanierService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  readonly panier = signal<Panier>({ lignes: [], nombre_articles: 0, total: 0 });
  readonly nombre = computed(() => this.panier().nombre_articles);

  charger() {
    this.http.get<Panier>(`${this.api}/panier`).subscribe({
      next: (p) => this.panier.set(p),
      error: () => undefined,
    });
  }

  ajouter(idBijou: number, quantite = 1) {
    return this.http.post<Panier>(`${this.api}/panier`, { idBijou, quantite }).pipe(tap((p) => this.panier.set(p)));
  }

  changerQuantite(idBijou: number, quantite: number) {
    return this.http.patch<Panier>(`${this.api}/panier/${idBijou}`, { quantite }).pipe(tap((p) => this.panier.set(p)));
  }

  retirer(idBijou: number) {
    return this.http.delete<Panier>(`${this.api}/panier/${idBijou}`).pipe(tap((p) => this.panier.set(p)));
  }

  vider() {
    return this.http.delete<Panier>(`${this.api}/panier`).pipe(tap((p) => this.panier.set(p)));
  }

  /** Après une commande, le panier est vidé côté API : on met l'affichage à jour. */
  reinitialiser() {
    this.panier.set({ lignes: [], nombre_articles: 0, total: 0 });
  }
}
