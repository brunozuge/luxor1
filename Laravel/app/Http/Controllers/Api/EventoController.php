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
        $eventos = auth()->user()->eventos()
            ->withCount([
                'ingressos as ingressos_count' => function ($query) {
                    $query->withoutGlobalScope('evento');
                },
                'colaboradores as colaboradores_count' => function ($query) {
                    $query->withoutGlobalScope('evento');
                },
                'mesasCamarote as mesas_count' => function ($query) {
                    $query->withoutGlobalScope('evento');
                }
            ])
            ->withSum(['ingressos as faturamento_ingressos' => function ($query) {
                $query->withoutGlobalScope('evento');
            }], 'valor_pago')
            ->withSum(['vendasBar as faturamento_bar' => function ($query) {
                $query->withoutGlobalScope('evento');
            }], 'valor_total')
            ->get();

        $mapped = $eventos->map(function ($evento) {
            $faturamento_ingressos = (float)$evento->faturamento_ingressos;
            $faturamento_bar = (float)$evento->faturamento_bar;

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
                    'garrafas_count' => 0, // Simplified for index to stay fast
                ]
            ];
        });

        return response()->json($mapped);
    }

    public function summary()
    {
        $eventos = auth()->user()->eventos()
            ->withCount([
                'ingressos as ingressos_count' => function ($query) {
                    $query->withoutGlobalScope('evento');
                },
                'colaboradores as colaboradores_count' => function ($query) {
                    $query->withoutGlobalScope('evento');
                },
                'mesasCamarote as mesas_count' => function ($query) {
                    $query->withoutGlobalScope('evento');
                }
            ])
            ->withSum(['ingressos as faturamento_ingressos' => function ($query) {
                $query->withoutGlobalScope('evento');
            }], 'valor_pago')
            ->withSum(['vendasBar as faturamento_bar' => function ($query) {
                $query->withoutGlobalScope('evento');
            }], 'valor_total')
            ->with(['mesasCamarote' => function ($query) {
                $query->withoutGlobalScope('evento');
            }])
            ->get();

        $mapped = $eventos->map(function ($evento) {
            $faturamento_ingressos = (float)$evento->faturamento_ingressos;
            $faturamento_bar = (float)$evento->faturamento_bar;

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
                    'garrafas_count' => $evento->mesasCamarote->reduce(function ($carry, $mesa) {
                        return $carry + (is_array($mesa->garrafas) ? count($mesa->garrafas) : 0);
                    }, 0),
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
                'faturamento_total' => (float)$faturamento_ingressos + (float)$faturamento_bar,
                'faturamento_ingressos' => (float)$faturamento_ingressos,
                'faturamento_bar' => (float)$faturamento_bar,
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
