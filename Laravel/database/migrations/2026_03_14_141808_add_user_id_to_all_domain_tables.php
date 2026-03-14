<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $tables = ['pessoas', 'ingressos', 'produtos', 'vendas_bar', 'colaboradores', 'mesas_camarote', 'listas'];

        foreach ($tables as $table) {
            if (Schema::hasTable($table) && !Schema::hasColumn($table, 'user_id')) {
                Schema::table($table, function (Blueprint $table) {
                    $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('cascade');
                });
                
                // Popula o user_id baseado no dono do evento
                DB::statement("UPDATE {$table} SET user_id = (SELECT user_id FROM eventos WHERE eventos.id = {$table}.evento_id) WHERE evento_id IS NOT NULL");
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = ['pessoas', 'ingressos', 'produtos', 'vendas_bar', 'colaboradores', 'mesas_camarote', 'listas'];
        foreach ($tables as $table) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, 'user_id')) {
                Schema::table($table, function (Blueprint $table) {
                    $table->dropForeign(['user_id']);
                    $table->dropColumn('user_id');
                });
            }
        }
    }
};
