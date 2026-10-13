<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bijou;
use App\Models\Favori;
use Illuminate\Http\Request;

class FavoriController extends Controller
{
    public function index(Request $request)
    {
        return Favori::with('bijou.categorie')
            ->where('idClient', $request->user()->id)
            ->latest()
            ->get();
    }

    public function store(Request $request, $idBijou)
    {
        $bijou = Bijou::findOrFail($idBijou); // 404 propre si le bijou n'existe pas

        $favori = Favori::firstOrCreate(
            ['idClient' => $request->user()->id, 'idBijou' => $bijou->idBijou],
            ['date' => now()]
        );
        return response()->json($favori, $favori->wasRecentlyCreated ? 201 : 200);
    }

    public function destroy(Request $request, $idBijou)
    {
        Favori::where('idClient', $request->user()->id)
              ->where('idBijou', $idBijou)
              ->delete();
        return response()->json(['message' => 'Favori supprimé']);
    }
}