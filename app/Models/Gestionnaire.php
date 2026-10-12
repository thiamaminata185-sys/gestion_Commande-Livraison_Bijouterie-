<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;

class Gestionnaire extends User
{
    protected $table = 'users';

    protected static function booted(): void
    {
        static::addGlobalScope('role', fn(Builder $q) => $q->where('role', 'gestionnaire'));
        static::creating(fn($m) => $m->role = 'gestionnaire');
    }

    public function bijouxGeres()
    {
        return $this->hasMany(Bijou::class, 'idGestionnaire');
    }
    public function commandesEnregistrees()
    {
        return $this->hasMany(Commande::class, 'idGestionnaire');
    }

    public function gererProduits()         { return Bijou::all(); }
    public function consulterStock()        { return Bijou::select('idBijou','nomBijou','quantiteStock')->get(); }
    public function validerCommande($id)    { return Commande::findOrFail($id)->update(['statutCommande'=>'validee']); }
}