<?php

namespace App\Services;

use App\Models\Pessoa;

class PessoaService
{
    public function getAll($search = null)
    {
        $query = Pessoa::query();

        if ($search) {
            $query->where('nome', 'like', "%{$search}%")
                ->orWhere('cpf_rg', 'like', "%{$search}%")
                ->orWhere('instagram', 'like', "%{$search}%");
        }

        return $query->latest()->get();
    }

    public function create(array $data)
    {
        return Pessoa::create($data);
    }

    public function update($id, array $data)
    {
        $pessoa = Pessoa::findOrFail($id);
        $pessoa->update($data);
        return $pessoa;
    }

    public function delete($id)
    {
        $pessoa = Pessoa::findOrFail($id);
        return $pessoa->delete();
    }
}
