<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\IngressoService;
use Illuminate\Http\Request;

class IngressoController extends Controller
{
    protected $service;

    public function __construct(IngressoService $service)
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
            'numero' => 'required|string',
            'lote' => 'nullable|string',
            'valor_pago' => 'nullable|numeric',
            'vendedor' => 'nullable|string',
            'forma_pagamento' => 'required|in:dinheiro,pix,cartao_credito,cartao_debito',
        ]);

        return response()->json($this->service->create($data), 201);
    }

    public function checkIn(Request $request, $id)
    {
        $data = $request->validate([
            'pulseira' => 'required|in:maior,menor,camarote,staff',
        ]);

        return response()->json($this->service->checkIn($id, $data['pulseira']));
    }

    public function destroy($id)
    {
        $this->service->delete($id);
        return response()->json(null, 204);
    }
}
