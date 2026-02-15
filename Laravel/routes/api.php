<?php

use App\Http\Controllers\Api\ColaboradorController;
use App\Http\Controllers\Api\IngressoController;
use App\Http\Controllers\Api\MesaCamaroteController;
use App\Http\Controllers\Api\PessoaController;
use App\Http\Controllers\Api\ProdutoController;
use App\Http\Controllers\Api\VendaBarController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Pessoas
    Route::apiResource('pessoas', PessoaController::class);

    // Ingressos
    Route::post('ingressos/{id}/check-in', [IngressoController::class, 'checkIn']);
    Route::apiResource('ingressos', IngressoController::class)->except(['update', 'show']);

    // Produtos
    Route::apiResource('produtos', ProdutoController::class);

    // Vendas Bar
    Route::apiResource('vendas-bar', VendaBarController::class)->only(['index', 'store', 'destroy']);

    // Colaboradores
    Route::apiResource('colaboradores', ColaboradorController::class);

    // Mesas Camarote
    Route::post('mesas-camarote/{id}/pessoas', [MesaCamaroteController::class, 'addPessoa']);
    Route::delete('mesas-camarote/{id}/pessoas', [MesaCamaroteController::class, 'removePessoa']);
    Route::post('mesas-camarote/{id}/garrafas', [MesaCamaroteController::class, 'addGarrafa']);
    Route::apiResource('mesas-camarote', MesaCamaroteController::class);
});

Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'time' => now()]);
});
