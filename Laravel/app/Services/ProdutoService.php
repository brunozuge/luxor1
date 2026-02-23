<?php

namespace App\Services;

use App\Models\Produto;

class ProdutoService
{
    public function getAll()
    {
        return Produto::all();
    }

    public function create(array $data)
    {
        $data['estoque_atual'] = $data['estoque_inicial'];
        return Produto::create($data);
    }

    public function update($id, array $data)
    {
        $produto = Produto::findOrFail($id);
        $produto->update($data);
        return $produto;
    }

    public function delete($id)
    {
        $produto = Produto::findOrFail($id);
        return $produto->delete();
    }

    public function bulkCreate(array $products)
    {
        $created = [];
        foreach ($products as $product) {
            $product['estoque_atual'] = $product['estoque_inicial'];
            $created[] = Produto::create($product);
        }
        return $created;
    }
}
