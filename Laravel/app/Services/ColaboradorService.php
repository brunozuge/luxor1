<?php

namespace App\Services;

use App\Models\Colaborador;

class ColaboradorService
{
    public function getAll($search = null, $cargo = null)
    {
        $query = Colaborador::query();

        if ($search) {
            $query->where('nome', 'like', "%{$search}%")
                ->orWhere('telefone', 'like', "%{$search}%");
        }

        if ($cargo && $cargo !== 'todos') {
            $query->where('cargo', $cargo);
        }

        return $query->get();
    }

    public function create(array $data)
    {
        return Colaborador::create($data);
    }

    public function update($id, array $data)
    {
        $colaborador = Colaborador::findOrFail($id);
        $colaborador->update($data);
        return $colaborador;
    }

    public function delete($id)
    {
        $colaborador = Colaborador::findOrFail($id);
        return $colaborador->delete();
    }
}
