"use client"

import React, { useState } from "react"
import { useEventData, type CargoColaborador } from "@/lib/event-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, UserCog, Trash2, Pencil, Phone } from "lucide-react"

const cargoLabels: Record<CargoColaborador, string> = {
  barman: "Barman",
  garcom: "Garcom",
  porteiro: "Porteiro",
  promoter: "Promoter",
  seguranca: "Seguranca",
  caixa: "Caixa",
  outro: "Outro",
}

const cargoColors: Record<CargoColaborador, string> = {
  barman: "bg-primary/20 text-primary border-primary/30",
  garcom: "bg-accent/20 text-accent border-accent/30",
  porteiro: "bg-muted text-muted-foreground border-border",
  promoter: "bg-success/20 text-success border-success/30",
  seguranca: "bg-destructive/20 text-destructive border-destructive/30",
  caixa: "bg-accent/20 text-accent border-accent/30",
  outro: "bg-muted text-muted-foreground border-border",
}

export function ColaboradoresModule() {
  const {
    colaboradores,
    barSales,
    addColaborador,
    updateColaborador,
    removeColaborador,
  } = useEventData()

  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    nome: "",
    cargo: "barman" as CargoColaborador,
    telefone: "",
    ativo: true,
  })
  const [cargoFilter, setCargoFilter] = useState<string>("todos")

  const ativos = colaboradores.filter((c) => c.ativo).length
  const inativos = colaboradores.filter((c) => !c.ativo).length

  // Sales per colaborador
  const salesByColaborador = colaboradores.map((c) => {
    const sales = barSales.filter((s) => s.vendedor === c.nome)
    const totalVendas = sales.reduce((sum, s) => sum + s.valorTotal, 0)
    return { ...c, totalVendas, qtdVendas: sales.length }
  })

  const filtered = salesByColaborador.filter((c) => {
    const matchSearch =
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.telefone.includes(search)
    const matchCargo = cargoFilter === "todos" || c.cargo === cargoFilter
    return matchSearch && matchCargo
  })

  function openNewDialog() {
    setEditingId(null)
    setForm({ nome: "", cargo: "barman", telefone: "", ativo: true })
    setDialogOpen(true)
  }

  function openEditDialog(id: string) {
    const col = colaboradores.find((c) => c.id === id)
    if (!col) return
    setEditingId(id)
    setForm({ nome: col.nome, cargo: col.cargo, telefone: col.telefone, ativo: col.ativo })
    setDialogOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome) return
    if (editingId) {
      updateColaborador(editingId, form)
    } else {
      addColaborador(form)
    }
    setForm({ nome: "", cargo: "barman", telefone: "", ativo: true })
    setEditingId(null)
    setDialogOpen(false)
  }

  function handleToggleAtivo(id: string) {
    const col = colaboradores.find((c) => c.id === id)
    if (!col) return
    updateColaborador(id, { ativo: !col.ativo })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Colaboradores</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie sua equipe de trabalho
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Colaborador
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-card text-card-foreground">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar Colaborador" : "Adicionar Colaborador"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Nome *</Label>
                <Input
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Cargo *</Label>
                <Select
                  value={form.cargo}
                  onValueChange={(v) =>
                    setForm({ ...form, cargo: v as CargoColaborador })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(cargoLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Telefone</Label>
                <Input
                  value={form.telefone}
                  onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="flex items-center gap-3">
                <Label>Status:</Label>
                <Button
                  type="button"
                  variant={form.ativo ? "default" : "outline"}
                  size="sm"
                  onClick={() => setForm({ ...form, ativo: !form.ativo })}
                  className={form.ativo ? "" : "bg-transparent"}
                >
                  {form.ativo ? "Ativo" : "Inativo"}
                </Button>
              </div>
              <Button type="submit" className="w-full">
                {editingId ? "Salvar" : "Adicionar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{colaboradores.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{ativos}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{inativos}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou telefone..."
            className="pl-10"
          />
        </div>
        <Select value={cargoFilter} onValueChange={setCargoFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os cargos</SelectItem>
            {Object.entries(cargoLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="bg-card border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Nome</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Vendas (Bar)</TableHead>
                <TableHead>Faturado</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Acoes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} className="border-border">
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cargoColors[c.cargo]}
                    >
                      {cargoLabels[c.cargo]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {c.telefone ? (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {c.telefone}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono">{c.qtdVendas}</TableCell>
                  <TableCell className="font-semibold">
                    {c.totalVendas > 0
                      ? `R$ ${c.totalVendas.toLocaleString("pt-BR")}`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => handleToggleAtivo(c.id)}
                      className="cursor-pointer"
                    >
                      <Badge
                        variant="outline"
                        className={
                          c.ativo
                            ? "bg-success/20 text-success border-success/30"
                            : "bg-destructive/20 text-destructive border-destructive/30"
                        }
                      >
                        {c.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEditDialog(c.id)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:text-destructive"
                        onClick={() => removeColaborador(c.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remover</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Nenhum colaborador encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
