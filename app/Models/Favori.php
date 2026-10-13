<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Favori extends Model
{
    protected $table = 'favoris';
    protected $primaryKey = 'idFavori';

    protected $fillable = ['idClient','idBijou','date'];

    protected $casts = ['date' => 'datetime'];

    public function client()
    {
        return $this->belongsTo(Client::class, 'idClient');
    }

    public function bijou()
    {
        return $this->belongsTo(Bijou::class, 'idBijou');
    }

    public function ajouterFavori()   { return $this; }
    public function supprimerFavori() { return $this->delete(); }
}