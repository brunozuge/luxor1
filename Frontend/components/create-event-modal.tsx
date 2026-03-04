"use client"

import React, { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEventData } from "@/lib/event-data"
import { toast } from "sonner"
import { Loader2, Palette } from "lucide-react"

interface CreateEventModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CreateEventModal({ open, onOpenChange }: CreateEventModalProps) {
    const { addEvento } = useEventData()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        nome: "",
        cor_primaria: "#3b82f6",
        cor_secundaria: "#1d4ed8",
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.nome) return toast.error("Nome do evento é obrigatório")

        setLoading(true)
        try {
            await addEvento({ ...formData, logo: null })
            toast.success("Evento criado com sucesso!")
            onOpenChange(false)
            setFormData({ nome: "", cor_primaria: "#3b82f6", cor_secundaria: "#1d4ed8" })
        } catch (error) {
            console.error(error)
            toast.error("Erro ao criar evento")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] sm:max-w-[425px] overflow-y-auto max-h-[90vh]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Criar Novo Evento</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="nome">Nome do Evento</Label>
                            <Input
                                id="nome"
                                placeholder="Ex: Baile do Havaí 2024"
                                value={formData.nome}
                                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="primary">Cor Primária</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="primary"
                                        type="color"
                                        className="h-10 w-12 p-1"
                                        value={formData.cor_primaria}
                                        onChange={(e) => setFormData({ ...formData, cor_primaria: e.target.value })}
                                    />
                                    <Input
                                        className="flex-1"
                                        value={formData.cor_primaria}
                                        onChange={(e) => setFormData({ ...formData, cor_primaria: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="secondary">Cor Secundária</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="secondary"
                                        type="color"
                                        className="h-10 w-12 p-1"
                                        value={formData.cor_secundaria}
                                        onChange={(e) => setFormData({ ...formData, cor_secundaria: e.target.value })}
                                    />
                                    <Input
                                        className="flex-1"
                                        value={formData.cor_secundaria}
                                        onChange={(e) => setFormData({ ...formData, cor_secundaria: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-2 flex items-center gap-3 rounded-lg border border-dashed border-border p-4 bg-muted/30">
                            <div className="p-2 rounded-md" style={{ backgroundColor: formData.cor_primaria }}>
                                <Palette className="h-5 w-5" style={{ color: formData.cor_secundaria }} />
                            </div>
                            <div className="text-sm">
                                <p className="font-medium">Visualização</p>
                                <p className="text-muted-foreground text-xs">As cores serão aplicadas em todo o sistema.</p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Criar Evento
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
