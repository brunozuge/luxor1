<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MesaCamaroteService;
use Illuminate\Http\Request;

class MesaCamaroteController extends Controller
{
    protected $service;

    public function __construct(MesaCamaroteService $service)
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
            'nome' => 'required|string',
            'garcom' => 'nullable|string',
            'cor_pulseira' => 'nullable|string',
        ]);

        return response()->json($this->service->create($data), 201);
    }

    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'nome' => 'sometimes|string',
            'garcom' => 'nullable|string',
            'cor_pulseira' => 'nullable|string',
            'garrafas' => 'nullable|array',
        ]);

        return response()->json($this->service->update($id, $data));
    }

    public function addPessoa(Request $request, $id)
    {
        $data = $request->validate([
            'pessoa_id' => 'required|exists:pessoas,id',
        ]);

        $pessoa = \App\Models\Pessoa::withoutGlobalScope('evento')->find($data['pessoa_id']);
        if ($pessoa && $pessoa->bloqueado) {
            return response()->json(['message' => 'Esta pessoa está bloqueada no sistema.'], 403);
        }

        return response()->json($this->service->addPessoa($id, $data['pessoa_id']));
    }

    public function removePessoa(Request $request, $id)
    {
        $data = $request->validate([
            'pessoa_id' => 'required|exists:pessoas,id',
        ]);

        return response()->json($this->service->removePessoa($id, $data['pessoa_id']));
    }

    public function addGarrafa(Request $request, $id)
    {
        $data = $request->validate([
            'garrafa' => 'required|string',
        ]);

        return response()->json($this->service->addGarrafa($id, $data['garrafa']));
    }

    public function removeGarrafa(Request $request, $id)
    {
        $data = $request->validate([
            'index' => 'required|integer',
        ]);

        return response()->json($this->service->removeGarrafa($id, $data['index']));
    }

    public function destroy($id)
    {
        $this->service->delete($id);
        return response()->json(null, 204);
    }
}
