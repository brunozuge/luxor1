<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VendaBar extends Model
{
    protected $table = 'vendas_bar';

    protected $fillable = [
        'produto_id',
        'pessoa_id',
        'vendedor',
        'quantidade',
        'valor_total',
        'hora',
    ];

    public function produto()
    {
        return $this->belongsTo(Produto::class);
    }

    public function pessoa()
    {
        return $this->belongsTo(Pessoa::class);
    }
}
