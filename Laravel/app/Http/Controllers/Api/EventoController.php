<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class EventoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return $this->summary();
    }

    public function summary()
    {
        $eventos = auth()->user()->eventos()->get()->map(function ($evento) {
            return $this->formatEvento($evento);
        });

        return response()->json($eventos);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nome' => 'required|string|max:255',
            'cor_primaria' => 'nullable|string|max:20',
            'cor_secundaria' => 'nullable|string|max:20',
            'logo' => 'nullable|string',
        ]);

        $evento = auth()->user()->eventos()->create($validated);

        return response()->json($this->formatEvento($evento), 201);
    }

    public function show(string $id)
    {
        $evento = auth()->user()->eventos()->findOrFail($id);
        return response()->json($this->formatEvento($evento));
    }

    public function update(Request $request, string $id)
    {
        $evento = auth()->user()->eventos()->findOrFail($id);

        $validated = $request->validate([
            'nome' => 'required|string|max:255',
            'cor_primaria' => 'nullable|string|max:20',
            'cor_secundaria' => 'nullable|string|max:20',
            'logo' => 'nullable|string',
        ]);

        $evento->update($validated);

        return response()->json($this->formatEvento($evento));
    }

    public function destroy(string $id)
    {
        $evento = auth()->user()->eventos()->findOrFail($id);
        $evento->delete();

        return response()->json(['message' => 'Evento excluído com sucesso']);
    }

    private function formatEvento($evento)
    {
        $faturamento_ingressos = $evento->ingressos()->sum('valor_pago');
        $faturamento_bar = $evento->vendasBar()->sum('valor_total');
        $colaboradores_count = $evento->colaboradores()->count();
        $ingressos_count = $evento->ingressos()->count();

        return [
            'id' => $evento->id,
            'nome' => $evento->nome,
            'cor_primaria' => $evento->cor_primaria,
            'cor_secundaria' => $evento->cor_secundaria,
            'logo' => $evento->logo,
            'stats' => [
                'faturamento_total' => $faturamento_ingressos + $faturamento_bar,
                'faturamento_ingressos' => $faturamento_ingressos,
                'faturamento_bar' => $faturamento_bar,
                'colaboradores_count' => $colaboradores_count,
                'ingressos_count' => $ingressos_count,
            ]
        ];
    }
}
