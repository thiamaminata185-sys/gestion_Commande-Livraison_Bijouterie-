<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Commande;
use App\Models\Livraison;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class LivraisonController extends Controller
{
    /** Transitions autorisées pour le statut d'une livraison. */
    private const TRANSITIONS = [
        'en_attente' => ['en_cours'],
        'en_cours'   => ['livree', 'echouee'],
        'echouee'    => ['en_cours'],
        'livree'     => [],
    ];

    public function index()
    {
        return Livraison::with(['commande.client', 'livreur'])->latest()->paginate(20);
    }

    public function store(Request $request, Commande $commande)
    {
        $data = $request->validate([
            // l'utilisateur choisi doit être un livreur actif (pas n'importe quel user)
            'idLivreur'        => ['required', Rule::exists('users', 'id')->where('role', 'livreur')->where('actif', true)],
            'adresseLivraison' => 'nullable|string',
            'dateLivraison'    => 'nullable|date',
        ]);

        if ($commande->livraison) {
            return response()->json(['message' => 'Livraison déjà créée'], 409);
        }

        if ($commande->statutCommande !== 'prete') {
            return response()->json(['message' => 'La commande doit être prête avant d\'être livrée'], 422);
        }

        $adresse = $data['adresseLivraison'] ?? $commande->adresseLivraison;
        if (!$adresse) {
            return response()->json(['message' => 'Aucune adresse de livraison'], 422);
        }

        $livraison = DB::transaction(function () use ($commande, $data, $adresse) {
            $livraison = $commande->livraison()->create([
                'idLivreur'        => $data['idLivreur'],
                'adresseLivraison' => $adresse,
                'dateLivraison'    => $data['dateLivraison'] ?? null,
                'statutLivraison'  => 'en_attente',
            ]);
            $commande->update(['statutCommande' => 'en_livraison']);
            return $livraison;
        });

        $this->notifier($data['idLivreur'], 'Nouvelle livraison', "Commande #{$commande->idCommande} à livrer.");
        $this->notifier($commande->idClient, 'Commande en livraison', "Votre commande #{$commande->idCommande} a été confiée à un livreur.");

        return response()->json($livraison, 201);
    }

    public function mesLivraisons(Request $request)
    {
        return Livraison::with('commande.client')
            ->where('idLivreur', $request->user()->id)
            ->whereIn('statutLivraison', ['en_attente', 'en_cours'])
            ->latest()
            ->get();
    }

    public function updateStatut(Request $request, Livraison $livraison)
    {
        // Un livreur ne peut modifier que SES livraisons.
        if ((int) $livraison->idLivreur !== (int) $request->user()->id) {
            return response()->json(['message' => 'Cette livraison ne vous est pas assignée'], 403);
        }

        $data = $request->validate([
            'statutLivraison' => 'required|in:en_cours,livree,echouee',
        ]);

        $nouveau = $data['statutLivraison'];

        if (!in_array($nouveau, self::TRANSITIONS[$livraison->statutLivraison] ?? [], true)) {
            return response()->json([
                'message' => "Transition interdite : {$livraison->statutLivraison} → {$nouveau}"
            ], 422);
        }

        DB::transaction(fn () => $livraison->mettreAJourStatut($nouveau));

        $commande = $livraison->commande;
        if ($nouveau === 'livree') {
            $this->notifier($commande->idClient, 'Commande livrée', "Votre commande #{$commande->idCommande} a été livrée.");
        } elseif ($nouveau === 'echouee') {
            $this->notifier($commande->idClient, 'Livraison échouée', "La livraison de votre commande #{$commande->idCommande} a échoué, nous vous recontactons.");
        }

        return $livraison->fresh();
    }

    public function show(Livraison $livraison)
    {
        return $livraison->load(['commande.client', 'commande.lignes.bijou', 'livreur']);
    }

    /** Une notification ratée ne doit jamais faire échouer l'action principale. */
    private function notifier(int $idUtilisateur, string $titre, string $message): void
    {
        try {
            Notification::envoyer($idUtilisateur, $titre, $message);
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
