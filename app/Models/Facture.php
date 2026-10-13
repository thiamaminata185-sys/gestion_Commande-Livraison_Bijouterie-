<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Barryvdh\DomPDF\Facade\Pdf;

class Facture extends Model
{
    /** Taux de TVA (18 % au Sénégal). Les prix des bijoux sont des prix TTC. */
    public const TAUX_TVA = 0.18;

    protected $table = 'factures';
    protected $primaryKey = 'id';

    protected $fillable = [
        'idCommande','numero','montantHT','tva',
        'montantTTC','date','pdfPath'
    ];

    protected $casts = [
        'date'        => 'datetime',
        'montantHT'   => 'decimal:2',
        'tva'         => 'decimal:2',
        'montantTTC'  => 'decimal:2',
    ];

    public function commande()
    {
        return $this->belongsTo(Commande::class, 'idCommande');
    }

    public static function genererPour(Paiement $paiement): self
    {
        $commande = $paiement->commande;
        // montantTotal = ce que le client paie = TTC. On en déduit le HT et la TVA (FCFA : sans décimales).
        $ttc = round((float) $commande->montantTotal);
        $ht  = round($ttc / (1 + self::TAUX_TVA));
        $tva = $ttc - $ht;

        $facture = self::create([
            'idCommande' => $commande->idCommande,
            'numero'     => 'FAC-' . now()->format('Ymd') . '-' .
                            str_pad($commande->idCommande, 4, '0', STR_PAD_LEFT),
            'montantHT'  => $ht,
            'tva'        => $tva,
            'montantTTC' => $ttc,
            'date'       => now(),
        ]);

        $facture->genererFacture();
        return $facture;
    }

    public function genererFacture()
    {
        $pdf  = Pdf::loadView('factures.modele', ['facture' => $this]);
        $path = "factures/{$this->numero}.pdf";
        Storage::disk('public')->put($path, $pdf->output());
        $this->update(['pdfPath' => $path]);
    }

    public function telechargerFacture()
    {
        // Si le PDF n'a jamais été créé (ou a été supprimé), on le régénère.
        if (!$this->pdfPath || !Storage::disk('public')->exists($this->pdfPath)) {
            $this->genererFacture();
        }

        return Storage::disk('public')->download($this->pdfPath);
    }
}