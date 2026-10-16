import { ModePaiement, Role, StatutCommande, StatutLivraison, StatutPaiement } from './models';

export const STATUT_COMMANDE: Record<StatutCommande, string> = {
  en_attente: 'En attente',
  validee: 'Validée',
  en_production: 'En production',
  prete: 'Prête',
  en_livraison: 'En livraison',
  livree: 'Livrée',
  annulee: 'Annulée',
};

export const STATUT_PAIEMENT: Record<StatutPaiement, string> = {
  en_attente: 'En attente',
  valide: 'Validé',
  annule: 'Annulé',
};

export const STATUT_LIVRAISON: Record<StatutLivraison, string> = {
  en_attente: 'À démarrer',
  en_cours: 'En cours',
  livree: 'Livrée',
  echouee: 'Échouée',
};

export const MODES: { value: ModePaiement; label: string }[] = [
  { value: 'wave', label: 'Wave' },
  { value: 'orange_money', label: 'Orange Money' },
  { value: 'carte', label: 'Carte bancaire' },
  { value: 'especes', label: 'Espèces' },
];

export const MODE_LABEL: Record<string, string> = {
  wave: 'Wave',
  orange_money: 'Orange Money',
  carte: 'Carte bancaire',
  especes: 'Espèces',
};

export const ROLE_LABEL: Record<Role, string> = {
  client: 'Client',
  gestionnaire: 'Gestionnaire',
  artisan: 'Artisan',
  livreur: 'Livreur',
  admin: 'Administrateur',
};

/** Étapes affichées dans la frise d'une commande. */
export const ETAPES_COMMANDE: StatutCommande[] = [
  'en_attente', 'validee', 'en_production', 'prete', 'en_livraison', 'livree',
];
