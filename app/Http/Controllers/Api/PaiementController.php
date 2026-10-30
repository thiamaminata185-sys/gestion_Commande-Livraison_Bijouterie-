<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Commande;
use App\Models\Paiement;
use App\Services\PaytechService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PaiementController extends Controller
{
    /** Modes réglés en ligne (le mode « espèces » reste validé à la main par le gestionnaire). */
    private const MODES_EN_LIGNE = ['wave', 'orange_money', 'carte'];

    /** Le frontend demande si le paiement en ligne est disponible (clés PayTech configurées). */
    public function options(PaytechService $paytech)
    {
        return response()->json([
            'enLigne'     => $paytech->estActif(),
            'fournisseur' => 'PayTech',
            'modeTest'    => config('paytech.env') !== 'prod',
        ]);
    }

    public function store(Request $request, Commande $commande, PaytechService $paytech)
    {
        if ((int) $commande->idClient !== (int) $request->user()->id) {
            return response()->json(['message' => 'Cette commande ne vous appartient pas'], 403);
        }

        if ($commande->statutCommande !== 'en_attente') {
            return response()->json(['message' => 'Cette commande ne peut plus être payée'], 422);
        }

        // Le montant n'est jamais envoyé par le client : il vient de la commande.
        $data = $request->validate([
            'mode' => 'required|in:orange_money,wave,carte,especes',
        ]);

        $existant = $commande->paiement;

        // Un paiement en ligne est déjà en cours : on renvoie son lien pour le reprendre
        if ($existant && $existant->statut === 'en_attente' && $existant->urlPaiement) {
            return response()->json($existant, 200);
        }

        if ($existant && $existant->statut !== 'annule') {
            return response()->json(['message' => 'Paiement déjà enregistré'], 409);
        }

        $attributs = [
            'montant'              => $commande->montantTotal,
            'mode'                 => $data['mode'],
            'statut'               => 'en_attente',
            'referenceTransaction' => 'TX-' . strtoupper(Str::random(10)),
            'fournisseur'          => null,
            'jetonFournisseur'     => null,
            'urlPaiement'          => null,
        ];

        // Un paiement annulé peut être refait (idCommande est unique dans la table).
        if ($existant) {
            $existant->update($attributs);
            $paiement = $existant->fresh();
        } else {
            $paiement = $commande->paiement()->create($attributs);
        }

        // Paiement en ligne : on demande une page de paiement à PayTech
        if ($paytech->estActif() && in_array($data['mode'], self::MODES_EN_LIGNE, true)) {
            try {
                $lien = $paytech->creerPaiement($paiement, $commande, $data['mode']);
                $paiement->update([
                    'fournisseur'      => 'paytech',
                    'jetonFournisseur' => $lien['token'],
                    'urlPaiement'      => $lien['url'],
                ]);
            } catch (\Throwable $e) {
                report($e);
                $paiement->annulerPaiement();
                return response()->json([
                    'message' => 'Le paiement en ligne est momentanément indisponible. Réessayez dans quelques instants.',
                ], 502);
            }
        }

        return response()->json($paiement->fresh(), 201);
    }

    /** Le client abandonne un paiement en ligne commencé (pour en choisir un autre). */
    public function annulerLePaiement(Request $request, Commande $commande)
    {
        if ((int) $commande->idClient !== (int) $request->user()->id) {
            return response()->json(['message' => 'Cette commande ne vous appartient pas'], 403);
        }

        $paiement = $commande->paiement;
        if (!$paiement || $paiement->statut !== 'en_attente') {
            return response()->json(['message' => 'Aucun paiement en cours à annuler'], 422);
        }

        $paiement->annulerPaiement();
        return $paiement->fresh();
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
