<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/up', function () {
    return response('OK', 200);
});

Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'time' => now()]);
});
