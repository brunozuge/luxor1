<?php

namespace App\Traits;

use App\Models\Evento;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

trait BelongsToEvento
{
    public static function bootBelongsToEvento()
    {
        static::creating(function (Model $model) {
            if (app()->runningInConsole()) return;

            try {
                $eventoId = request()->header('X-Evento-Id') ?? request()->query('evento_id') ?? session('evento_id');

                if (!$model->evento_id && $eventoId && $eventoId !== 'null' && $eventoId !== 'undefined') {
                    $model->evento_id = $eventoId;
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

                if ($eventoId && $eventoId !== 'null' && $eventoId !== 'undefined') {
                    $builder->where($builder->getModel()->getTable() . '.evento_id', $eventoId);
                } else if (Auth::check()) {
                    // Se não há evento selecionado mas o usuário está logado,
                    // trazemos tudo que pertence aos eventos desse usuário (Visão Geral)
                    /** @var \App\Models\User $user */
                    $user = Auth::user();
                    $eventoIds = $user->eventos()->pluck('id')->toArray();
                    $builder->whereIn($builder->getModel()->getTable() . '.evento_id', $eventoIds);
                } else {
                    // Força resultado vazio se não há contexto de evento nem usuário
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
