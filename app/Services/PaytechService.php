<?php

namespace App\Services;

use App\Models\Commande;
use App\Models\Paiement;
use Illuminate\Support\Facades\Http;

/** Dialogue avec l'API PayTech (paiement par redirection : Wave, Orange Money, carte bancaire). */
class PaytechService
{
    /** Mode de paiement de l'application => nom attendu par PayTech (paramètre target_payment). */
    private const CIBLES = [
        'wave'         => 'Wave',
        'orange_money' => 'Orange Money',
        'carte'        => 'Carte Bancaire',
    ];

    /** Le paiement en ligne n'est proposé que si les clés PayTech sont renseignées. */
    public function estActif(): bool
    {
        return filled(config('paytech.api_key')) && filled(config('paytech.api_secret'));
    }

    /**
     * Demande à PayTech une page de paiement pour ce paiement.
     * Renvoie ['token' => ..., 'url' => ...] ; lève une exception en cas d'échec.
     */
    public function creerPaiement(Paiement $paiement, Commande $commande, string $mode): array
    {
        $apiUrl = rtrim((string) config('app.url'), '/');
        if (!str_starts_with($apiUrl, 'https://')) {
            // PayTech n'accepte que des adresses de notification (IPN) en HTTPS
            throw new \RuntimeException("Le paiement en ligne nécessite une API en HTTPS : vérifiez APP_URL.");
        }

        $front = config('paytech.frontend_url');
        $id    = $commande->idCommande;

        $reponse = Http::withHeaders([
                'API_KEY'    => config('paytech.api_key'),
                'API_SECRET' => config('paytech.api_secret'),
            ])
            ->acceptJson()
            ->asJson()
            ->timeout(20)
            ->post(rtrim(config('paytech.base_url'), '/') . '/payment/request-payment', [
                'item_name'      => "Commande n°{$id} - Étoile d'Or",
                'item_price'     => (int) round((float) $paiement->montant),
                'currency'       => 'XOF',
                'ref_command'    => $paiement->referenceTransaction,
                'command_name'   => "Paiement de la commande n°{$id}",
                'env'            => config('paytech.env'),
                'target_payment' => self::CIBLES[$mode] ?? '',
                'ipn_url'        => $apiUrl . '/api/paiements/ipn/paytech',
                'success_url'    => "{$front}/commandes/{$id}?paiement=retour",
                'cancel_url'     => "{$front}/commandes/{$id}?paiement=annule",
                'custom_field'   => json_encode(['idCommande' => $id, 'idPaiement' => $paiement->id]),
            ]);

        $json = $reponse->json();

        if (!$reponse->successful() || (int) ($json['success'] ?? 0) !== 1) {
            throw new \RuntimeException($json['message'] ?? 'Réponse invalide de PayTech (code ' . $reponse->status() . ')');
        }

        return [
            'token' => $json['token'] ?? null,
            'url'   => $json['redirect_url'] ?? $json['redirectUrl'] ?? null,
        ];
    }

    /**
     * Vérifie qu'une notification (IPN) vient bien de PayTech.
     * Méthode recommandée : signature HMAC-SHA256 ; sinon comparaison des clés hachées en SHA256.
     */
    public function ipnValide(array $d): bool
    {
        return self::signatureValide($d, (string) config('paytech.api_key'), (string) config('paytech.api_secret'));
    }

    public static function signatureValide(array $d, string $cle, string $secret): bool
    {
        if ($cle === '' || $secret === '') {
            return false;
        }

        if (!empty($d['hmac_compute'])) {
            $prix     = (string) ($d['final_item_price'] ?? $d['item_price'] ?? '');
            $attendu  = hash_hmac('sha256', $prix . '|' . ($d['ref_command'] ?? '') . '|' . $cle, $secret);
            return hash_equals($attendu, (string) $d['hmac_compute']);
        }

        return hash_equals(hash('sha256', $cle), (string) ($d['api_key_sha256'] ?? ''))
            && hash_equals(hash('sha256', $secret), (string) ($d['api_secret_sha256'] ?? ''));
    }

    /** « Orange Money » (libellé PayTech) => « orange_money » (mode de l'application). */
    public function modeDepuisLibelle(?string $libelle, string $defaut): string
    {
        $l = mb_strtolower((string) $libelle);
        return match (true) {
            str_contains($l, 'wave')   => 'wave',
            str_contains($l, 'orange') => 'orange_money',
            str_contains($l, 'carte')  => 'carte',
            default                    => $defaut,
        };
    }
}
