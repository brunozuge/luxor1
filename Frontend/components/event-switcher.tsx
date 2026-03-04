"use client"

import { ChevronDown, Crown, Plus } from "lucide-react"
import { useEventData } from "@/lib/event-data"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { CreateEventModal } from "./create-event-modal"
import { Skeleton } from "./ui/skeleton"

export function EventSwitcher({ className }: { className?: string }) {
    const { eventos, selectedEventId, setSelectedEventId, currentEvento, loading } = useEventData()
    const [showCreateModal, setShowCreateModal] = useState(false)

    if (loading && eventos.length === 0) {
        return (
            <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-32" />
            </div>
        )
    }

    return (
        <div className={className}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2 px-2 hover:bg-accent ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                        <div className="flex h-5 w-5 items-center justify-center rounded bg-primary text-primary-foreground">
                            <Crown className="size-3" />
                        </div>
                        <span className="max-w-[120px] truncate text-sm font-medium">
                            {currentEvento?.nome || "Selecionar Evento"}
                        </span>
                        <ChevronDown className="size-3 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Meus Eventos</div>
                    {eventos.map((evento) => (
                        <DropdownMenuItem
                            key={evento.id}
                            className="gap-2 cursor-pointer"
                            onClick={() => setSelectedEventId(evento.id)}
                        >
                            <div
                                className="size-3 rounded-full border border-border"
                                style={{ backgroundColor: evento.cor_primaria }}
                            />
                            <span className={selectedEventId === evento.id ? "font-bold" : ""}>{evento.nome}</span>
                            {selectedEventId === evento.id && <div className="ml-auto size-1.5 rounded-full bg-primary" />}
                        </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => setShowCreateModal(true)}>
                        <Plus className="size-4" />
                        <span className="font-medium">Criar Evento</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <CreateEventModal open={showCreateModal} onOpenChange={setShowCreateModal} />
        </div>
    )
}
