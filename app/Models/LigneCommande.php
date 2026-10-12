<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LigneCommande extends Model
{
    protected $table = 'ligne_commandes';
    protected $primaryKey = 'id';

    protected $fillable = ['idCommande','idBijou','quantite','prixUnitaire','sousTotal'];

    protected $casts = [
        'prixUnitaire' => 'decimal:2',
        'sousTotal'    => 'decimal:2',
    ];

    public function commande()
    {
        return $this->belongsTo(Commande::class, 'idCommande');
    }

    public function bijou()
    {
        return $this->belongsTo(Bijou::class, 'idBijou');
    }

    public function calculerSousTotal()
    {
        return $this->quantite * $this->prixUnitaire;
    }
}