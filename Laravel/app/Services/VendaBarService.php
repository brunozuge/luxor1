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

    public function update($id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {
            $venda = VendaBar::findOrFail($id);
            $produto = $venda->produto;

            // Rollback old quantity
            $produto->increment('estoque_atual', $venda->quantidade);

            // Check if new quantity is available
            if ($produto->estoque_atual < $data['quantidade']) {
                $produto->decrement('estoque_atual', $venda->quantidade); // Undo rollback
                throw new \Exception("Estoque insuficiente.");
            }

            // Apply new quantity
            $produto->decrement('estoque_atual', $data['quantidade']);

            $venda->update([
                'vendedor' => $data['vendedor'],
                'quantidade' => $data['quantidade'],
                'valor_total' => $produto->preco_venda * $data['quantidade'],
                'pessoa_id' => $data['pessoa_id'] ?? $venda->pessoa_id
            ]);

            return $venda;
        });
    }

    public function bulkCreate(array $items, string $vendedor, $pessoa_id = null)
    {
        return DB::transaction(function () use ($items, $vendedor, $pessoa_id) {
            $created = [];
            foreach ($items as $item) {
                $produto = Produto::findOrFail($item['produto_id']);

                if ($produto->estoque_atual < $item['quantidade']) {
                    throw new \Exception("Estoque insuficiente para o produto: {$produto->nome}");
                }

                $produto->decrement('estoque_atual', $item['quantidade']);

                $created[] = VendaBar::create([
                    'produto_id' => $item['produto_id'],
                    'pessoa_id' => $pessoa_id,
                    'vendedor' => $vendedor,
                    'quantidade' => $item['quantidade'],
                    'valor_total' => $produto->preco_venda * $item['quantidade'],
                    'hora' => Carbon::now()->format('H:i')
                ]);
            }
            return $created;
        });
    }
}
