import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Bijou, Categorie, Favori, Paginated } from '../models';

export interface FiltresBijoux {
  search?: string;
  idCategorie?: number | string;
  prixMin?: number | string;
  prixMax?: number | string;
  page?: number;
}

@Injectable({ providedIn: 'root' })
export class CatalogueService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  /** Identifiants des bijoux favoris du client connecté (pour afficher les cœurs). */
  readonly favoriIds = signal<Set<number>>(new Set());

  bijoux(filtres: FiltresBijoux = {}) {
    let params = new HttpParams();
    for (const [cle, valeur] of Object.entries(filtres)) {
      if (valeur !== undefined && valeur !== null && valeur !== '') params = params.set(cle, String(valeur));
    }
    return this.http.get<Paginated<Bijou>>(`${this.api}/bijoux`, { params });
  }

  bijou(id: number | string) {
    return this.http.get<Bijou>(`${this.api}/bijoux/${id}`);
  }

  creerBijou(data: unknown) {
    return this.http.post<Bijou>(`${this.api}/bijoux`, data);
  }

  modifierBijou(id: number, data: unknown) {
    return this.http.put<Bijou>(`${this.api}/bijoux/${id}`, data);
  }

  supprimerBijou(id: number) {
    return this.http.delete<{ message: string }>(`${this.api}/bijoux/${id}`);
  }

  categories() {
    return this.http.get<Categorie[]>(`${this.api}/categories`);
  }

  creerCategorie(data: unknown) {
    return this.http.post<Categorie>(`${this.api}/categories`, data);
  }

  modifierCategorie(id: number, data: unknown) {
    return this.http.put<Categorie>(`${this.api}/categories/${id}`, data);
  }

  supprimerCategorie(id: number) {
    return this.http.delete<{ message: string }>(`${this.api}/categories/${id}`);
  }

  // ---- Favoris (client) ----
  favoris() {
    return this.http.get<Favori[]>(`${this.api}/favoris`).pipe(
      tap((l) => this.favoriIds.set(new Set(l.map((f) => f.idBijou)))),
    );
  }

  chargerFavoris() {
    this.favoris().subscribe({ error: () => undefined });
  }

  ajouterFavori(idBijou: number) {
    return this.http.post(`${this.api}/favoris/${idBijou}`, {}).pipe(
      tap(() => this.favoriIds.update((s) => new Set(s).add(idBijou))),
    );
  }

  retirerFavori(idBijou: number) {
    return this.http.delete(`${this.api}/favoris/${idBijou}`).pipe(
      tap(() =>
        this.favoriIds.update((s) => {
          const n = new Set(s);
          n.delete(idBijou);
          return n;
        }),
      ),
    );
  }
}
