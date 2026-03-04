<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Traits\BelongsToEvento;

class Produto extends Model
{
    use BelongsToEvento;

    protected $fillable = [
        'nome',
        'custo',
        'preco_venda',
        'estoque_inicial',
        'estoque_atual',
        'evento_id',
    ];

    public function vendas()
    {
        return $this->hasMany(VendaBar::class, 'produto_id');
    }
}
