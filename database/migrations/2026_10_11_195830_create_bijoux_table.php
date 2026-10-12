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
        Schema::create('bijoux', function (Blueprint $table) {
            $table->id('idBijou');
            $table->foreignId('idCategorie')->constrained('categories','idCategorie');
            $table->foreignId('idGestionnaire')->nullable()->constrained('users','id');
            $table->foreignId('idArtisan')->nullable()->constrained('users','id');
            $table->string('nomBijou');
            $table->text('descriptionBijou')->nullable();
            $table->string('type')->nullable();
            $table->decimal('prix', 12, 2);
            $table->decimal('prixDorigine', 12, 2)->nullable();
            $table->integer('quantiteStock')->default(0);
            $table->string('image')->nullable();
            $table->json('images')->nullable();
            $table->json('etiquette')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bijoux');
    }
};
