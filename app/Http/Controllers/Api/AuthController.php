<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'prenom'     => 'required|string|max:100',
            'nom'        => 'required|string|max:100',
            'email'      => 'required|email|unique:users,email',
            'telephone'  => 'nullable|string|max:30',
            'adresse'    => 'nullable|string',
            'motDePasse' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'prenom'     => $data['prenom'],
            'nom'        => $data['nom'],
            'email'      => $data['email'],
            'telephone'  => $data['telephone'] ?? null,
            'adresse'    => $data['adresse'] ?? null,
            'motDePasse' => Hash::make($data['motDePasse']),
            'role'       => 'client',
            'actif'      => true,
        ]);

        return response()->json([
            'utilisateur' => $user,
            'token'       => $user->createToken('auth')->plainTextToken,
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email'      => 'required|email',
            'motDePasse' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->motDePasse, $user->motDePasse)) {
            return response()->json(['message' => 'Identifiants invalides'], 401);
        }

        if (!$user->actif) {
            return response()->json(['message' => 'Compte désactivé'], 403);
        }

        return response()->json([
            'utilisateur' => $user,
            'token'       => $user->createToken('auth')->plainTextToken,
        ]);
    }

    public function me(Request $request)
    {
        return $request->user();
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Déconnecté']);
    }

    public function modifierProfil(Request $request)
    {
        $user = $request->user();
        $data = $request->validate([
            'prenom'    => 'sometimes|string|max:100',
            'nom'       => 'sometimes|string|max:100',
            'telephone' => 'nullable|string|max:30',
            'adresse'   => 'nullable|string',
            'image'     => 'nullable|string',
        ]);
        $user->modifierProfil($data);
        return $user->fresh();
    }
}