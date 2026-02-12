<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PessoaService;
use Illuminate\Http\Request;

class PessoaController extends Controller
{
    protected $service;

    public function __construct(PessoaService $service)
    {
        $this->service = $service;
    }

    public function index(Request $request)
    {
        return response()->json($this->service->getAll($request->search));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nome' => 'required|string',
            'instagram' => 'nullable|string',
            'cpf_rg' => 'nullable|string',
            'data_nascimento' => 'nullable|date',
            'tipo_ingresso' => 'required|in:pista,camarote,vip,free',
            'observacao' => 'nullable|string',
        ]);

        return response()->json($this->service->create($data), 201);
    }

    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'nome' => 'sometimes|string',
            'instagram' => 'nullable|string',
            'cpf_rg' => 'nullable|string',
            'data_nascimento' => 'nullable|date',
            'tipo_ingresso' => 'sometimes|in:pista,camarote,vip,free',
            'observacao' => 'nullable|string',
        ]);

        return response()->json($this->service->update($id, $data));
    }

    public function destroy($id)
    {
        $this->service->delete($id);
        return response()->json(null, 204);
    }
}
