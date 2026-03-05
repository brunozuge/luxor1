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
        $eventos = auth()->user()->eventos()->get(['id', 'nome', 'cor_primaria', 'cor_secundaria', 'logo']);
        return response()->json($eventos);
    }

    public function summary()
    {
        $eventos = auth()->user()->eventos()
            ->withCount([
                'ingressos as ingressos_count',
                'colaboradores as colaboradores_count',
                'mesasCamarote as mesas_count'
            ])
            ->withSum('ingressos as faturamento_ingressos', 'valor_pago')
            ->withSum('vendasBar as faturamento_bar', 'valor_total')
            ->get();

        $mapped = $eventos->map(function ($evento) {
            return [
                'id' => $evento->id,
                'nome' => $evento->nome,
                'cor_primaria' => $evento->cor_primaria,
                'cor_secundaria' => $evento->cor_secundaria,
                'logo' => $evento->logo,
                'stats' => [
                    'faturamento_total' => (float)$evento->faturamento_ingressos + (float)$evento->faturamento_bar,
                    'faturamento_ingressos' => (float)$evento->faturamento_ingressos,
                    'faturamento_bar' => (float)$evento->faturamento_bar,
                    'colaboradores_count' => (int)$evento->colaboradores_count,
                    'ingressos_count' => (int)$evento->ingressos_count,
                    'mesas_count' => (int)$evento->mesas_count,
                    'garrafas_count' => $this->countGarrafas($evento),
                ]
            ];
        });

        return response()->json($mapped);
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
        $evento->loadCount([
            'ingressos as ingressos_count',
            'colaboradores as colaboradores_count',
            'mesasCamarote as mesas_count'
        ]);

        $faturamento_ingressos = $evento->ingressos()->sum('valor_pago');
        $faturamento_bar = $evento->vendasBar()->sum('valor_total');

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
                'colaboradores_count' => (int)$evento->colaboradores_count,
                'ingressos_count' => (int)$evento->ingressos_count,
                'mesas_count' => (int)$evento->mesas_count,
                'garrafas_count' => $this->countGarrafas($evento),
            ]
        ];
    }

    private function countGarrafas($evento)
    {
        return $evento->mesasCamarote()
            ->withoutGlobalScope('evento')
            ->get()
            ->reduce(function ($carry, $mesa) {
                return $carry + (is_array($mesa->garrafas) ? count($mesa->garrafas) : 0);
            }, 0);
    }
}
