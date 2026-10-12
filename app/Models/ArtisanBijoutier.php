<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;

class ArtisanBijoutier extends User
{
    protected $table = 'users';

    protected static function booted(): void
    {
        static::addGlobalScope('role', fn(Builder $q) => $q->where('role', 'artisan'));
        static::creating(fn($m) => $m->role = 'artisan');
    }

    public function bijoux()
    {
        return $this->hasMany(Bijou::class, 'idArtisan');
    }

    public function consulterCommandes()
    {
        return Commande::where('statutCommande', 'en_production')
                       ->with('lignes.bijou')
                       ->get();
    }

    public function validerDisponibilite($idCommande)
    {
        return Commande::findOrFail($idCommande)->update(['statutCommande' => 'prete']);
    }
}