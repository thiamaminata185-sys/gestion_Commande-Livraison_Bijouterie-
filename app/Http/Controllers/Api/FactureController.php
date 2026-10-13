<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Facture;
use Illuminate\Http\Request;

class FactureController extends Controller
{
    public function index()
    {
        return Facture::with('commande.client')->latest()->paginate(20);
    }

    public function show(Facture $facture)
    {
        return $facture->load('commande.client', 'commande.lignes.bijou');
    }

    public function telecharger(Facture $facture)
    {
        return $facture->telechargerFacture();
    }

    /** Route client : uniquement pour une facture de SA commande. */
    public function telechargerMaFacture(Request $request, Facture $facture)
    {
        if ((int) $facture->commande->idClient !== (int) $request->user()->id) {
            return response()->json(['message' => 'Cette facture ne vous appartient pas'], 403);
        }

        return $facture->telechargerFacture();
    }
}
