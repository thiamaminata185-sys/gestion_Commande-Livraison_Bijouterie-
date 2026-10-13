<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Commande;
use App\Models\Panier;
use App\Models\User;
use App\Services\CommandeService;
use Illuminate\Http\Request;

class CommandeController extends Controller
{
    public function __construct(private CommandeService $service) {}

    public function index(Request $request)
    {
        $user  = $request->user();
        $query = Commande::with(['client', 'lignes.bijou', 'paiement', 'livraison']);

        if ($user->role === 'client') {
            $query->where('idClient', $user->id);
        } elseif ($user->role === 'livreur') {
            $query->whereHas('livraison', fn($q) => $q->where('idLivreur', $user->id));
        }

        if ($request->filled('statut')) {
            $query->where('statutCommande', $request->statut);
        }

        return $query->latest()->paginate(15);
    }

    public function mesCommandes(Request $request)
    {
        return Commande::with(['lignes.bijou', 'paiement', 'facture', 'livraison'])
            ->where('idClient', $request->user()->id)
            ->latest()
            ->paginate(10);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'adresseLivraison'     => 'required|string',
            'lignes'               => 'nullable|array|min:1', // absent = on prend le panier
            'lignes.*.idBijou'     => 'required|exists:bijoux,idBijou',
            'lignes.*.quantite'    => 'required|integer|min:1',
        ]);

        $user         = $request->user();
        $depuisPanier = empty($data['lignes']);

        if ($depuisPanier) {
            $articles = Panier::where('idClient', $user->id)->get();
            if ($articles->isEmpty()) {
                return response()->json(['message' => 'Votre panier est vide'], 422);
            }
            $data['lignes'] = $articles
                ->map(fn ($p) => ['idBijou' => $p->idBijou, 'quantite' => $p->quantite])
                ->all();
        }

        try {
            $commande = $this->service->creer($user, $data);

            if ($depuisPanier) {
                Panier::where('idClient', $user->id)->delete(); // panier vidé une fois commandé
            }

            return response()->json($commande, 201);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function show(Request $request, Commande $commande)
    {
        $this->verifierAcces($request->user(), $commande);

        return $commande->load([
            'client', 'gestionnaire', 'lignes.bijou',
            'paiement', 'facture', 'livraison.livreur'
        ]);
    }

    public function updateStatut(Request $request, Commande $commande)
    {
        $data = $request->validate([
            'statutCommande' => 'required|in:validee,en_production,prete,en_livraison,livree,annulee'
        ]);

        $user    = $request->user();
        $nouveau = $data['statutCommande'];

        // Un artisan ne peut ni annuler ni livrer : on vérifie AVANT de déléguer l'annulation.
        if ($user->role === 'artisan' && !in_array($nouveau, ['en_production', 'prete'], true)) {
            return response()->json(['message' => 'Un artisan ne peut que lancer la production ou marquer la commande prête'], 403);
        }

        // L'annulation passe par le service : elle remet le stock.
        if ($nouveau === 'annulee') {
            return $this->annuler($request, $commande);
        }

        if (!$commande->peutPasserA($nouveau)) {
            return response()->json([
                'message' => "Transition interdite : {$commande->statutCommande} → {$nouveau}"
            ], 422);
        }

        $maj = ['statutCommande' => $nouveau];
        if ($nouveau === 'validee' && $user->role === 'gestionnaire') {
            $maj['idGestionnaire'] = $user->id;
        }
        $commande->update($maj);

        return $commande->fresh();
    }

    public function annuler(Request $request, Commande $commande)
    {
        $user = $request->user();

        if ($user->role === 'client') {
            if ((int) $commande->idClient !== (int) $user->id) {
                return response()->json(['message' => 'Cette commande ne vous appartient pas'], 403);
            }
            if ($commande->statutCommande !== 'en_attente') {
                return response()->json(['message' => 'Une commande déjà validée ne peut plus être annulée par le client'], 422);
            }
        }

        try {
            return $this->service->annuler($commande);
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /** Un client ne voit que ses commandes, un livreur que les siennes ; le personnel voit tout. */
    private function verifierAcces(User $user, Commande $commande): void
    {
        if ($user->role === 'client' && (int) $commande->idClient !== (int) $user->id) {
            abort(403, 'Cette commande ne vous appartient pas');
        }

        if ($user->role === 'livreur') {
            $livraison = $commande->livraison;
            if (!$livraison || (int) $livraison->idLivreur !== (int) $user->id) {
                abort(403, 'Cette commande ne vous est pas assignée');
            }
        }
    }
}
