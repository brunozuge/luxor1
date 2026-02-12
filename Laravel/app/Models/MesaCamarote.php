<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MesaCamarote extends Model
{
    protected $table = 'mesas_camarote';

    protected $fillable = [
        'nome',
        'garcom',
        'garrafas',
    ];

    protected $casts = [
        'garrafas' => 'array',
    ];

    public function pessoas()
    {
        return $this->belongsToMany(Pessoa::class, 'mesa_camarote_pessoa');
    }
}
