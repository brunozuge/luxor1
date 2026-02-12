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
        Schema::create('ingressos', function (Blueprint $table) {
            $table->id();
            $table->string('numero');
            $table->string('lote')->nullable();
            $table->decimal('valor_pago', 10, 2)->default(0);
            $table->string('vendedor')->nullable();
            $table->enum('forma_pagamento', ['dinheiro', 'pix', 'cartao_credito', 'cartao_debito'])->default('pix');
            $table->foreignId('pessoa_id')->constrained('pessoas')->onDelete('cascade');
            $table->boolean('entrou')->default(false);
            $table->string('hora_entrada')->nullable();
            $table->enum('pulseira', ['maior', 'menor', 'camarote', 'staff'])->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ingressos');
    }
};
