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
        Schema::create('mesa_camarote_pessoa', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mesa_camarote_id')->constrained('mesas_camarote')->onDelete('cascade');
            $table->foreignId('pessoa_id')->constrained('pessoas')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mesa_camarote_pessoa');
    }
};
