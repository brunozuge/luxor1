<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Lista;
use Illuminate\Http\Request;

class ListaController extends Controller
{
    public function index()
    {
        return response()->json(Lista::all());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nome' => 'required|string',
            'descricao' => 'nullable|string',
        ]);

        return response()->json(Lista::create($data), 201);
    }

    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'nome' => 'sometimes|string',
            'descricao' => 'sometimes|string|nullable',
        ]);

        $lista = Lista::findOrFail($id);
        $lista->update($data);
        return response()->json($lista);
    }

    public function destroy($id)
    {
        $lista = Lista::findOrFail($id);
        $lista->delete();
        return response()->json(null, 204);
    }
}
