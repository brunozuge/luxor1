<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Produto extends Model
{
    protected $fillable = [
        'nome',
        'custo',
        'preco_venda',
        'estoque_inicial',
        'estoque_atual',
    ];

    public function vendas()
    {
        return $this->hasMany(VendaBar::class, 'produto_id');
    }
}
