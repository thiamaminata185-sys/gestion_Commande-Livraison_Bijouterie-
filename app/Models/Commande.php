<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Commande extends Model
{
    protected $table = 'commandes';
    protected $primaryKey = 'idCommande';

    protected $fillable = [
        'idClient','idGestionnaire','statutCommande','dateCommande',
        'montantTotal','adresseLivraison'
    ];

    protected $casts = [
        'dateCommande' => 'datetime',
        'montantTotal' => 'decimal:2',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class, 'idClient');
    }

    public function gestionnaire()
    {
        return $this->belongsTo(Gestionnaire::class, 'idGestionnaire');
    }

    public function lignes()
    {
        return $this->hasMany(LigneCommande::class, 'idCommande');
    }

    public function paiement()
    {
        return $this->hasOne(Paiement::class, 'idCommande');
    }

    public function facture()
    {
        return $this->hasOne(Facture::class, 'idCommande');
    }

    public function livraison()
    {
        return $this->hasOne(Livraison::class, 'idCommande');
    }

    public function annulerCommande()
    {
        return $this->update(['statutCommande' => 'annulee']);
    }

    public function validerCommande()
    {
        return $this->update(['statutCommande' => 'validee']);
    }
}