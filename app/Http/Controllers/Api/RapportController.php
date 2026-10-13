<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Commande;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RapportController extends Controller
{
    public function generer(Request $request, string $type)
    {
        $query = Commande::query();

        match ($type) {
            'journalier'    => $query->whereDate('dateCommande', today()),
            'hebdomadaire'  => $query->whereBetween('dateCommande', [now()->startOfWeek(), now()->endOfWeek()]),
            'mensuel'       => $query->whereMonth('dateCommande', now()->month)
                                     ->whereYear('dateCommande', now()->year),
            default         => abort(400, 'Type de rapport invalide'),
        };

        return response()->json([
            'type'             => $type,
            'periode'          => now()->toDateString(),
            'nombre_commandes' => $query->count(),
            // le CA ne compte que les commandes réellement vendues (pas en_attente / annulee)
            'chiffre_affaires' => (clone $query)->whereIn('statutCommande', Commande::STATUTS_VENDUS)->sum('montantTotal'),
            'commandes'        => $query->with('client')->get(),
        ]);
    }
}