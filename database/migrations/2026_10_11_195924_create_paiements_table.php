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
        Schema::create('paiements', function (Blueprint $table) {
            $table->id('id');
            $table->foreignId('idCommande')->unique()->constrained('commandes','idCommande');
            $table->decimal('montant', 12, 2);
            $table->string('mode'); // orange_money, wave, carte, especes
            $table->dateTime('datePaiement')->nullable();
            $table->string('referenceTransaction')->unique();
            $table->string('statut')->default('en_attente');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('paiements');
    }
};
