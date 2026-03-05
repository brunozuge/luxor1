<?php

namespace App\Traits;

use App\Models\Evento;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

trait BelongsToEvento
{
    public static function bootBelongsToEvento()
    {
        static::creating(function (Model $model) {
            if (app()->runningInConsole()) return;

            try {
                if (!$model->evento_id && session()->has('evento_id')) {
                    $model->evento_id = session('evento_id');
                }
                if (!$model->evento_id && request()->header('X-Evento-Id')) {
                    $model->evento_id = request()->header('X-Evento-Id');
                }
            } catch (\Throwable $e) {
                // Ignore in case session/request are not available
            }
        });

        static::addGlobalScope('evento', function (Builder $builder) {
            if (app()->runningInConsole()) return;

            try {
                $eventoId = request()->header('X-Evento-Id') ?? session('evento_id');
                if ($eventoId && $eventoId !== 'null' && $eventoId !== 'undefined') {
                    $builder->where($builder->getQuery()->from . '.evento_id', $eventoId);
                } else {
                    // Força retorno vazio se não houver contexto de evento
                    $builder->whereRaw('1 = 0');
                }
            } catch (\Throwable $e) {
                // Ignore in CLI or during boot
            }
        });
    }

    public function evento()
    {
        return $this->belongsTo(Evento::class);
    }
}
