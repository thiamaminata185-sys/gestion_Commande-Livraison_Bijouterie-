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
        Schema::create('favoris', function (Blueprint $table) {
            $table->id('idFavori');
            $table->foreignId('idClient')->constrained('users','id')->onDelete('cascade');
            $table->foreignId('idBijou')->constrained('bijoux','idBijou')->onDelete('cascade');
            $table->dateTime('date');
            $table->unique(['idClient','idBijou']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('favoris');
    }
};
