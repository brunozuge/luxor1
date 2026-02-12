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
        Schema::table('ingressos', function (Blueprint $table) {
            $table->dropForeign(['pessoa_id']);
            $table->dropColumn('pessoa_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ingressos', function (Blueprint $table) {
            $table->foreignId('pessoa_id')->nullable()->constrained('pessoas')->onDelete('cascade');
        });
    }
};
