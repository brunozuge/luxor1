<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Traits\BelongsToEvento;

class MesaCamarote extends Model
{
    use BelongsToEvento;

    protected $table = 'mesas_camarote';

    protected $fillable = [
        'nome',
        'garcom',
        'cor_pulseira',
        'garrafas',
        'evento_id',
    ];

    protected $casts = [
        'garrafas' => 'array',
    ];

    public function pessoas()
    {
        return $this->belongsToMany(Pessoa::class, 'mesa_camarote_pessoa');
    }
}
