<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bijou;
use App\Models\Panier;
use Illuminate\Http\Request;

class PanierController extends Controller
{
    /** Voir son panier. */
    public function index(Request $request)
    {
        return $this->contenu($request->user()->id);
    }

    /** Ajouter au panier (ajoute à la quantité si le bijou y est déjà). */
    public function store(Request $request)
    {
        $data = $request->validate([
            'idBijou'  => 'required|exists:bijoux,idBijou',
            'quantite' => 'nullable|integer|min:1',
        ]);

        $bijou = Bijou::findOrFail($data['idBijou']);
        $ligne = Panier::firstOrNew(['idClient' => $request->user()->id, 'idBijou' => $bijou->idBijou]);

        $nouvelle = ($ligne->exists ? $ligne->quantite : 0) + ($data['quantite'] ?? 1);

        if ($nouvelle > $bijou->quantiteStock) {
            return response()->json([
                'message' => "Stock insuffisant pour {$bijou->nomBijou} (disponible : {$bijou->quantiteStock})"
            ], 422);
        }

        $ligne->quantite = $nouvelle;
        $ligne->save();

        return response()->json($this->contenu($request->user()->id), 201);
    }

    /** Changer la quantité (augmenter ou diminuer). */
    public function update(Request $request, $idBijou)
    {
        $data = $request->validate(['quantite' => 'required|integer|min:1']);

        $ligne = Panier::with('bijou')
            ->where('idClient', $request->user()->id)
            ->where('idBijou', $idBijou)
            ->firstOrFail();

        if ($data['quantite'] > $ligne->bijou->quantiteStock) {
            return response()->json([
                'message' => "Stock insuffisant (disponible : {$ligne->bijou->quantiteStock})"
            ], 422);
        }

        $ligne->update(['quantite' => $data['quantite']]);

        return $this->contenu($request->user()->id);
    }

    /** Supprimer un produit du panier. */
    public function destroy(Request $request, $idBijou)
    {
        Panier::where('idClient', $request->user()->id)->where('idBijou', $idBijou)->delete();

        return $this->contenu($request->user()->id);
    }

    /** Vider tout le panier. */
    public function vider(Request $request)
    {
        Panier::where('idClient', $request->user()->id)->delete();

        return $this->contenu($request->user()->id);
    }

    private function contenu(int $idClient): array
    {
        $lignes = Panier::with('bijou')->where('idClient', $idClient)->get()->map(fn ($l) => [
            'idBijou'         => $l->idBijou,
            'nomBijou'        => $l->bijou->nomBijou,
            'image'           => $l->bijou->image,
            'prixUnitaire'    => $l->bijou->prix,
            'quantite'        => $l->quantite,
            'stockDisponible' => $l->bijou->quantiteStock,
            'sousTotal'       => (float) $l->bijou->prix * $l->quantite,
        ]);

        return [
            'lignes'          => $lignes,
            'nombre_articles' => $lignes->sum('quantite'),
            'total'           => $lignes->sum('sousTotal'),
        ];
    }
}
