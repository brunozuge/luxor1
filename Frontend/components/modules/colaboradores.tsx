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
import { Switch } from "@/components/ui/switch"
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
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

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
    fetchedModules,
    selectedEventId
  } = useEventData()

  const isLoading = !fetchedModules.has("colaboradores")

  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, boolean>>({})
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

    const newErrors = {
      nome: !form.nome,
      cargo: !form.cargo,
      telefone: !form.telefone
    }
    setErrors(newErrors)

    if (Object.values(newErrors).some(v => v)) {
      toast.error("Preencha todos os campos destacados em vermelho.")
      return
    }

    // Uniqueness check (Frontend)
    const alreadyExists = colaboradores.find(c =>
      c.telefone.replace(/\D/g, "") === form.telefone.replace(/\D/g, "") && c.id !== editingId
    )
    if (alreadyExists) {
      toast.error(`Este telefone já esta em uso por ${alreadyExists.nome}.`)
      return
    }
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

  function handleDeleteColaborador() {
    if (confirmDeleteId) {
      removeColaborador(confirmDeleteId)
      setConfirmDeleteId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-foreground">Colaboradores</h1>
          <p className="text-sm text-muted-foreground">Gestão de equipe e permissões</p>
        </div>

        {!selectedEventId && (
          <Alert className="border-warning bg-warning/10">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertTitle className="text-warning">Nenhum Evento Selecionado</AlertTitle>
            <AlertDescription className="text-warning/80">
              Selecione um evento na barra lateral para gerenciar colaboradores.
            </AlertDescription>
          </Alert>
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Dialog open={dialogOpen} onOpenChange={(v) => {
            if (v && !selectedEventId) {
              toast.error("Selecione um evento primeiro")
              return
            }
            setDialogOpen(v)
            if (!v) {
              setEditingId(null)
              setErrors({})
              setForm({ nome: "", cargo: "barman", telefone: "", ativo: true })
            }
          }}>
            <DialogTrigger asChild>
              <Button
                onClick={openNewDialog}
                disabled={!selectedEventId}
                title={!selectedEventId ? "Selecione um evento primeiro" : ""}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Colaborador
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-md bg-card text-card-foreground p-0 overflow-hidden flex flex-col max-h-[90vh]">
              <DialogHeader className="p-6 pb-2">
                <DialogTitle>
                  {editingId ? "Editar Colaborador" : "Adicionar Colaborador"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 pt-2 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Nome *</Label>
                  <Input
                    id="nome"
                    value={form.nome}
                    onChange={(e) => {
                      setForm({ ...form, nome: e.target.value })
                      if (errors.nome) setErrors(prev => ({ ...prev, nome: false }))
                    }}
                    placeholder="Nome do colaborador"
                    className={errors.nome ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="cargo">Cargo *</Label>
                    <Select
                      value={form.cargo}
                      onValueChange={(v) => {
                        setForm({ ...form, cargo: v as any })
                        if (errors.cargo) setErrors(prev => ({ ...prev, cargo: false }))
                      }}
                    >
                      <SelectTrigger className={errors.cargo ? "border-destructive focus-visible:ring-destructive" : ""}>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="barman">Barman</SelectItem>
                        <SelectItem value="garcom">Garçom</SelectItem>
                        <SelectItem value="porteiro">Porteiro</SelectItem>
                        <SelectItem value="promoter">Promoter</SelectItem>
                        <SelectItem value="seguranca">Segurança</SelectItem>
                        <SelectItem value="caixa">Caixa</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="tel">Telefone *</Label>
                    <Input
                      id="tel"
                      value={form.telefone}
                      onChange={(e) => {
                        const onlyNums = e.target.value.replace(/\D/g, "")
                        setForm({ ...form, telefone: onlyNums })
                        if (errors.telefone) setErrors(prev => ({ ...prev, telefone: false }))
                      }}
                      placeholder="(00) 00000-0000"
                      className={errors.telefone ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex flex-col gap-0.5">
                    <Label>Colaborador Ativo</Label>
                    <p className="text-xs text-muted-foreground">
                      Determina se o colaborador aparece nas listas
                    </p>
                  </div>
                  <Switch
                    checked={form.ativo}
                    onCheckedChange={(v) => setForm({ ...form, ativo: v })}
                  />
                </div>
                <div className="pt-2 sticky bottom-0 bg-card">
                  <Button type="submit" className="w-full">
                    {editingId ? "Salvar" : "Adicionar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className={`bg-card border-border ${i === 3 ? "col-span-2 sm:col-span-1" : ""}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 pt-4">
              {isLoading && colaboradores.length === 0 ? (
                <>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </>
              ) : i === 1 ? (
                <>
                  <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-tight">Total Equipe</CardTitle>
                  <UserCog className="h-4 w-4 text-primary shrink-0" />
                </>
              ) : i === 2 ? (
                <>
                  <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-tight">Ativos</CardTitle>
                  <div className="h-2 w-2 rounded-full bg-success shrink-0" />
                </>
              ) : (
                <>
                  <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-tight">Inativos</CardTitle>
                  <div className="h-2 w-2 rounded-full bg-destructive shrink-0" />
                </>
              )}
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              {isLoading && colaboradores.length === 0 ? (
                <Skeleton className="h-8 w-16" />
              ) : i === 1 ? (
                <div className="text-xl sm:text-2xl font-bold">{colaboradores.length}</div>
              ) : i === 2 ? (
                <div className="text-xl sm:text-2xl font-bold text-success">{ativos}</div>
              ) : (
                <div className="text-xl sm:text-2xl font-bold text-destructive">{inativos}</div>
              )}
            </CardContent>
          </Card>
        ))}
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
              <TableRow className="border-border hover:bg-transparent text-[10px] uppercase">
                <TableHead>Nome</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead className="hidden sm:table-cell">Telefone</TableHead>
                <TableHead className="hidden md:table-cell">Vendas</TableHead>
                <TableHead className="hidden md:table-cell">Faturado</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && colaboradores.length === 0 ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : (
                filtered.map((c) => (
                  <TableRow key={c.id} className="border-border">
                    <TableCell className="font-medium text-xs">
                      <div className="flex flex-col">
                        <span>{c.nome}</span>
                        <span className="text-[10px] sm:hidden text-muted-foreground">{c.telefone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${cargoColors[c.cargo]} text-[10px] px-1.5 h-5`}
                      >
                        {cargoLabels[c.cargo]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {c.telefone ? (
                        <span className="flex items-center gap-1 text-muted-foreground text-xs">
                          <Phone className="h-3 w-3" />
                          {c.telefone}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs hidden md:table-cell">{c.qtdVendas}</TableCell>
                    <TableCell className="font-semibold text-xs hidden md:table-cell">
                      {c.totalVendas > 0
                        ? `R$ ${c.totalVendas.toLocaleString("pt-BR")}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={c.ativo}
                        onCheckedChange={() => handleToggleAtivo(c.id)}
                        className="scale-75 origin-left"
                      />
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
                          onClick={() => setConfirmDeleteId(c.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remover</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
              {!isLoading && filtered.length === 0 && (
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

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        onConfirm={handleDeleteColaborador}
        title="Excluir Colaborador"
        description="Tem certeza que deseja remover este colaborador? Esta acao nao pode ser desfeita."
      />
    </div>
  )
}
