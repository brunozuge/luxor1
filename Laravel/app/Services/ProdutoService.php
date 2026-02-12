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
}
