import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Paginated, Rapport, Statistiques, User } from '../models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  statistiques() {
    return this.http.get<Statistiques>(`${this.api}/statistiques`);
  }

  rapport(type: 'journalier' | 'hebdomadaire' | 'mensuel') {
    return this.http.get<Rapport>(`${this.api}/rapports/${type}`);
  }

  utilisateurs(page = 1) {
    return this.http.get<Paginated<User>>(`${this.api}/utilisateurs`, { params: { page } });
  }

  creerUtilisateur(data: unknown) {
    return this.http.post<User>(`${this.api}/utilisateurs`, data);
  }

  modifierUtilisateur(id: number, data: unknown) {
    return this.http.put<User>(`${this.api}/utilisateurs/${id}`, data);
  }

  basculerActif(id: number) {
    return this.http.patch<User>(`${this.api}/utilisateurs/${id}/toggle-actif`, {});
  }

  supprimerUtilisateur(id: number) {
    return this.http.delete<{ message: string }>(`${this.api}/utilisateurs/${id}`);
  }
}
