<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Panier extends Model
{
    protected $table = 'paniers';
    protected $primaryKey = 'idPanier';

    protected $fillable = ['idClient', 'idBijou', 'quantite'];

    public function client()
    {
        return $this->belongsTo(Client::class, 'idClient');
    }

    public function bijou()
    {
        return $this->belongsTo(Bijou::class, 'idBijou');
    }
}
