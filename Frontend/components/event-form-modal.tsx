"use client"

import React, { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useEventData, Evento } from "@/lib/event-data"
import { toast } from "sonner"
import { Loader2, Palette } from "lucide-react"

interface EventFormModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialData?: Evento
}

export function EventFormModal({ open, onOpenChange, initialData }: EventFormModalProps) {
    const { addEvento, updateEvento } = useEventData()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        nome: "",
        cor_primaria: "#3b82f6",
    })

    const isEdit = !!(initialData && initialData.id)

    useEffect(() => {
        if (initialData) {
            setFormData({
                nome: initialData.nome || "",
                cor_primaria: initialData.cor_primaria || "#3b82f6",
            })
        } else {
            setFormData({
                nome: "",
                cor_primaria: "#3b82f6",
            })
        }
    }, [initialData, open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.nome) return toast.error("Nome do evento é obrigatório")

        setLoading(true)
        try {
            if (isEdit && initialData?.id) {
                await updateEvento(initialData.id, formData)
                toast.success("Evento atualizado com sucesso!")
            } else {
                await addEvento({ ...formData, cor_secundaria: formData.cor_primaria, logo: null })
                toast.success("Evento criado com sucesso!")
            }
            onOpenChange(false)
        } catch (error) {
            console.error(error)
            toast.error(isEdit ? "Erro ao atualizar evento" : "Erro ao criar evento")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] sm:max-w-[425px] overflow-y-auto max-h-[90vh] z-[110]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{isEdit ? "Editar Evento" : "Criar Novo Evento"}</DialogTitle>
                        <DialogDescription>
                            {isEdit ? "Atualize as informações principais da sua festa." : "Preencha o nome e escolha a cor de destaque para o seu evento."}
                        </DialogDescription>
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
                        <div className="grid gap-2">
                            <Label htmlFor="primary">Cor do Evento</Label>
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

                        <div className="mt-2 flex items-center gap-3 rounded-lg border border-dashed border-border p-4 bg-muted/30">
                            <div className="p-2 rounded-md" style={{ backgroundColor: formData.cor_primaria }}>
                                <Palette className="h-5 w-5 text-white" />
                            </div>
                            <div className="text-sm">
                                <p className="font-medium">Visualização</p>
                                <p className="text-muted-foreground text-xs">Esta cor será usada para identificar sua festa.</p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEdit ? "Salvar Alterações" : "Criar Evento"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
