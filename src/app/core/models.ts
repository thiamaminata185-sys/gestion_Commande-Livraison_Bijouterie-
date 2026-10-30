export type Role = 'client' | 'gestionnaire' | 'artisan' | 'livreur' | 'admin';

export interface User {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  telephone?: string | null;
  adresse?: string | null;
  image?: string | null;
  role: Role;
  actif: boolean;
}

export interface Paginated<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export interface Categorie {
  idCategorie: number;
  nomCategorie: string;
  descriptionCategorie?: string | null;
  bijoux_count?: number;
}

export interface Bijou {
  idBijou: number;
  idCategorie: number;
  nomBijou: string;
  descriptionBijou?: string | null;
  type?: string | null;
  prix: string | number;
  prixDorigine?: string | number | null;
  quantiteStock: number;
  image?: string | null;
  images?: string[] | null;
  etiquette?: string[] | null;
  categorie?: Categorie;
}

export interface Favori {
  idFavori: number;
  idBijou: number;
  bijou: Bijou;
}

export interface LignePanier {
  idBijou: number;
  nomBijou: string;
  image?: string | null;
  prixUnitaire: string | number;
  quantite: number;
  stockDisponible: number;
  sousTotal: number;
}

export interface Panier {
  lignes: LignePanier[];
  nombre_articles: number;
  total: number;
}

export type StatutCommande =
  | 'en_attente' | 'validee' | 'en_production' | 'prete' | 'en_livraison' | 'livree' | 'annulee';
export type StatutPaiement = 'en_attente' | 'valide' | 'annule';
export type StatutLivraison = 'en_attente' | 'en_cours' | 'livree' | 'echouee';
export type ModePaiement = 'orange_money' | 'wave' | 'carte' | 'especes';

export interface LigneCommande {
  id: number;
  idBijou: number;
  quantite: number;
  prixUnitaire: string | number;
  sousTotal: string | number;
  bijou?: Bijou;
}

export interface Paiement {
  id: number;
  idCommande: number;
  montant: string | number;
  mode: ModePaiement;
  statut: StatutPaiement;
  datePaiement?: string | null;
  referenceTransaction?: string | null;
  fournisseur?: string | null;
  urlPaiement?: string | null;
}

export interface Facture {
  id: number;
  idCommande: number;
  numero: string;
  montantHT: string | number;
  tva: string | number;
  montantTTC: string | number;
  date: string;
  commande?: Commande;
}

export interface Livraison {
  idLivraison: number;
  idCommande: number;
  idLivreur: number;
  dateLivraison?: string | null;
  statutLivraison: StatutLivraison;
  adresseLivraison: string;
  livreur?: User;
  commande?: Commande;
}

export interface Commande {
  idCommande: number;
  idClient: number;
  statutCommande: StatutCommande;
  dateCommande: string;
  montantTotal: string | number;
  adresseLivraison?: string | null;
  client?: User;
  lignes?: LigneCommande[];
  paiement?: Paiement | null;
  facture?: Facture | null;
  livraison?: Livraison | null;
}

export interface NotificationItem {
  idNotification: number;
  titre: string;
  message: string;
  lu: boolean;
  created_at: string;
}

export interface Livreur {
  id: number;
  prenom: string;
  nom: string;
  telephone?: string | null;
}

export interface Statistiques {
  commandes_total: number;
  commandes_en_cours: number;
  chiffre_affaires: number | string;
  clients_total: number;
  bijoux_total: number;
  stock_total: number | string;
  alertes_stock: { idBijou: number; nomBijou: string; quantiteStock: number }[];
  ventes_par_jour: { date: string; total: number; montant: number | string }[];
}

export interface Rapport {
  type: string;
  periode: string;
  nombre_commandes: number;
  chiffre_affaires: number | string;
  commandes: Commande[];
}
