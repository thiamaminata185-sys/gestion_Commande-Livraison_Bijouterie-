<?php

namespace App\Services;

use App\Models\Bijou;
use App\Models\Commande;
use App\Models\LigneCommande;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CommandeService
{
    /**
     * Crée une commande. Le paramètre est un User (c'est ce que renvoie $request->user()),
     * pas un Client : un User n'est pas une instance de la sous-classe Client.
     */
    public function creer(User $client, array $data): Commande
    {
        $commande = DB::transaction(function () use ($client, $data) {
            $commande = Commande::create([
                'idClient'         => $client->id,
                'statutCommande'   => 'en_attente',
                'dateCommande'     => now(),
                'adresseLivraison' => $data['adresseLivraison'],
                'montantTotal'     => 0,
            ]);

            $total = 0;

            foreach ($data['lignes'] as $l) {
                // lockForUpdate : évite que deux commandes simultanées vendent le même dernier bijou
                $bijou = Bijou::lockForUpdate()->findOrFail($l['idBijou']);

                // lève une Exception "Stock insuffisant ..." si besoin
                $bijou->diminuerStock($l['quantite']);

                $sousTotal = (float) $bijou->prix * $l['quantite'];

                LigneCommande::create([
                    'idCommande'   => $commande->idCommande,
                    'idBijou'      => $bijou->idBijou,
                    'quantite'     => $l['quantite'],
                    'prixUnitaire' => $bijou->prix,
                    'sousTotal'    => $sousTotal,
                ]);

                $total += $sousTotal;
            }

            $commande->update(['montantTotal' => $total]);

            return $commande;
        });

        // Hors transaction : un échec de notification ne doit pas faire croire que la commande a échoué.
        try {
            Notification::envoyerAuxRoles(
                ['gestionnaire', 'admin'],
                'Nouvelle commande',
                "Commande #{$commande->idCommande} reçue pour un montant de "
                    . number_format((float) $commande->montantTotal, 0, ',', ' ') . " FCFA."
            );
        } catch (\Throwable $e) {
            report($e);
        }

        return $commande->load('lignes.bijou');
    }

    /** Annule une commande et remet les quantités en stock. */
    public function annuler(Commande $commande): Commande
    {
        return DB::transaction(function () use ($commande) {
            $commande = Commande::lockForUpdate()->findOrFail($commande->idCommande);

            if (!$commande->peutPasserA('annulee')) {
                throw new \DomainException(
                    "Impossible d'annuler une commande au statut « {$commande->statutCommande} »."
                );
            }

            foreach ($commande->lignes()->with('bijou')->get() as $ligne) {
                $ligne->bijou->augmenterStock($ligne->quantite);
            }

            $commande->update(['statutCommande' => 'annulee']);

            if ($commande->paiement && $commande->paiement->statut === 'en_attente') {
                $commande->paiement->update(['statut' => 'annule']);
            }

            return $commande->fresh();
        });
    }
}
