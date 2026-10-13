<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $table = 'notifications';
    protected $primaryKey = 'idNotification';

    protected $fillable = ['idUtilisateur','titre','message','lu'];

    protected $casts = ['lu' => 'boolean'];

    public function utilisateur()
    {
        return $this->belongsTo(User::class, 'idUtilisateur');
    }

    public function marquerCommeLu()
    {
        return $this->update(['lu' => true]);
    }

    public static function envoyer(int $idUtilisateur, string $titre, string $message): self
    {
        return self::create(compact('idUtilisateur', 'titre', 'message'));
    }

    public static function envoyerAuxRoles(array $roles, string $titre, string $message): void
    {
        $users = User::whereIn('role', $roles)->get();
        foreach ($users as $u) {
            self::envoyer($u->id, $titre, $message);
        }
    }
}