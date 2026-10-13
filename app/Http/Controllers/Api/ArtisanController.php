<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Commande;
use App\Models\Notification;
use Illuminate\Http\Request;

class ArtisanController extends Controller
{
    public function commandes(Request $request)
    {
        return Commande::with(['client', 'lignes.bijou'])
            ->whereIn('statutCommande', ['validee', 'en_production'])
            ->latest()
            ->get();
    }

    public function demarrerProduction(Commande $commande)
    {
        if (!$commande->peutPasserA('en_production')) {
            return response()->json([
                'message' => "Impossible de lancer la production : commande « {$commande->statutCommande} »"
            ], 422);
        }

        $commande->update(['statutCommande' => 'en_production']);
        return $commande->fresh();
    }

    public function validerDisponibilite(Commande $commande)
    {
        if (!$commande->peutPasserA('prete')) {
            return response()->json([
                'message' => "Impossible de marquer prête : commande « {$commande->statutCommande} »"
            ], 422);
        }

        $commande->update(['statutCommande' => 'prete']);

        // Prévenir le personnel qu'il peut affecter un livreur.
        try {
            Notification::envoyerAuxRoles(
                ['gestionnaire', 'admin'],
                'Commande prête',
                "La commande #{$commande->idCommande} est prête : vous pouvez affecter un livreur."
            );
        } catch (\Throwable $e) {
            report($e);
        }

        return $commande->fresh();
    }
}
