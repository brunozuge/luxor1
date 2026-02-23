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

    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'vendedor' => 'required|string',
            'quantidade' => 'required|integer|min:1',
            'pessoa_id' => 'nullable|exists:pessoas,id',
        ]);

        try {
            return response()->json($this->service->update($id, $data));
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function bulkStore(Request $request)
    {
        $data = $request->validate([
            'vendedor' => 'required|string',
            'pessoa_id' => 'nullable|exists:pessoas,id',
            'items' => 'required|array|min:1',
            'items.*.produto_id' => 'required|exists:produtos,id',
            'items.*.quantidade' => 'required|integer|min:1',
        ]);

        try {
            return response()->json($this->service->bulkCreate(
                $data['items'],
                $data['vendedor'],
                $data['pessoa_id'] ?? null
            ), 201);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
