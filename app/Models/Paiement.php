<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Paiement extends Model
{
    protected $table = 'paiements';
    protected $primaryKey = 'id';

    protected $fillable = [
        'idCommande','montant','mode','datePaiement',
        'referenceTransaction','statut'
    ];

    protected $casts = [
        'datePaiement' => 'datetime',
        'montant'      => 'decimal:2',
    ];

    public function commande()
    {
        return $this->belongsTo(Commande::class, 'idCommande');
    }

    public function validerPaiement()
    {
        $commande = $this->commande;

        if (!$commande->peutPasserA('validee')) {
            throw new \DomainException(
                "Impossible de valider ce paiement : la commande est « {$commande->statutCommande} »."
            );
        }

        // Tout ou rien : paiement validé + commande validée + facture créée ensemble.
        DB::transaction(function () use ($commande) {
            $this->update(['statut' => 'valide', 'datePaiement' => now()]);
            $commande->validerCommande();
            Facture::genererPour($this);
        });

        try {
            Notification::envoyer(
                $commande->idClient,
                'Paiement confirmé',
                "Votre paiement pour la commande #{$commande->idCommande} est confirmé. Votre facture est disponible."
            );
        } catch (\Throwable $e) {
            report($e);
        }

        return $this;
    }

    public function annulerPaiement()
    {
        return $this->update(['statut' => 'annule']);
    }
}
