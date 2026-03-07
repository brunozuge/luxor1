"use client"

import React, { useState } from "react"
import { useEventData, Evento } from "@/lib/event-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
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

const EventCard = React.memo(({
    evento,
    isExpanded,
    onExpand,
    onEdit,
    onDelete,
    onEnter
}: {
    evento: any,
    isExpanded: boolean,
    onExpand: (id: string) => void,
    onEdit: (evento: any, e: React.MouseEvent) => void,
    onDelete: (id: string, e: React.MouseEvent) => void,
    onEnter: (id: string, e: React.MouseEvent) => void
}) => {
    return (
        <Card
            className={`cursor-pointer transition-all hover:shadow-lg relative overflow-hidden group`}
            style={{ border: `2px solid ${evento.cor_primaria}` }}
            onClick={() => onExpand(evento.id)}
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
                            onClick={(e) => onEdit(evento, e)}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={(e) => onDelete(evento.id, e)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        {isExpanded ? <ChevronDown className="h-5 w-5 opacity-50 ml-1 sm:ml-2" /> : <ChevronRight className="h-5 w-5 opacity-50 ml-1 sm:ml-2" />}
                    </div>
                </div>

                {isExpanded && (
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
                                    <Wine className="h-3 w-3" /> Bar
                                </p>
                                <p className="text-sm sm:text-base font-bold mt-4 sm:mt-5">R$ {evento.stats?.faturamento_bar?.toLocaleString() || "0"}</p>
                            </div>
                            <div className="p-2 sm:p-3 rounded-lg bg-secondary/20 border border-border col-span-2">
                                <div className="flex justify-between items-center mb-1">
                                    <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 uppercase font-bold tracking-tighter">
                                        <Wine className="h-3 w-3 text-red-500" /> Resumo VIP / Camarote
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                    <div>
                                        <p className="text-[10px] text-muted-foreground">Mesas</p>
                                        <p className="text-sm font-bold">{evento.stats?.mesas_count || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-muted-foreground">Garrafas</p>
                                        <p className="text-sm font-bold">{evento.stats?.garrafas_count || 0}</p>
                                    </div>
                                </div>
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
                            onClick={(e) => onEnter(evento.id, e)}
                        >
                            Entrar no Painel
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
})

export function FullScreenOverlays({ onNavigate }: { onNavigate?: (section: string) => void }) {
    const { overlay, setOverlay, eventos, setSelectedEventId, removeEvento, isGlobalLoading } = useEventData()
    const [expandedEventId, setExpandedEventId] = useState<string | null>(null)
    const [eventToEdit, setEventToEdit] = useState<Evento | null>(null)
    const [eventToDelete, setEventToDelete] = useState<string | null>(null)

    const handleExpand = React.useCallback((id: string) => {
        setExpandedEventId(prev => prev === id ? null : id)
    }, [])

    const handleEdit = React.useCallback((evento: any, e: React.MouseEvent) => {
        e.stopPropagation()
        setEventToEdit(evento)
    }, [])

    const handleDelete = React.useCallback((id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setEventToDelete(id)
    }, [])

    const handleEnter = React.useCallback((id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setSelectedEventId(id)
        setOverlay("none")
        if (onNavigate) onNavigate("dashboard")
    }, [setSelectedEventId, setOverlay, onNavigate])

    const globalStats = React.useMemo(() => {
        const totalRevenue = eventos.reduce((sum, e) => sum + (e.stats?.faturamento_total || 0), 0)
        const totalColabs = eventos.reduce((sum, e) => sum + (e.stats?.colaboradores_count || 0), 0)
        const totalTickets = eventos.reduce((sum, e) => sum + (e.stats?.ingressos_count || 0), 0)
        const totalTables = eventos.reduce((sum, e) => sum + (e.stats?.mesas_count || 0), 0)
        const totalBottles = eventos.reduce((sum, e) => sum + (e.stats?.garrafas_count || 0), 0)

        const chartData = eventos.map(e => ({
            name: e.nome,
            value: e.stats?.faturamento_total || 0,
            color: e.cor_primaria
        })).sort((a, b) => b.value - a.value).slice(0, 10)

        const maxChartValue = Math.max(...chartData.map(d => d.value), 1)

        return { totalRevenue, totalColabs, totalTickets, totalTables, totalBottles, chartData, maxChartValue }
    }, [eventos])

    if (overlay === "none") return null

    const { totalRevenue, totalColabs, totalTickets, totalTables, totalBottles, chartData, maxChartValue } = globalStats

    return (
        <div className="flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold">
                        {overlay === "festas" ? "Minhas Festas" : "Eventos - Geral"}
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
                <div className="flex items-center gap-3">
                    {isGlobalLoading && (
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground animate-pulse">
                            <TrendingUp className="h-3 w-3 animate-bounce" />
                            Atualizando dados globais...
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {isGlobalLoading && eventos.length === 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-7xl mx-auto">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Card key={i} className="h-48 animate-pulse bg-secondary/10" />
                        ))}
                    </div>
                ) : overlay === "festas" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-7xl mx-auto">
                        {eventos.map((evento) => (
                            <div
                                key={evento.id}
                                className="flex flex-col gap-2"
                            >
                                <EventCard
                                    evento={evento}
                                    isExpanded={expandedEventId === evento.id}
                                    onExpand={handleExpand}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    onEnter={handleEnter}
                                />
                            </div>
                        ))}
                    </div>
                ) : (isGlobalLoading && totalRevenue === 0) ? (
                    <div className="max-w-7xl mx-auto space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                            {[1, 2, 3, 4].map((i) => (
                                <Card key={i} className="animate-pulse">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-4 w-4 rounded-full" />
                                    </CardHeader>
                                    <CardContent>
                                        <Skeleton className="h-8 w-32 mb-2" />
                                        <Skeleton className="h-3 w-20" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <Card className="p-6 sm:p-8">
                            <Skeleton className="h-6 w-48 mb-6" />
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="space-y-2">
                                        <div className="flex justify-between">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-4 w-12" />
                                        </div>
                                        <Skeleton className="h-3 w-full rounded-full" />
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                ) : (
                    <div className="max-w-7xl mx-auto space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                            <Card className="bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase text-red-500">Volume Total</CardTitle>
                                    <DollarSign className="h-4 w-4 text-red-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">R$ {totalRevenue.toLocaleString()}</div>
                                    <p className="text-[10px] text-muted-foreground mt-1">Soma de {eventos.length} eventos</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase text-red-500">Público Total</CardTitle>
                                    <Users className="h-4 w-4 text-red-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{totalTickets}</div>
                                    <p className="text-[10px] text-muted-foreground mt-1">Ingressos emitidos no total</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase text-red-500">Equipe Global</CardTitle>
                                    <AlertTriangle className="h-4 w-4 text-red-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{totalColabs}</div>
                                    <p className="text-[10px] text-muted-foreground mt-1">Colaboradores ativos</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20">
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase text-red-500">VIP & Camarote</CardTitle>
                                    <TrendingUp className="h-4 w-4 text-red-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{totalTables} Mesas</div>
                                    <p className="text-[10px] text-muted-foreground mt-1">{totalBottles} Garrafas servidas</p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="bg-card rounded-xl border border-border p-6 sm:p-8">
                            <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-red-600" />
                                Performance por Evento (Faturamento)
                            </h3>

                            <div className="space-y-6">
                                {chartData.length > 0 ? (
                                    chartData.map((data, idx) => (
                                        <div key={idx} className="space-y-2">
                                            <div className="flex justify-between items-end">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold">{data.name}</span>
                                                    <span className="text-xs text-muted-foreground">R$ {data.value.toLocaleString()}</span>
                                                </div>
                                                <span className="text-xs font-bold text-muted-foreground">
                                                    {Math.round((data.value / (totalRevenue || 1)) * 100) || 0}% de participação
                                                </span>
                                            </div>
                                            <div className="h-3 w-full bg-secondary/30 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full transition-all duration-1000 ease-out rounded-full"
                                                    style={{
                                                        width: `${(data.value / maxChartValue) * 100}%`,
                                                        backgroundColor: data.color,
                                                        boxShadow: `0 0 10px ${data.color}40`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="h-[200px] flex items-center justify-center border border-dashed border-border rounded-lg bg-secondary/5">
                                        <p className="text-muted-foreground text-sm font-medium italic">Nenhum dado de faturamento disponível ainda.</p>
                                    </div>
                                )}
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
