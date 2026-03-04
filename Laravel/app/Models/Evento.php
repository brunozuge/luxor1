<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Evento extends Model
{
    protected $fillable = [
        'user_id',
        'nome',
        'cor_primaria',
        'cor_secundaria',
        'logo',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
