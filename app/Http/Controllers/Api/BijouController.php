<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bijou;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class BijouController extends Controller
{
    public function index(Request $request)
    {
        $query = Bijou::with('categorie');

        if ($request->filled('search')) {
            // LIKE est sensible à la casse sous PostgreSQL : on compare en minuscules
            $col = DB::getQueryGrammar()->wrap('nomBijou');
            $query->whereRaw("LOWER($col) LIKE ?", ['%' . mb_strtolower($request->search) . '%']);
        }
        if ($request->filled('idCategorie')) {
            $query->where('idCategorie', $request->idCategorie);
        }
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }
        if ($request->filled('prixMin')) {
            $query->where('prix', '>=', $request->prixMin);
        }
        if ($request->filled('prixMax')) {
            $query->where('prix', '<=', $request->prixMax);
        }

        return $query->latest()->paginate(12);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'idCategorie'      => 'required|exists:categories,idCategorie',
            'idArtisan'        => ['nullable', Rule::exists('users', 'id')->where('role', 'artisan')],
            'nomBijou'         => 'required|string|max:200',
            'descriptionBijou' => 'nullable|string',
            'type'             => 'nullable|string',
            'prix'             => 'required|numeric|min:0',
            'prixDorigine'     => 'nullable|numeric|min:0',
            'quantiteStock'    => 'required|integer|min:0',
            'image'            => 'nullable|string',
            'images'           => 'nullable|array',
            'etiquette'        => 'nullable|array',
        ]);

        $data['idGestionnaire'] = $request->user()->id;

        return response()->json(Bijou::create($data), 201);
    }

    public function show(Bijou $bijou)
    {
        return $bijou->load(['categorie', 'artisan', 'gestionnaire']);
    }

    public function update(Request $request, Bijou $bijou)
    {
        $data = $request->validate([
            'idCategorie'      => 'sometimes|exists:categories,idCategorie',
            'idArtisan'        => ['nullable', Rule::exists('users', 'id')->where('role', 'artisan')],
            'nomBijou'         => 'sometimes|string|max:200',
            'descriptionBijou' => 'nullable|string',
            'type'             => 'nullable|string',
            'prix'             => 'sometimes|numeric|min:0',
            'prixDorigine'     => 'nullable|numeric|min:0',
            'quantiteStock'    => 'sometimes|integer|min:0',
            'image'            => 'nullable|string',
            'images'           => 'nullable|array',
            'etiquette'        => 'nullable|array',
        ]);

        $bijou->update($data);
        return $bijou->fresh();
    }

    public function destroy(Bijou $bijou)
    {
        if ($bijou->lignesCommandes()->exists()) {
            return response()->json([
                'message' => 'Ce bijou figure dans des commandes : mettez son stock à 0 plutôt que de le supprimer'
            ], 409);
        }

        $bijou->delete();
        return response()->json(['message' => 'Bijou supprimé']);
    }
}