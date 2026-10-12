<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('ligne_commandes', function (Blueprint $table) {
            $table->id('id');
            $table->foreignId('idCommande')->constrained('commandes','idCommande')->onDelete('cascade');
            $table->foreignId('idBijou')->constrained('bijoux','idBijou');
            $table->integer('quantite');
            $table->decimal('prixUnitaire', 12, 2);
            $table->decimal('sousTotal', 12, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ligne_commandes');
    }
};
