<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Categorie;
use Illuminate\Http\Request;

class CategorieController extends Controller
{
    public function index()
    {
        return Categorie::withCount('bijoux')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nomCategorie'         => 'required|string|max:100',
            'descriptionCategorie' => 'nullable|string',
        ]);
        return response()->json(Categorie::create($data), 201);
    }

    public function show(Categorie $categorie)
    {
        return $categorie->load('bijoux');
    }

    public function update(Request $request, Categorie $categorie)
    {
        $data = $request->validate([
            'nomCategorie'         => 'sometimes|string|max:100',
            'descriptionCategorie' => 'nullable|string',
        ]);
        $categorie->update($data);
        return $categorie->fresh();
    }

    public function destroy(Categorie $categorie)
    {
        if ($categorie->bijoux()->exists()) {
            return response()->json(['message' => 'Cette catégorie contient encore des bijoux'], 409);
        }

        $categorie->delete();
        return response()->json(['message' => 'Catégorie supprimée']);
    }
}