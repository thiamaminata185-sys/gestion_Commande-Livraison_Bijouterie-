<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    /**
     * Formulaire « Contact » : le message arrive sous forme de notification chez les
     * gestionnaires et administrateurs, et l'expéditeur reçoit un accusé de réception.
     */
    public function envoyer(Request $request)
    {
        $data = $request->validate([
            'sujet'   => 'required|string|max:120',
            'message' => 'required|string|min:10|max:1500',
        ]);

        $user = $request->user();
        $nom  = trim($user->prenom . ' ' . $user->nom);
        $coordonnees = $user->email . ($user->telephone ? ' · ' . $user->telephone : '');

        Notification::envoyerAuxRoles(
            ['gestionnaire', 'admin'],
            "Message de {$nom} : {$data['sujet']}",
            $data['message'] . "\n\n— {$nom} ({$coordonnees})"
        );

        Notification::envoyer(
            $user->id,
            'Message envoyé',
            "Nous avons bien reçu votre message « {$data['sujet']} ». Nous vous répondons rapidement."
        );

        return response()->json(['message' => 'Message envoyé'], 201);
    }
}
