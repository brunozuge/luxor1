"use client"

import React, { useState } from "react"
import { useEventData, ListaItem } from "@/lib/event-data"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Users, Search, X, Pencil, FileText } from "lucide-react"
import { ConfirmDialog } from "@/components/confirm-dialog"

export function ListaModule() {
    const { listas, addListaItem, updateListaItem, removeListaItem } = useEventData()
    const [searchTerm, setSearchTerm] = useState("")
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<ListaItem | null>(null)
    const [itemToDelete, setItemToDelete] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        nome: "",
        descricao: ""
    })

    const filteredList = listas.filter(item =>
        item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    )

    function handleOpenCreate() {
        setEditingItem(null)
        setFormData({ nome: "", descricao: "" })
        setDialogOpen(true)
    }

    function handleEdit(item: ListaItem) {
        setEditingItem(item)
        setFormData({ nome: item.nome, descricao: item.descricao })
        setDialogOpen(true)
    }

    async function handleSubmit() {
        if (!formData.nome) {
            toast.error("Insira o nome do grupo.")
            return
        }

        if (editingItem) {
            await updateListaItem(editingItem.id, formData)
        } else {
            await addListaItem(formData)
        }

        setDialogOpen(false)
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Listas de Convidados</h1>
                    <p className="text-sm text-muted-foreground">Gerencie grupos e listas nominais</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleOpenCreate} className="bg-red-600 hover:bg-red-700 text-white">
                        <Plus className="mr-2 h-4 w-4" /> Criar Nova Lista
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total de Listas</CardTitle>
                        <FileText className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{listas.length}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-secondary/10 flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <input
                        className="bg-transparent border-none focus:outline-none text-sm w-full"
                        placeholder="Buscar por grupo ou nome..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <Button variant="ghost" size="icon" onClick={() => setSearchTerm("")} className="h-6 w-6">
                            <X className="h-3 w-3" />
                        </Button>
                    )}
                </div>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Grupo / Lista</TableHead>
                            <TableHead>Nomes</TableHead>
                            <TableHead className="w-[100px] text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredList.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                    {searchTerm ? "Nenhuma lista encontrada." : "Nenhuma lista cadastrada."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredList.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-bold align-top py-4">{item.nome}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground max-w-md py-4">
                                        <div className="whitespace-pre-wrap line-clamp-3">
                                            {item.descricao || <span className="italic opacity-50">Sem nomes cadastrados</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right align-top py-4">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(item)}
                                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setItemToDelete(item.id)}
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-lg bg-card border-border">
                    <DialogHeader>
                        <DialogTitle>{editingItem ? "Editar Lista" : "Criar Nova Lista"}</DialogTitle>
                        <DialogDescription>
                            {editingItem ? "Edite o nome ou os integrantes da lista." : "Crie um novo grupo de convidados com nome e lista de integrantes."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Nome do Grupo (ex: VIP, Promoters, Staff)</Label>
                            <Input
                                placeholder="Nome da lista..."
                                value={formData.nome}
                                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Nomes dos Integrantes (Pode colar vários de uma vez)</Label>
                            <textarea
                                className="min-h-[300px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                placeholder={"Insira os nomes aqui...\nEx:\nJoão Silva\nMaria Santos\nPedro Oliveira"}
                                value={formData.descricao}
                                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                            />
                        </div>
                        <Button
                            onClick={handleSubmit}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {editingItem ? "Salvar Alterações" : "Criar Lista"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={itemToDelete !== null}
                onOpenChange={(open) => !open && setItemToDelete(null)}
                onConfirm={() => {
                    if (itemToDelete) removeListaItem(itemToDelete)
                    setItemToDelete(null)
                }}
                title="Excluir Lista"
                description="Deseja realmente excluir esta lista de nomes? Esta ação não pode ser desfeita."
                confirmText="Excluir"
                variant="destructive"
            />
        </div>
    )
}
