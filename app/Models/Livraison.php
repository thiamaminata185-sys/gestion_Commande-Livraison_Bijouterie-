<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Livraison extends Model
{
    protected $table = 'livraisons';
    protected $primaryKey = 'idLivraison';

    protected $fillable = [
        'idCommande','idLivreur','dateLivraison',
        'statutLivraison','adresseLivraison'
    ];

    protected $casts = [
        'dateLivraison' => 'datetime',
    ];

    public function commande()
    {
        return $this->belongsTo(Commande::class, 'idCommande');
    }

    public function livreur()
    {
        return $this->belongsTo(Livreur::class, 'idLivreur');
    }

    public function mettreAJourStatut(string $statut)
    {
        $this->update([
            'statutLivraison' => $statut,
            'dateLivraison'   => $statut === 'livree' ? now() : $this->dateLivraison,
        ]);

        if ($statut === 'livree') {
            $this->commande->update(['statutCommande' => 'livree']);
        }

        return $this;
    }
}