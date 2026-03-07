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
                } else {
                    // Force empty result if no event context and not in event-specific index
                    // But wait: if we are listed ALL events, we don't apply this trait to the Event model itself
                    // The trait is only applied to children models.
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
