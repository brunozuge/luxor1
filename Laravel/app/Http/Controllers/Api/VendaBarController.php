<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\VendaBarService;
use Illuminate\Http\Request;

class VendaBarController extends Controller
{
    protected $service;

    public function __construct(VendaBarService $service)
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
            'produto_id' => 'required|exists:produtos,id',
            'pessoa_id' => 'nullable|exists:pessoas,id',
            'vendedor' => 'required|string',
            'quantidade' => 'required|integer|min:1',
        ]);

        try {
            return response()->json($this->service->create($data), 201);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function destroy($id)
    {
        $this->service->delete($id);
        return response()->json(null, 204);
    }
}
