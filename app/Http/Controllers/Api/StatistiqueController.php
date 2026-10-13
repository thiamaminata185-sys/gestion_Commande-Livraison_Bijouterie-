<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Commande;
use App\Models\User;
use App\Models\Bijou;
use Illuminate\Support\Facades\DB;

class StatistiqueController extends Controller
{
    public function index()
    {
        // PostgreSQL met en minuscules les noms non guillemetés : on laisse Laravel les guillemeter.
        $g       = DB::getQueryGrammar();
        $dateCol = $g->wrap('dateCommande');
        $montCol = $g->wrap('montantTotal');

        return response()->json([
            'commandes_total'      => Commande::count(),
            'commandes_en_cours'   => Commande::whereNotIn('statutCommande',['livree','annulee'])->count(),
            'chiffre_affaires'     => Commande::whereIn('statutCommande', Commande::STATUTS_VENDUS)->sum('montantTotal'),
            'clients_total'        => User::where('role','client')->count(),
            'bijoux_total'         => Bijou::count(),
            'stock_total'          => Bijou::sum('quantiteStock'),
            'alertes_stock'        => Bijou::where('quantiteStock', '<', 5)->get(['idBijou','nomBijou','quantiteStock']),
            'ventes_par_jour'      => Commande::select(
                DB::raw("DATE($dateCol) as date"),
                DB::raw('COUNT(*) as total'),
                DB::raw("SUM($montCol) as montant")
            )->whereIn('statutCommande', Commande::STATUTS_VENDUS)
             ->groupBy(DB::raw("DATE($dateCol)"))
             ->orderByDesc('date')->limit(30)->get(),
        ]);
    }
}