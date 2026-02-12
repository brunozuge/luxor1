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
        Schema::create('vendas_bar', function (Blueprint $table) {
            $table->id();
            $table->foreignId('produto_id')->constrained('produtos')->onDelete('cascade');
            $table->foreignId('pessoa_id')->nullable()->constrained('pessoas')->onDelete('set null');
            $table->string('vendedor')->nullable();
            $table->integer('quantidade')->default(1);
            $table->decimal('valor_total', 10, 2);
            $table->string('hora')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vendas_bar');
    }
};
