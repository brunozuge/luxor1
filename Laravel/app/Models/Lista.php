<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Traits\BelongsToEvento;

class Lista extends Model
{
    use BelongsToEvento;

    protected $fillable = ['nome', 'descricao', 'evento_id'];
}
