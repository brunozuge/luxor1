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

    public function ingressos()
    {
        return $this->hasMany(Ingresso::class);
    }

    public function vendasBar()
    {
        return $this->hasMany(VendaBar::class);
    }

    public function colaboradores()
    {
        return $this->hasMany(Colaborador::class);
    }
}
