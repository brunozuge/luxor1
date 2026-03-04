<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return [
        'status' => 'ok',
        'message' => 'EventPro API is running',
        'version' => '1.0.0'
    ];
});

Route::get('/debug-routes', function () {
    return collect(Route::getRoutes())->map(function ($route) {
        return [
            'method' => $route->methods(),
            'uri' => $route->uri(),
            'name' => $route->getName(),
        ];
    });
});

Route::get('/login', function () {
    return response()->json(['error' => 'Unauthenticated.'], 401);
})->name('login');
