<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class TeleversementController extends Controller
{
    /**
     * Téléverse UNE photo de bijou et renvoie son adresse.
     * Le frontend l'appelle pour chaque photo choisie, puis envoie les adresses
     * dans les champs « image » et « images » lors de la création / modification du bijou.
     */
    public function bijou(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpg,jpeg,png,webp|max:2048', // 2 Mo
        ]);

        $chemin = $request->file('image')->store('bijoux', 'public');

        return response()->json(['url' => '/storage/' . $chemin], 201);
    }
}
