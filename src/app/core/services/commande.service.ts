import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  Commande, Facture, Livraison, Livreur, ModePaiement, Paginated, Paiement, StatutLivraison,
} from '../models';

@Injectable({ providedIn: 'root' })
export class CommandeService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  // ---- Commandes ----
  /** Liste : le client voit les siennes, le personnel toutes. */
  liste(page = 1, statut = '') {
    let params = new HttpParams().set('page', page);
    if (statut) params = params.set('statut', statut);
    return this.http.get<Paginated<Commande>>(`${this.api}/commandes`, { params });
  }

  mesCommandes(page = 1) {
    return this.http.get<Paginated<Commande>>(`${this.api}/mes-commandes`, { params: { page } });
  }

  detail(id: number | string) {
    return this.http.get<Commande>(`${this.api}/commandes/${id}`);
  }

  /** Crée une commande à partir du panier du client. */
  creer(adresseLivraison: string) {
    return this.http.post<Commande>(`${this.api}/commandes`, { adresseLivraison });
  }

  annuler(id: number) {
    return this.http.patch<Commande>(`${this.api}/commandes/${id}/annuler`, {});
  }

  // ---- Paiement et factures ----
  payer(idCommande: number, mode: ModePaiement) {
    return this.http.post<Paiement>(`${this.api}/commandes/${idCommande}/paiement`, { mode });
  }

  validerPaiement(id: number) {
    return this.http.patch(`${this.api}/paiements/${id}/valider`, {});
  }

  annulerPaiement(id: number) {
    return this.http.patch(`${this.api}/paiements/${id}/annuler`, {});
  }

  factures(page = 1) {
    return this.http.get<Paginated<Facture>>(`${this.api}/factures`, { params: { page } });
  }

  /** PDF de la facture : route client (sa facture) ou route personnel. */
  telechargerFacture(id: number, estClient: boolean) {
    const url = estClient ? `${this.api}/mes-factures/${id}/telecharger` : `${this.api}/factures/${id}/telecharger`;
    return this.http.get(url, { responseType: 'blob' });
  }

  // ---- Artisan ----
  aPreparer() {
    return this.http.get<Commande[]>(`${this.api}/commandes-a-preparer`);
  }

  produire(id: number) {
    return this.http.patch<Commande>(`${this.api}/commandes/${id}/produire`, {});
  }

  marquerPrete(id: number) {
    return this.http.patch<Commande>(`${this.api}/commandes/${id}/prete`, {});
  }

  // ---- Livraisons ----
  livreurs() {
    return this.http.get<Livreur[]>(`${this.api}/livreurs`);
  }

  affecterLivreur(idCommande: number, idLivreur: number, adresseLivraison?: string) {
    return this.http.post<Livraison>(`${this.api}/commandes/${idCommande}/livraison`, {
      idLivreur,
      ...(adresseLivraison ? { adresseLivraison } : {}),
    });
  }

  livraisons(page = 1) {
    return this.http.get<Paginated<Livraison>>(`${this.api}/livraisons`, { params: { page } });
  }

  mesLivraisons() {
    return this.http.get<Livraison[]>(`${this.api}/mes-livraisons`);
  }

  changerStatutLivraison(id: number, statutLivraison: StatutLivraison) {
    return this.http.patch<Livraison>(`${this.api}/livraisons/${id}/statut`, { statutLivraison });
  }
}
