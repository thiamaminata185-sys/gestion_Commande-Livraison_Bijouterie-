<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Categorie;
use App\Models\Bijou;
use App\Models\Commande;
use App\Models\LigneCommande;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ---- UTILISATEURS ----
        $admin = User::create([
            'prenom'     => 'Awa',
            'nom'        => 'Diop',
            'email'      => 'admin@etoile-or.sn',
            'telephone'  => '771111111',
            'motDePasse' => Hash::make('password'),
            'role'       => 'admin',
            'actif'      => true,
        ]);

        $gest = User::create([
            'prenom'     => 'Moussa',
            'nom'        => 'Fall',
            'email'      => 'gestion@etoile-or.sn',
            'telephone'  => '772222222',
            'motDePasse' => Hash::make('password'),
            'role'       => 'gestionnaire',
            'actif'      => true,
        ]);

        $client = User::create([
            'prenom'     => 'Aminata',
            'nom'        => 'THIAM',
            'email'      => 'client@test.sn',
            'telephone'  => '773333333',
            'adresse'    => 'Dakar, Plateau',
            'motDePasse' => Hash::make('password'),
            'role'       => 'client',
            'actif'      => true,
        ]);

        $livreur = User::create([
            'prenom'     => 'Ibrahima',
            'nom'        => 'Ndoye',
            'email'      => 'livreur@etoile-or.sn',
            'telephone'  => '774444444',
            'motDePasse' => Hash::make('password'),
            'role'       => 'livreur',
            'actif'      => true,
        ]);

        $artisan = User::create([
            'prenom'     => 'Cheikh',
            'nom'        => 'Sow',
            'email'      => 'artisan@etoile-or.sn',
            'telephone'  => '775555555',
            'motDePasse' => Hash::make('password'),
            'role'       => 'artisan',
            'actif'      => true,
        ]);

        // ---- CATEGORIES ----
        $catOr     = Categorie::create(['nomCategorie' => 'Or',                'descriptionCategorie' => 'Bijoux en or']);
        $catArgent = Categorie::create(['nomCategorie' => 'Argent',            'descriptionCategorie' => 'Bijoux en argent']);
        $catPierre = Categorie::create(['nomCategorie' => 'Pierres précieuses','descriptionCategorie' => 'Diamants, rubis']);

        // ---- BIJOUX ----
        $bijoux = [
            ['nomBijou' => 'Bague Alliance Or 18K',   'prix' => 250000, 'quantiteStock' => 10, 'idCategorie' => $catOr->idCategorie,     'type' => 'Bague'],
            ['nomBijou' => 'Collier Perles de Tahiti','prix' => 180000, 'quantiteStock' => 5,  'idCategorie' => $catPierre->idCategorie, 'type' => 'Collier'],
            ['nomBijou' => 'Bracelet Argent Massif',  'prix' => 45000,  'quantiteStock' => 25, 'idCategorie' => $catArgent->idCategorie, 'type' => 'Bracelet'],
        ];

        foreach ($bijoux as $b) {
            Bijou::create($b + [
                'idGestionnaire' => $gest->id,
                'idArtisan'      => $artisan->id,
            ]);
        }

        // ---- COMMANDE EXEMPLE ----
        $commande = Commande::create([
            'idClient'         => $client->id,
            'statutCommande'   => 'en_attente',
            'dateCommande'     => now(),
            'montantTotal'     => 250000,
            'adresseLivraison' => 'Dakar, Plateau',
        ]);

        LigneCommande::create([
            'idCommande'   => $commande->id,
            'idBijou'      => 1,
            'quantite'     => 1,
            'prixUnitaire' => 250000,
            'sousTotal'    => 250000,
        ]);

        $this->command->info('Base de donnees peuplee avec succes.');
    }
}