<?php

namespace App\Services;

use App\Models\Ingresso;
use Carbon\Carbon;

class IngressoService
{
    public function getAll($search = null)
    {
        $query = Ingresso::query();

        if ($search) {
            $query->where('numero', 'like', "%{$search}%");
        }

        return $query->latest()->get();
    }

    public function create(array $data)
    {
        return Ingresso::create($data);
    }

    public function update($id, array $data)
    {
        $ingresso = Ingresso::findOrFail($id);
        $ingresso->update($data);
        return $ingresso;
    }

    public function checkIn($id, $wristband)
    {
        $ingresso = Ingresso::findOrFail($id);
        $ingresso->update([
            'entrou' => true,
            'hora_entrada' => Carbon::now()->format('H:i'),
            'pulseira' => $wristband
        ]);
        return $ingresso;
    }

    public function delete($id)
    {
        $ingresso = Ingresso::findOrFail($id);
        return $ingresso->delete();
    }
}
