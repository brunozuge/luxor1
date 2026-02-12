<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ColaboradorService;
use Illuminate\Http\Request;

class ColaboradorController extends Controller
{
    protected $service;

    public function __construct(ColaboradorService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request)
    {
        return response()->json($this->service->getAll($request->search, $request->cargo));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nome' => 'required|string',
            'cargo' => 'required|in:barman,garcom,porteiro,promoter,seguranca,caixa,outro',
            'telefone' => 'nullable|string',
            'ativo' => 'boolean',
        ]);

        return response()->json($this->service->create($data), 201);
    }

    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'nome' => 'sometimes|string',
            'cargo' => 'sometimes|in:barman,garcom,porteiro,promoter,seguranca,caixa,outro',
            'telefone' => 'nullable|string',
            'ativo' => 'boolean',
        ]);

        return response()->json($this->service->update($id, $data));
    }

    public function destroy($id)
    {
        $this->service->delete($id);
        return response()->json(null, 204);
    }
}
