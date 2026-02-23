<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ColaboradorController;
use App\Http\Controllers\Api\IngressoController;
use App\Http\Controllers\Api\MesaCamaroteController;
use App\Http\Controllers\Api\PessoaController;
use App\Http\Controllers\Api\ProdutoController;
use App\Http\Controllers\Api\VendaBarController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Auth
    Route::post('login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);

        // Pessoas
        Route::apiResource('pessoas', PessoaController::class);

        // Ingressos
        Route::post('ingressos/{id}/check-in', [IngressoController::class, 'checkIn']);
        Route::apiResource('ingressos', IngressoController::class)->except(['update', 'show']);

        // Produtos
        Route::post('produtos/bulk', [ProdutoController::class, 'bulkStore']);
        Route::apiResource('produtos', ProdutoController::class);

        // Vendas Bar
        Route::post('vendas-bar/bulk', [VendaBarController::class, 'bulkStore']);
        Route::apiResource('vendas-bar', VendaBarController::class)->only(['index', 'store', 'update', 'destroy']);

        // Colaboradores
        Route::apiResource('colaboradores', ColaboradorController::class);

        // Mesas Camarote
        Route::post('mesas-camarote/{id}/pessoas', [MesaCamaroteController::class, 'addPessoa']);
        Route::delete('mesas-camarote/{id}/pessoas', [MesaCamaroteController::class, 'removePessoa']);
        Route::post('mesas-camarote/{id}/garrafas', [MesaCamaroteController::class, 'addGarrafa']);
        Route::delete('mesas-camarote/{id}/garrafas', [MesaCamaroteController::class, 'removeGarrafa']);
        Route::apiResource('mesas-camarote', MesaCamaroteController::class);
    });
});
