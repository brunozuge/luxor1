<?php

namespace App\Traits;

use App\Models\Evento;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;

trait BelongsToEvento
{
    public static function bootBelongsToEvento()
    {
        static::creating(function (Model $model) {
            if (app()->runningInConsole()) return;

            try {
                $eventoId = request()->header('X-Evento-Id') ?? request()->query('evento_id') ?? session('evento_id');

                $table = $model->getTable();
                
                // Produtos e Colaboradores ficam atrelados globalmente ao usuário, 
                // por isso o evento_id não é nem persistido neles, mas sim o user_id.
                // Outras tabelas recebem o evento_id normalmente.
                if (!in_array($table, ['colaboradores', 'produtos'])) {
                    if (!$model->evento_id && $eventoId && $eventoId !== 'null' && $eventoId !== 'undefined') {
                        $model->evento_id = $eventoId;
                    }
                }
                
                // Atrela o registro ao usuário logado
                if (Auth::check()) {
                     $model->user_id = Auth::id();
                }
            } catch (\Throwable $e) {
                // Ignore
            }
        });

        static::addGlobalScope('evento', function (Builder $builder) {
            if (app()->runningInConsole()) return;

            try {
                $request = request();
                $eventoId = $request->header('X-Evento-Id') ?? $request->query('evento_id') ?? session('evento_id');

                $table = $builder->getModel()->getTable();

                $isGlobalModel = in_array($table, ['colaboradores', 'produtos']);

                // Se tem um evento ativo E a tabela não é global, filtra pelo evento_id
                if (!$isGlobalModel && $eventoId && $eventoId !== 'null' && $eventoId !== 'undefined') {
                    $builder->where($table . '.evento_id', $eventoId);
                } else if (Auth::check()) {
                    // Sem evento selecionado (Geral) OU a tabela é de model global (sempre traz todos).
                    if (Schema::hasColumn($table, 'user_id')) {
                        $builder->where($table . '.user_id', Auth::id());
                    } else {
                        /** @var \App\Models\User $user */
                        $user = Auth::user();
                        $eventoIds = $user->eventos()->pluck('id')->toArray();
                        $builder->whereIn($table . '.evento_id', $eventoIds);
                    }
                } else {
                    $builder->whereRaw('1 = 0');
                }
            } catch (\Throwable $e) {
                // Ignore
            }
        });
    }

    public function evento()
    {
        return $this->belongsTo(Evento::class);
    }
}
