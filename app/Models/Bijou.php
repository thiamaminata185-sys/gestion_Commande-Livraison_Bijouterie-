<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Bijou extends Model
{
    protected $table = 'bijoux';
    protected $primaryKey = 'idBijou';

    protected $fillable = [
        'idCategorie','idGestionnaire','idArtisan','nomBijou','descriptionBijou',
        'type','prix','prixDorigine','quantiteStock','image','images','etiquette'
    ];

    protected $casts = [
        'images'        => 'array',
        'etiquette'     => 'array',
        'prix'          => 'decimal:2',
        'prixDorigine'  => 'decimal:2',
    ];

    public function categorie()
    {
        return $this->belongsTo(Categorie::class, 'idCategorie');
    }

    public function gestionnaire()
    {
        return $this->belongsTo(Gestionnaire::class, 'idGestionnaire');
    }

    public function artisan()
    {
        return $this->belongsTo(ArtisanBijoutier::class, 'idArtisan');
    }

    public function lignesCommandes()
    {
        return $this->hasMany(LigneCommande::class, 'idBijou');
    }

    public function favoris()
    {
        return $this->hasMany(Favori::class, 'idBijou');
    }

    public function augmenterStock(int $q)
    {
        return $this->increment('quantiteStock', $q);
    }

    public function diminuerStock(int $q)
    {
        if ($this->quantiteStock < $q) {
            throw new \Exception("Stock insuffisant pour {$this->nomBijou}");
        }
        return $this->decrement('quantiteStock', $q);
    }
}