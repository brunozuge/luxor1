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
        $tables = ['pessoas', 'ingressos', 'produtos', 'vendas_bar', 'colaboradores', 'mesas_camarote'];
        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->foreignId('evento_id')->nullable()->constrained()->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = ['pessoas', 'ingressos', 'produtos', 'vendas_bar', 'colaboradores', 'mesas_camarote'];
        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->dropForeign(['evento_id']);
                $table->dropColumn('evento_id');
            });
        }
    }
};
