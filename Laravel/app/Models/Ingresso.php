<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Traits\BelongsToEvento;

class Ingresso extends Model
{
    use BelongsToEvento;

    protected $fillable = [
        'numero',
        'lote',
        'valor_pago',
        'vendedor',
        'forma_pagamento',
        'entrou',
        'hora_entrada',
        'pulseira',
        'pessoa_id',
        'evento_id',
    ];
}
