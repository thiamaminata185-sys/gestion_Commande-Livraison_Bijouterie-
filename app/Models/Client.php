<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;

class Client extends User
{
    protected $table = 'users';

    protected static function booted(): void
    {
        static::addGlobalScope('role', fn(Builder $q) => $q->where('role', 'client'));
        static::creating(fn($m) => $m->role = 'client');
    }

    public function favoris()
    {
        return $this->hasMany(Favori::class, 'idClient');
    }

    public function consulterCatalogue()       { return Bijou::with('categorie')->get(); }
    public function voirDetailsProduit($id)    { return Bijou::with('categorie')->findOrFail($id); }
    public function rechercherProduit($q)      { return Bijou::where('nomBijou','LIKE',"%$q%")->get(); }
    public function ajouterFavori($idBijou)    { return $this->favoris()->create(['idBijou'=>$idBijou,'date'=>now()]); }
    public function supprimerFavori($idFavori) { return Favori::where('idFavori',$idFavori)->where('idClient',$this->id)->delete(); }
}