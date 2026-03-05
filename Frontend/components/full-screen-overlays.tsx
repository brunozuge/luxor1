"use client"

import React, { useState } from "react"
import { useEventData, Evento } from "@/lib/event-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    X,
    ChevronRight,
    ChevronDown,
    DollarSign,
    Users,
    TrendingUp,
    Plus,
    Trash2,
    Pencil,
    Calendar,
    AlertTriangle,
    Ticket,
    Wine
} from "lucide-react"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { EventFormModal } from "@/components/event-form-modal"

export function FullScreenOverlays() {
    const { overlay, setOverlay, eventos, setSelectedEventId, removeEvento } = useEventData()
    const [expandedEventId, setExpandedEventId] = useState<string | null>(null)
    const [eventToEdit, setEventToEdit] = useState<Evento | null>(null)
    const [eventToDelete, setEventToDelete] = useState<string | null>(null)

    if (overlay === "none") return null

    const totalGlobalRevenue = eventos.reduce((sum, e) => sum + (e.stats?.faturamento_total || 0), 0)
    const totalGlobalColabs = eventos.reduce((sum, e) => sum + (e.stats?.colaboradores_count || 0), 0)

    return (
        <div className="fixed inset-0 z-[100] bg-background flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-card shrink-0">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold">
                        {overlay === "festas" ? "Minhas Festas" : "EventPro Geral"}
                    </h2>
                    {overlay === "festas" && (
                        <Button
                            onClick={() => setEventToEdit({ id: "", nome: "", cor_primaria: "#3b82f6", cor_secundaria: "#3b82f6", logo: null })}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            size="sm"
                        >
                            <Plus className="h-4 w-4 mr-2" /> Novo Evento
                        </Button>
                    )}
                </div>
                <Button variant="ghost" size="icon" onClick={() => setOverlay("none")}>
                    <X className="h-6 w-6" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-secondary/5">
                {overlay === "festas" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-7xl mx-auto">
                        {eventos.map((evento) => (
                            <div
                                key={evento.id}
                                className="flex flex-col gap-2"
                            >
                                <Card
                                    className={`cursor-pointer transition-all hover:shadow-lg relative overflow-hidden group`}
                                    style={{ border: `2px solid ${evento.cor_primaria}` }}
                                    onClick={() => setExpandedEventId(expandedEventId === evento.id ? null : evento.id)}
                                >
                                    <CardContent className="p-0">
                                        <div className="p-4 sm:p-6 flex items-center justify-between">
                                            <div className="flex flex-col gap-1 min-w-0">
                                                <h3 className="text-lg font-bold truncate pr-2">{evento.nome}</h3>
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider">ID: {evento.id}</p>
                                            </div>
                                            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setEventToEdit(evento)
                                                    }}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setEventToDelete(evento.id)
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                                {expandedEventId === evento.id ? <ChevronDown className="h-5 w-5 opacity-50 ml-1 sm:ml-2" /> : <ChevronRight className="h-5 w-5 opacity-50 ml-1 sm:ml-2" />}
                                            </div>
                                        </div>

                                        {expandedEventId === evento.id && (
                                            <div className="px-4 pb-4 sm:px-6 sm:pb-6 pt-2 border-t border-border animate-in slide-in-from-top-2 duration-300">
                                                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                                                    <div className="p-2 sm:p-3 rounded-lg bg-secondary/20 border border-border">
                                                        <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 flex items-center gap-1 uppercase font-bold tracking-tighter">
                                                            <DollarSign className="h-3 w-3" /> Total
                                                        </p>
                                                        <p className="text-sm sm:text-lg font-bold">R$ {evento.stats?.faturamento_total?.toLocaleString() || "0"}</p>
                                                    </div>
                                                    <div className="p-2 sm:p-3 rounded-lg bg-secondary/20 border border-border">
                                                        <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 flex items-center gap-1 uppercase font-bold tracking-tighter">
                                                            <Users className="h-3 w-3" /> Equipe
                                                        </p>
                                                        <p className="text-sm sm:text-lg font-bold">{evento.stats?.colaboradores_count || "0"}</p>
                                                    </div>
                                                    <div className="p-2 sm:p-3 rounded-lg bg-secondary/20 border border-border">
                                                        <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 flex items-center gap-1 uppercase font-bold tracking-tighter">
                                                            <Ticket className="h-3 w-3" /> Ingressos
                                                        </p>
                                                        <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">{evento.stats?.ingressos_count || 0} vendidos</p>
                                                        <p className="text-sm sm:text-base font-bold">R$ {evento.stats?.faturamento_ingressos?.toLocaleString() || "0"}</p>
                                                    </div>
                                                    <div className="p-2 sm:p-3 rounded-lg bg-secondary/20 border border-border">
                                                        <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 flex items-center gap-1 uppercase font-bold tracking-tighter">
                                                            <Wine className="h-3 w-3" /> Consumo Bar
                                                        </p>
                                                        <p className="text-sm sm:text-base font-bold mt-4 sm:mt-5">R$ {evento.stats?.faturamento_bar?.toLocaleString() || "0"}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-4 space-y-2">
                                                    <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                                                        <span>Ingressos</span>
                                                        <span>Bar</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-secondary/30 rounded-full overflow-hidden flex">
                                                        <div
                                                            className="h-full bg-red-600"
                                                            style={{ width: `${evento.stats?.faturamento_total ? (evento.stats.faturamento_ingressos / evento.stats.faturamento_total) * 100 : 50}%` }}
                                                        />
                                                        <div
                                                            className="h-full bg-red-400"
                                                            style={{ width: `${evento.stats?.faturamento_total ? (evento.stats.faturamento_bar / evento.stats.faturamento_total) * 100 : 50}%` }}
                                                        />
                                                    </div>
                                                    <div className="flex justify-between text-[10px] text-muted-foreground">
                                                        <span>{Math.round(evento.stats?.faturamento_total ? (evento.stats.faturamento_ingressos / evento.stats.faturamento_total) * 100 : 0)}%</span>
                                                        <span>{Math.round(evento.stats?.faturamento_total ? (evento.stats.faturamento_bar / evento.stats.faturamento_total) * 100 : 0)}%</span>
                                                    </div>
                                                </div>

                                                <Button
                                                    className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setSelectedEventId(evento.id)
                                                        setOverlay("none")
                                                    }}
                                                >
                                                    Entrar no Painel
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="max-w-7xl mx-auto space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase text-red-500">Volume Total</CardTitle>
                                    <DollarSign className="h-4 w-4 text-red-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">R$ {totalGlobalRevenue.toLocaleString()}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Soma de todos os {eventos.length} eventos</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase text-red-500">Colaboradores Totais</CardTitle>
                                    <Users className="h-4 w-4 text-red-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">{totalGlobalColabs}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Equipe ativa em toda a plataforma</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase text-red-500">Eventos Gerenciados</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-red-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">{eventos.length}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Produções registradas no EventPro</p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="bg-card rounded-xl border border-border p-8">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-red-600" />
                                Crescimento Global
                            </h3>
                            <div className="h-[300px] flex items-center justify-center border border-dashed border-border rounded-lg bg-secondary/5">
                                <p className="text-muted-foreground text-sm">Grafico consolidado de faturamento vira aqui</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <EventFormModal
                open={eventToEdit !== null}
                onOpenChange={(open: boolean) => !open && setEventToEdit(null)}
                initialData={eventToEdit || undefined}
            />

            <ConfirmDialog
                open={eventToDelete !== null}
                onOpenChange={(open) => !open && setEventToDelete(null)}
                onConfirm={() => {
                    if (eventToDelete) removeEvento(eventToDelete)
                    setEventToDelete(null)
                }}
                title="Excluir Evento"
                description="Tem certeza? Todos os dados vinculados a este evento (vendas, ingressos, pessoas) serão apagados permanentemente."
                variant="destructive"
            />
        </div>
    )
}
