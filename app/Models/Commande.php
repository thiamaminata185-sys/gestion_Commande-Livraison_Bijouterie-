<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Commande extends Model
{
    protected $table = 'commandes';
    protected $primaryKey = 'idCommande';

    /** Statuts qui comptent comme une vente (chiffre d'affaires). */
    public const STATUTS_VENDUS = ['validee', 'en_production', 'prete', 'en_livraison', 'livree'];

    /** Transitions de statut autorisées (statut actuel => statuts suivants possibles). */
    public const TRANSITIONS = [
        'en_attente'    => ['validee', 'annulee'],
        'validee'       => ['en_production', 'prete', 'annulee'],
        'en_production' => ['prete'],
        'prete'         => ['en_livraison'],
        'en_livraison'  => ['livree'],
        'livree'        => [],
        'annulee'       => [],
    ];

    protected $fillable = [
        'idClient','idGestionnaire','statutCommande','dateCommande',
        'montantTotal','adresseLivraison'
    ];

    protected $casts = [
        'dateCommande' => 'datetime',
        'montantTotal' => 'decimal:2',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class, 'idClient');
    }

    public function gestionnaire()
    {
        return $this->belongsTo(Gestionnaire::class, 'idGestionnaire');
    }

    public function lignes()
    {
        return $this->hasMany(LigneCommande::class, 'idCommande');
    }

    public function paiement()
    {
        return $this->hasOne(Paiement::class, 'idCommande');
    }

    public function facture()
    {
        return $this->hasOne(Facture::class, 'idCommande');
    }

    public function livraison()
    {
        return $this->hasOne(Livraison::class, 'idCommande');
    }

    public function peutPasserA(string $statut): bool
    {
        return in_array($statut, self::TRANSITIONS[$this->statutCommande] ?? [], true);
    }

    public function annulerCommande()
    {
        return $this->update(['statutCommande' => 'annulee']);
    }

    public function validerCommande()
    {
        return $this->update(['statutCommande' => 'validee']);
    }
}
