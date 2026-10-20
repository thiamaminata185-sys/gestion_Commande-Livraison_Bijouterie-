<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class ProfilController extends Controller
{
    /** Changer son mot de passe (il faut connaître l'ancien). */
    public function changerMotDePasse(Request $request)
    {
        $data = $request->validate([
            'motDePasseActuel' => 'required|string',
            'motDePasse'       => 'required|string|min:8|confirmed|different:motDePasseActuel',
        ]);

        $user = $request->user();

        if (!Hash::check($data['motDePasseActuel'], $user->motDePasse)) {
            return response()->json([
                'message' => 'Le mot de passe actuel est incorrect',
                'errors'  => ['motDePasseActuel' => ['Le mot de passe actuel est incorrect']],
            ], 422);
        }

        $user->update(['motDePasse' => Hash::make($data['motDePasse'])]);

        // Sécurité : les autres appareils connectés sont déconnectés, celui-ci reste connecté.
        $courant = $user->currentAccessToken();
        $user->tokens()->when($courant && isset($courant->id), fn ($q) => $q->where('id', '!=', $courant->id))->delete();

        return response()->json(['message' => 'Mot de passe modifié']);
    }

    /** Téléverser ou remplacer sa photo de profil (multipart/form-data, champ « image »). */
    public function televerserPhoto(Request $request)
    {
        $request->validate([
            'image' => 'required|image|mimes:jpg,jpeg,png,webp|max:2048', // 2 Mo
        ]);

        $user   = $request->user();
        $chemin = $request->file('image')->store('profils', 'public');

        $this->supprimerFichier($user->image);
        $user->update(['image' => '/storage/' . $chemin]);

        return $user->fresh();
    }

    /** Retirer sa photo de profil. */
    public function supprimerPhoto(Request $request)
    {
        $user = $request->user();

        $this->supprimerFichier($user->image);
        $user->update(['image' => null]);

        return $user->fresh();
    }

    /** Supprime le fichier seulement s'il a été téléversé ici (jamais une image externe). */
    private function supprimerFichier(?string $url): void
    {
        if ($url && str_starts_with($url, '/storage/profils/')) {
            Storage::disk('public')->delete(substr($url, strlen('/storage/')));
        }
    }
}
