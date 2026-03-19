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
        if ($request->has('cpf_rg')) {
            $cpfLimpo = preg_replace('/\D/', '', $request->input('cpf_rg'));
            $blocked = \App\Models\Pessoa::withoutGlobalScope('evento')
                ->where('cpf_rg', $cpfLimpo)
                ->where('bloqueado', true)
                ->first();
            if ($blocked) {
                return response()->json(['message' => 'Esta pessoa está bloqueada no sistema.'], 403);
            }
        }

        $data = $request->validate([
            'nome' => 'required|string',
            'instagram' => 'nullable|string',
            'cpf_rg' => 'required|string|cpf|unique:pessoas,cpf_rg',
            'data_nascimento' => 'required|date',
            'tipo_ingresso' => 'required|in:pista,camarote,vip,free',
            'observacao' => 'nullable|string',
            'bloqueado' => 'boolean',
        ], [
            'nome.required' => 'O nome é obrigatório.',
            'cpf_rg.required' => 'O CPF/RG é obrigatório.',
            'cpf_rg.unique' => 'Este CPF já está cadastrado no sistema.',
            'cpf_rg.cpf' => 'O CPF informado é inválido.',
            'data_nascimento.required' => 'A data de nascimento é obrigatória.',
            'data_nascimento.date' => 'A data de nascimento preenchida é inválida.',
            'tipo_ingresso.required' => 'O tipo de ingresso é obrigatório.',
            'tipo_ingresso.in' => 'O tipo de ingresso é inválido.'
        ]);

        return response()->json($this->service->create($data), 201);
    }

    public function update(Request $request, $id)
    {
        if ($request->has('cpf_rg')) {
            $cpfLimpo = preg_replace('/\D/', '', $request->input('cpf_rg'));
            $blocked = \App\Models\Pessoa::withoutGlobalScope('evento')
                ->where('cpf_rg', $cpfLimpo)
                ->where('id', '!=', $id)
                ->where('bloqueado', true)
                ->first();
            if ($blocked) {
                return response()->json(['message' => 'Esta pessoa está bloqueada no sistema.'], 403);
            }
        }

        $data = $request->validate([
            'nome' => 'sometimes|string',
            'instagram' => 'nullable|string',
            'cpf_rg' => "sometimes|string|cpf|unique:pessoas,cpf_rg,{$id}",
            'data_nascimento' => 'sometimes|date',
            'tipo_ingresso' => 'sometimes|in:pista,camarote,vip,free',
            'observacao' => 'nullable|string',
            'bloqueado' => 'boolean',
        ], [
            'nome.required' => 'O nome é obrigatório.',
            'cpf_rg.required' => 'O CPF/RG é obrigatório.',
            'cpf_rg.unique' => 'Este CPF já está cadastrado no sistema.',
            'cpf_rg.cpf' => 'O CPF informado é inválido.',
            'data_nascimento.required' => 'A data de nascimento é obrigatória.',
            'data_nascimento.date' => 'A data de nascimento preenchida é inválida.',
            'tipo_ingresso.required' => 'O tipo de ingresso é obrigatório.',
            'tipo_ingresso.in' => 'O tipo de ingresso é inválido.'
        ]);

        return response()->json($this->service->update($id, $data));
    }

    public function destroy($id)
    {
        $this->service->delete($id);
        return response()->json(null, 204);
    }
}
