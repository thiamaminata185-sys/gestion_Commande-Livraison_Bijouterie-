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
        Schema::create('livraisons', function (Blueprint $table) {
            $table->id('idLivraison');
            $table->foreignId('idCommande')->unique()->constrained('commandes','idCommande');
            $table->foreignId('idLivreur')->nullable()->constrained('users','id');
            $table->dateTime('dateLivraison')->nullable();
            $table->string('statutLivraison')->default('en_attente');
            $table->string('adresseLivraison');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('livraisons');
    }
};
