<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('paiements', function (Blueprint $table) {
            $table->string('fournisseur')->nullable();        // « paytech » pour un paiement en ligne
            $table->string('jetonFournisseur')->nullable();   // identifiant de la transaction chez PayTech
            $table->text('urlPaiement')->nullable();          // page de paiement (permet de reprendre le paiement)
        });
    }

    public function down(): void
    {
        Schema::table('paiements', function (Blueprint $table) {
            $table->dropColumn(['fournisseur', 'jetonFournisseur', 'urlPaiement']);
        });
    }
};
