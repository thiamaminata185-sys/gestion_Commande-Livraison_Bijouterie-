<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Paiement;
use App\Services\PaytechService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Adresse appelée PAR PAYTECH (pas par le navigateur) quand un paiement est terminé ou annulé.
 * Route publique : la sécurité repose sur la vérification de la signature.
 */
class PaytechIpnController extends Controller
{
    public function recevoir(Request $request, PaytechService $paytech)
    {
        $d = $request->all();

        if (!$paytech->estActif() || !$paytech->ipnValide($d)) {
            Log::warning('IPN PayTech refusée : signature invalide', ['ref' => $d['ref_command'] ?? null]);
            return response('IPN KO', 403);
        }

        $paiement = Paiement::where('referenceTransaction', $d['ref_command'] ?? '')->first();
        if (!$paiement) {
            Log::warning('IPN PayTech : paiement inconnu', ['ref' => $d['ref_command'] ?? null]);
            return response('IPN IGNORED', 200); // 200 : inutile que PayTech réessaie
        }

        $type = $d['type_event'] ?? '';

        if ($type === 'sale_complete') {
            return $this->paiementReussi($paiement, $d, $paytech);
        }

        if ($type === 'sale_canceled' && $paiement->statut === 'en_attente') {
            $paiement->annulerPaiement();
        }

        return response('IPN OK', 200);
    }

    private function paiementReussi(Paiement $paiement, array $d, PaytechService $paytech)
    {
        // PayTech peut notifier plusieurs fois : on ne traite qu'une fois
        if ($paiement->statut === 'valide') {
            return response('IPN OK', 200);
        }

        // En production, le montant payé doit être celui de la commande
        // (en mode test, PayTech ne débite que 100 à 150 FCFA : on ne bloque pas)
        $recu = (float) ($d['final_item_price'] ?? $d['item_price'] ?? 0);
        if (config('paytech.env') === 'prod' && abs($recu - (float) $paiement->montant) > 0.5) {
            Log::error('IPN PayTech : montant inattendu', ['ref' => $paiement->referenceTransaction, 'recu' => $recu]);
            $this->alerterPersonnel($paiement, "montant reçu ({$recu} FCFA) différent du montant de la commande");
            return response('IPN KO montant', 400);
        }

        $paiement->update(['mode' => $paytech->modeDepuisLibelle($d['payment_method'] ?? null, $paiement->mode)]);

        try {
            $paiement->validerPaiement(); // valide la commande, crée la facture, prévient le client
        } catch (\DomainException $e) {
            // Exemple : la commande a été annulée pendant que le client payait
            $this->alerterPersonnel($paiement, $e->getMessage());
        }

        return response('IPN OK', 200);
    }

    private function alerterPersonnel(Paiement $paiement, string $raison): void
    {
        try {
            Notification::envoyerAuxRoles(
                ['gestionnaire', 'admin'],
                'Paiement en ligne à vérifier',
                "Paiement {$paiement->referenceTransaction} de commande n°{$paiement->idCommande} : {$raison}. "
                . 'À traiter manuellement (remboursement possible depuis le tableau de bord PayTech).'
            );
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
