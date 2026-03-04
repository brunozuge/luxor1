<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Traits\BelongsToEvento;

class Colaborador extends Model
{
    use BelongsToEvento;

    protected $table = 'colaboradores';

    protected $fillable = [
        'nome',
        'cargo',
        'telefone',
        'ativo',
        'evento_id',
    ];
}
