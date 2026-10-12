<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'users';

    protected $fillable = [
        'prenom','nom','email','telephone','image',
        'adresse','actif','motDePasse','role'
    ];

    protected $hidden = ['motDePasse', 'remember_token'];

    protected $casts = [
        'actif'              => 'boolean',
        'email_verified_at'  => 'datetime',
    ];

    //Laravel attend "password", on redirige vers "motDePasse"
    public function getAuthPassword()
    {
        return $this->motDePasse;
    }

    // ---- Relations ----
    public function notifications()
    {
        return $this->hasMany(Notification::class, 'idUtilisateur');
    }

    public function commandesClient()
    {
        return $this->hasMany(Commande::class, 'idClient');
    }

    public function livraisons()
    {
        return $this->hasMany(Livraison::class, 'idLivreur');
    }

    public function bijouxArtisan()
    {
        return $this->hasMany(Bijou::class, 'idArtisan');
    }

    public function favoris()
    {
        return $this->hasMany(Favori::class, 'idClient');
    }

    // ---- Helpers de role ----
    public function isClient(): bool       { return $this->role === 'client'; }
    public function isAdmin(): bool        { return $this->role === 'admin'; }
    public function isGestionnaire(): bool { return $this->role === 'gestionnaire'; }
    public function isLivreur(): bool      { return $this->role === 'livreur'; }
    public function isArtisan(): bool      { return $this->role === 'artisan'; }

    // ---- Methodes du diagramme ----
    public function seConnecter()   { return $this; }
    public function seDeconnecter() { return $this; }
    public function modifierProfil(array $data) { return $this->update($data); }
}