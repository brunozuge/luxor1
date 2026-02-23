<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ProdutoService;
use Illuminate\Http\Request;

class ProdutoController extends Controller
{
    protected $service;

    public function __construct(ProdutoService $service)
    {
        $this->service = $service;
    }

    public function index()
    {
        return response()->json($this->service->getAll());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nome' => 'required|string|unique:produtos,nome',
            'custo' => 'required|numeric',
            'preco_venda' => 'required|numeric',
            'estoque_inicial' => 'required|integer',
        ]);

        return response()->json($this->service->create($data), 201);
    }

    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'nome' => "sometimes|string|unique:produtos,nome,{$id}",
            'custo' => 'sometimes|numeric',
            'preco_venda' => 'sometimes|numeric',
            'estoque_inicial' => 'sometimes|integer',
            'estoque_atual' => 'sometimes|integer',
        ]);

        return response()->json($this->service->update($id, $data));
    }

    public function destroy($id)
    {
        $this->service->delete($id);
        return response()->json(null, 204);
    }

    public function bulkStore(Request $request)
    {
        $data = $request->validate([
            'products' => 'required|array',
            'products.*.nome' => 'required|string|distinct|unique:produtos,nome',
            'products.*.custo' => 'required|numeric',
            'products.*.preco_venda' => 'required|numeric',
            'products.*.estoque_inicial' => 'required|integer',
        ]);

        return response()->json($this->service->bulkCreate($data['products']), 201);
    }
}
