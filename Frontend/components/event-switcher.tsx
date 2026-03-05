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
    const { currentEvento, setOverlay } = useEventData()

    return (
        <div className={className}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2 px-2 hover:bg-accent hover:text-accent-foreground ring-offset-background transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-red-600 text-white shadow-sm shadow-red-500/20">
                            <Crown className="size-3.5" />
                        </div>
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Painel</span>
                            <span className="max-w-[120px] truncate text-sm font-semibold">
                                {currentEvento?.nome || "Evento"}
                            </span>
                        </div>
                        <ChevronDown className="size-3.5 opacity-30" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 p-2 space-y-1">
                    <DropdownMenuItem
                        className="flex items-center gap-3 p-3 cursor-pointer rounded-lg hover:bg-red-50 focus:bg-red-50"
                        onClick={() => setOverlay("festas")}
                    >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600/10 text-red-600">
                            <Calendar className="size-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-sm">Festas</span>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Trocar ou Criar</span>
                        </div>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        className="flex items-center gap-3 p-3 cursor-pointer rounded-lg hover:bg-red-50 focus:bg-red-50"
                        onClick={() => setOverlay("eventpro")}
                    >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600/10 text-red-600">
                            <Crown className="size-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-sm">EventPro</span>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Relatório Geral</span>
                        </div>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

import { Calendar } from "lucide-react"
