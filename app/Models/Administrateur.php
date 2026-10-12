<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;

class Administrateur extends User
{
    protected $table = 'users';

    protected static function booted(): void
    {
        static::addGlobalScope('role', fn(Builder $q) => $q->where('role', 'admin'));
        static::creating(fn($m) => $m->role = 'admin');
    }
    public function gererUtilisateur()     { return User::all(); }
    public function gererRoles()           { return User::select('role')->distinct()->get(); }
    public function consulterStatistiques(){ return User::count(); }
}