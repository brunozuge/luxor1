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
        return auth()->user()->eventos()->get();
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

        return response()->json($evento, 201);
    }

    public function show(string $id)
    {
        return auth()->user()->eventos()->findOrFail($id);
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

        return response()->json($evento);
    }

    public function destroy(string $id)
    {
        $evento = auth()->user()->eventos()->findOrFail($id);
        $evento->delete();

        return response()->json(['message' => 'Evento excluído com sucesso']);
    }
}
