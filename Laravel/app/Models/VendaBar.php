<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Traits\BelongsToEvento;

class VendaBar extends Model
{
    use BelongsToEvento;

    protected $table = 'vendas_bar';

    protected $fillable = [
        'produto_id',
        'pessoa_id',
        'vendedor',
        'quantidade',
        'valor_total',
        'hora',
        'evento_id',
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
