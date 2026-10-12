<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;

class Livreur extends User
{
    protected $table = 'users';

    protected static function booted(): void
    {
        static::addGlobalScope('role', fn(Builder $q) => $q->where('role', 'livreur'));
        static::creating(fn($m) => $m->role = 'livreur');
    }
    public function consulterLivraison()
    {
        return $this->livraisons()->with('commande.client')->get();
    }

    public function mettreAJourStatutCom($id, $statut)
    {
        return Livraison::findOrFail($id)->mettreAJourStatut($statut);
    }

    public function validerLivraison($id)
    {
        return $this->mettreAJourStatutCom($id, 'livree');
    }
}