<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index()
    {
        return User::latest()->paginate(20);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'prenom'     => 'required|string',
            'nom'        => 'required|string',
            'email'      => 'required|email|unique:users,email',
            'telephone'  => 'nullable|string',
            'adresse'    => 'nullable|string',
            'role'       => 'required|in:client,admin,gestionnaire,livreur,artisan',
            'motDePasse' => 'required|string|min:8',
        ]);

        $data['motDePasse'] = Hash::make($data['motDePasse']);
        $data['actif'] = true;

        return response()->json(User::create($data), 201);
    }

    public function show(User $user)
    {
        return $user;
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'prenom'    => 'sometimes|string',
            'nom'       => 'sometimes|string',
            'email'     => 'sometimes|email|unique:users,email,' . $user->id . ',id',
            'telephone' => 'nullable|string',
            'adresse'   => 'nullable|string',
            'role'      => 'sometimes|in:client,admin,gestionnaire,livreur,artisan',
            'motDePasse'=> 'nullable|string|min:8',
        ]);

        if (!empty($data['motDePasse'])) {
            $data['motDePasse'] = Hash::make($data['motDePasse']);
        } else {
            unset($data['motDePasse']); // champ vide = on ne change pas le mot de passe
        }

        $user->update($data);
        return $user->fresh();
    }

    public function destroy(Request $request, User $user)
    {
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Vous ne pouvez pas supprimer votre propre compte'], 422);
        }

        try {
            $user->tokens()->delete();
            $user->delete();
        } catch (QueryException $e) {
            // clé étrangère : l'utilisateur a des commandes, livraisons, etc.
            return response()->json([
                'message' => 'Cet utilisateur est lié à des données (commandes, livraisons...). Désactivez-le plutôt.'
            ], 409);
        }

        return response()->json(['message' => 'Utilisateur supprimé']);
    }

    public function toggleActif(Request $request, User $user)
    {
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Vous ne pouvez pas désactiver votre propre compte'], 422);
        }

        $user->update(['actif' => !$user->actif]);

        // Un compte désactivé ne doit plus pouvoir utiliser ses tokens déjà émis.
        if (!$user->actif) {
            $user->tokens()->delete();
        }

        return $user;
    }
}