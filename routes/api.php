<?php

use App\Http\Controllers\Api\ArtisanController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BijouController;
use App\Http\Controllers\Api\CategorieController;
use App\Http\Controllers\Api\CommandeController;
use App\Http\Controllers\Api\FactureController;
use App\Http\Controllers\Api\FavoriController;
use App\Http\Controllers\Api\LivraisonController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PanierController;
use App\Http\Controllers\Api\PaiementController;
use App\Http\Controllers\Api\RapportController;
use App\Http\Controllers\Api\StatistiqueController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// --------- PUBLIC ---------
// throttle : 10 tentatives par minute max (anti force brute)
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/login',    [AuthController::class, 'login'])->middleware('throttle:10,1');

// --------- AUTHENTIFIÉ ---------
Route::middleware('auth:sanctum')->group(function () {

    Route::get('/me',       [AuthController::class, 'me']);
    Route::post('/logout',  [AuthController::class, 'logout']);
    Route::patch('/profil', [AuthController::class, 'modifierProfil']);

    // ---- Catalogue (tous les rôles) ----
    Route::get('/bijoux',              [BijouController::class, 'index']);
    Route::get('/bijoux/{bijou}',      [BijouController::class, 'show']);
    Route::get('/categories',          [CategorieController::class, 'index']);
    Route::get('/categories/{categorie}', [CategorieController::class, 'show']);

    // ---- Commandes ----
    Route::get('/commandes',              [CommandeController::class, 'index']);
    Route::get('/commandes/{commande}',   [CommandeController::class, 'show']);
    Route::patch('/commandes/{commande}/statut', [CommandeController::class, 'updateStatut'])
         ->middleware('role:gestionnaire,admin,artisan');
    Route::patch('/commandes/{commande}/annuler', [CommandeController::class, 'annuler'])
         ->middleware('role:client,gestionnaire,admin');

    // ---- CLIENT ----
    Route::middleware('role:client')->group(function () {
        // Panier
        Route::get('/panier',                [PanierController::class, 'index']);
        Route::post('/panier',               [PanierController::class, 'store']);
        Route::patch('/panier/{idBijou}',    [PanierController::class, 'update']);
        Route::delete('/panier/{idBijou}',   [PanierController::class, 'destroy']);
        Route::delete('/panier',             [PanierController::class, 'vider']);

        Route::post('/commandes',           [CommandeController::class, 'store']);
        Route::get('/mes-commandes',        [CommandeController::class, 'mesCommandes']);
        Route::get('/favoris',              [FavoriController::class, 'index']);
        Route::post('/favoris/{idBijou}',   [FavoriController::class, 'store']);
        Route::delete('/favoris/{idBijou}', [FavoriController::class, 'destroy']);
        Route::post('/commandes/{commande}/paiement', [PaiementController::class, 'store']);
        Route::get('/mes-factures/{facture}/telecharger', [FactureController::class, 'telechargerMaFacture']);
    });

    // ---- GESTIONNAIRE + ADMIN ----
    Route::middleware('role:gestionnaire,admin')->group(function () {
        Route::apiResource('bijoux', BijouController::class)
             ->parameters(['bijoux' => 'bijou'])
             ->except(['index', 'show']);
        Route::apiResource('categories', CategorieController::class)
             ->parameters(['categories' => 'categorie'])
             ->except(['index', 'show']);

        Route::post('/commandes/{commande}/livraison', [LivraisonController::class, 'store']);
        Route::patch('/paiements/{paiement}/valider',  [PaiementController::class, 'valider']);
        Route::patch('/paiements/{paiement}/annuler',  [PaiementController::class, 'annuler']);

        Route::get('/factures',                     [FactureController::class, 'index']);
        Route::get('/factures/{facture}',           [FactureController::class, 'show']);
        Route::get('/factures/{facture}/telecharger', [FactureController::class, 'telecharger']);

        Route::get('/livraisons',              [LivraisonController::class, 'index']);
        Route::get('/livraisons/{livraison}',  [LivraisonController::class, 'show']);

        Route::get('/statistiques',            [StatistiqueController::class, 'index']);
        Route::get('/rapports/{type}',         [RapportController::class, 'generer']);
    });

    // ---- LIVREUR ----
    Route::middleware('role:livreur')->group(function () {
        Route::get('/mes-livraisons',                  [LivraisonController::class, 'mesLivraisons']);
        Route::patch('/livraisons/{livraison}/statut', [LivraisonController::class, 'updateStatut']);
    });

    // ---- ARTISAN ----
    Route::middleware('role:artisan')->group(function () {
        Route::get('/commandes-a-preparer',       [ArtisanController::class, 'commandes']);
        Route::patch('/commandes/{commande}/produire', [ArtisanController::class, 'demarrerProduction']);
        Route::patch('/commandes/{commande}/prete',    [ArtisanController::class, 'validerDisponibilite']);
    });

    // ---- ADMIN ----
    Route::middleware('role:admin')->group(function () {
        Route::apiResource('utilisateurs', UserController::class)
             ->parameters(['utilisateurs' => 'user']);
        Route::patch('/utilisateurs/{user}/toggle-actif', [UserController::class, 'toggleActif']);
    });

    // ---- Notifications (tous) ----
    Route::get('/notifications',              [NotificationController::class, 'index']);
    Route::patch('/notifications/{id}/lu',    [NotificationController::class, 'marquerLu']);
    Route::patch('/notifications/tout-lu',    [NotificationController::class, 'marquerToutLu']);
});