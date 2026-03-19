<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Traits\BelongsToEvento;

class Pessoa extends Model
{
    use BelongsToEvento;

    protected $fillable = [
        'nome',
        'instagram',
        'cpf_rg',
        'data_nascimento',
        'tipo_ingresso',
        'observacao',
        'evento_id',
        'bloqueado',
    ];

    protected $casts = [
        'data_nascimento' => 'date',
        'bloqueado' => 'boolean',
    ];

    public function vendasBar()
    {
        return $this->hasMany(VendaBar::class);
    }

    public function mesasCamarote()
    {
        return $this->belongsToMany(MesaCamarote::class, 'mesa_camarote_pessoa');
    }
}
