<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Commande;
use App\Models\Paiement;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PaiementController extends Controller
{
    public function store(Request $request, Commande $commande)
    {
        if ((int) $commande->idClient !== (int) $request->user()->id) {
            return response()->json(['message' => 'Cette commande ne vous appartient pas'], 403);
        }

        if ($commande->statutCommande !== 'en_attente') {
            return response()->json(['message' => 'Cette commande ne peut plus être payée'], 422);
        }

        // Le montant n'est plus envoyé par le client : il vient de la commande.
        $data = $request->validate([
            'mode' => 'required|in:orange_money,wave,carte,especes',
        ]);

        $existant = $commande->paiement;
        if ($existant && $existant->statut !== 'annule') {
            return response()->json(['message' => 'Paiement déjà enregistré'], 409);
        }

        $attributs = [
            'montant'              => $commande->montantTotal,
            'mode'                 => $data['mode'],
            'statut'               => 'en_attente',
            'referenceTransaction' => 'TX-' . strtoupper(Str::random(10)),
        ];

        // Un paiement annulé peut être refait (idCommande est unique dans la table).
        if ($existant) {
            $existant->update($attributs);
            $paiement = $existant->fresh();
        } else {
            $paiement = $commande->paiement()->create($attributs);
        }

        return response()->json($paiement, 201);
    }

    public function valider(Request $request, Paiement $paiement)
    {
        if ($paiement->statut !== 'en_attente') {
            return response()->json(['message' => "Paiement déjà {$paiement->statut}"], 422);
        }

        try {
            $paiement->validerPaiement();
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'paiement' => $paiement->fresh(),
            'facture'  => $paiement->commande->facture,
        ]);
    }

    public function annuler(Paiement $paiement)
    {
        if ($paiement->statut !== 'en_attente') {
            return response()->json(['message' => "Paiement déjà {$paiement->statut}"], 422);
        }

        $paiement->annulerPaiement();
        return $paiement->fresh();
    }
}
