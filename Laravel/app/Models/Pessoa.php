<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pessoa extends Model
{
    protected $fillable = [
        'nome',
        'instagram',
        'cpf_rg',
        'data_nascimento',
        'tipo_ingresso',
        'observacao',
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
