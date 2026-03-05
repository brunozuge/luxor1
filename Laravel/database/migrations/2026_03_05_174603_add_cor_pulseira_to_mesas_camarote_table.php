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
        Schema::table('mesas_camarote', function (Blueprint $table) {
            $table->string('cor_pulseira')->nullable()->after('garcom');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('mesas_camarote', function (Blueprint $table) {
            $table->dropColumn('cor_pulseira');
        });
    }
};
