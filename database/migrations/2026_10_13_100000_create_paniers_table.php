<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('paniers', function (Blueprint $table) {
            $table->id('idPanier');
            $table->foreignId('idClient')->constrained('users', 'id')->onDelete('cascade');
            $table->foreignId('idBijou')->constrained('bijoux', 'idBijou')->onDelete('cascade');
            $table->unsignedInteger('quantite')->default(1);
            $table->unique(['idClient', 'idBijou']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paniers');
    }
};
