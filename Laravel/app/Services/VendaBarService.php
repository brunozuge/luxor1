<?php

namespace App\Services;

use App\Models\VendaBar;
use App\Models\Produto;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class VendaBarService
{
    public function getAll()
    {
        return VendaBar::with(['produto', 'pessoa'])->latest()->get();
    }

    public function create(array $data)
    {
        return DB::transaction(function () use ($data) {
            $produto = Produto::findOrFail($data['produto_id']);

            if ($produto->estoque_atual < $data['quantidade']) {
                throw new \Exception("Estoque insuficiente.");
            }

            $produto->decrement('estoque_atual', $data['quantidade']);

            return VendaBar::create([
                'produto_id' => $data['produto_id'],
                'pessoa_id' => $data['pessoa_id'] ?? null,
                'vendedor' => $data['vendedor'],
                'quantidade' => $data['quantidade'],
                'valor_total' => $produto->preco_venda * $data['quantidade'],
                'hora' => Carbon::now()->format('H:i')
            ]);
        });
    }

    public function delete($id)
    {
        return DB::transaction(function () use ($id) {
            $venda = VendaBar::findOrFail($id);
            $venda->produto->increment('estoque_atual', $venda->quantidade);
            return $venda->delete();
        });
    }
}
