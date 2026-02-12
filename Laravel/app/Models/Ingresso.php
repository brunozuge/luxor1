<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ingresso extends Model
{
    protected $fillable = [
        'numero',
        'lote',
        'valor_pago',
        'vendedor',
        'forma_pagamento',
        'entrou',
        'hora_entrada',
        'pulseira',
    ];
}
