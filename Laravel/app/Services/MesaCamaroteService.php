<?php

namespace App\Services;

use App\Models\MesaCamarote;
use App\Models\Pessoa;

class MesaCamaroteService
{
    public function getAll()
    {
        return MesaCamarote::with('pessoas')->get();
    }

    public function create(array $data)
    {
        return MesaCamarote::create([
            'nome' => $data['nome'],
            'garcom' => $data['garcom'],
            'garrafas' => []
        ]);
    }

    public function update($id, array $data)
    {
        $mesa = MesaCamarote::findOrFail($id);
        $mesa->update($data);
        return $mesa;
    }

    public function addPessoa($mesaId, $pessoaId)
    {
        $mesa = MesaCamarote::findOrFail($mesaId);
        $mesa->pessoas()->attach($pessoaId);
        return $mesa->load('pessoas');
    }

    public function removePessoa($mesaId, $pessoaId)
    {
        $mesa = MesaCamarote::findOrFail($mesaId);
        $mesa->pessoas()->detach($pessoaId);
        return $mesa->load('pessoas');
    }

    public function addGarrafa($mesaId, $garrafa)
    {
        $mesa = MesaCamarote::findOrFail($mesaId);
        $garrafas = $mesa->garrafas ?? [];
        $garrafas[] = $garrafa;
        $mesa->update(['garrafas' => $garrafas]);
        return $mesa;
    }

    public function delete($id)
    {
        $mesa = MesaCamarote::findOrFail($id);
        return $mesa->delete();
    }
}
