"use client"

import React from "react"

import { useState } from "react"
import { useEventData } from "@/lib/event-data"
import { toast } from "sonner"
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
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Crown, Wine, UserPlus, X, Trophy, Pencil, DollarSign } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export function CamaroteModule() {
  const {
    camaroteTables,
    pessoas,
    barSales,
    addCamaroteTable,
    updateCamaroteTable,
    addGarrafaToCamarote,
    addPessoaToCamarote,
    removePessoaFromCamarote,
    removeGarrafaFromCamarote,
    colaboradores,
    products,
    loading,
  } = useEventData()

  const [tableDialogOpen, setTableDialogOpen] = useState(false)
  const [garrafaDialogOpen, setGarrafaDialogOpen] = useState(false)
  const [addPersonDialogOpen, setAddPersonDialogOpen] = useState(false)
  const [selectedTableId, setSelectedTableId] = useState("")
  const [tableForm, setTableForm] = useState({ nome: "", garcom: "" })
  const [garrafaForm, setGarrafaForm] = useState("")
  const [personForm, setPersonForm] = useState("")
  const [editingTableId, setEditingTableId] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  // Calculate spending per table
  function getTableSpending(tableId: string) {
    const table = camaroteTables.find((t) => t.id === tableId)
    if (!table) return 0
    return table.pessoaIds.reduce((sum, pid) => {
      return sum + barSales.filter((s) => s.pessoaId === pid).reduce((s, sale) => s + sale.valorTotal, 0)
    }, 0)
  }

  // Ranking of top spenders across all camarote tables
  const allCamarotePessoas = camaroteTables.flatMap((t) => t.pessoaIds)
  const camaroteSpending = allCamarotePessoas.reduce<Record<string, number>>((acc, pid) => {
    acc[pid] = (acc[pid] || 0) + barSales.filter((s) => s.pessoaId === pid).reduce((s, sale) => s + sale.valorTotal, 0)
    return acc
  }, {})
  const spenderRanking = Object.entries(camaroteSpending).sort(([, a], [, b]) => b - a)

  const totalGarrafas = camaroteTables.reduce((sum, t) => sum + t.garrafas.length, 0)
  const totalCamaroteRevenue = camaroteTables.reduce((sum, t) => sum + getTableSpending(t.id), 0)

  function handleAddTable(e: React.FormEvent) {
    e.preventDefault()

    const newErrors = {
      nome: !tableForm.nome,
      garcom: !tableForm.garcom
    }
    setErrors(newErrors)

    if (Object.values(newErrors).some(v => v)) {
      toast.error("Preencha os campos obrigatorios da mesa.")
      return
    }

    if (editingTableId) {
      updateCamaroteTable(editingTableId, tableForm)
    } else {
      addCamaroteTable(tableForm)
    }
    setTableForm({ nome: "", garcom: "" })
    setEditingTableId(null)
    setErrors({})
    setTableDialogOpen(false)
  }

  function openEditTable(table: any) {
    setEditingTableId(table.id)
    setTableForm({ nome: table.nome, garcom: table.garcom })
    setTableDialogOpen(true)
  }

  function handleAddGarrafa(e: React.FormEvent) {
    e.preventDefault()

    if (!garrafaForm) {
      setErrors({ garrafa: true })
      toast.error("O nome da garrafa e obrigatorio.")
      return
    }
    if (!selectedTableId) return toast.error("Erro interno: Mesa nao selecionada.")

    addGarrafaToCamarote(selectedTableId, garrafaForm)
    setGarrafaForm("")
    setErrors({})
    setGarrafaDialogOpen(false)
  }

  function handleAddPerson(e: React.FormEvent) {
    e.preventDefault()

    if (!personForm) {
      setErrors({ person: true })
      toast.error("Selecione uma pessoa para adicionar.")
      return
    }
    if (!selectedTableId) return toast.error("Erro interno: Mesa nao selecionada.")

    addPessoaToCamarote(selectedTableId, personForm)
    setPersonForm("")
    setErrors({})
    setAddPersonDialogOpen(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Camarote / VIP</h1>
          <p className="text-sm text-muted-foreground">
            Gestao exclusiva de mesas e consumo
          </p>
        </div>
        <Dialog open={tableDialogOpen} onOpenChange={(v) => {
          setTableDialogOpen(v)
          if (!v) {
            setEditingTableId(null)
            setErrors({})
            setTableForm({ nome: "", garcom: "" })
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingTableId(null)
              setTableForm({ nome: "", garcom: "" })
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Mesa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-card text-card-foreground">
            <DialogHeader>
              <DialogTitle>{editingTableId ? "Editar Mesa" : "Adicionar Mesa"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddTable} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Nome da Mesa *</Label>
                <Input
                  value={tableForm.nome}
                  onChange={(e) => {
                    setTableForm({ ...tableForm, nome: e.target.value })
                    if (errors.nome) setErrors(prev => ({ ...prev, nome: false }))
                  }}
                  placeholder="Ex: Mesa 3"
                  className={errors.nome ? "border-destructive focus-visible:ring-destructive" : ""}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Garcom Responsavel *</Label>
                <Select
                  value={tableForm.garcom}
                  onValueChange={(v) => {
                    setTableForm({ ...tableForm, garcom: v })
                    if (errors.garcom) setErrors(prev => ({ ...prev, garcom: false }))
                  }}
                >
                  <SelectTrigger className={errors.garcom ? "border-destructive focus-visible:ring-destructive" : ""}>
                    <SelectValue placeholder="Selecione o garcom" />
                  </SelectTrigger>
                  <SelectContent>
                    {colaboradores
                      .filter((c) => c.ativo)
                      .map((c) => (
                        <SelectItem key={c.id} value={c.nome}>
                          {c.nome} ({c.cargo})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">{editingTableId ? "Salvar Alteracoes" : "Adicionar"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              {loading && camaroteTables.length === 0 ? (
                <>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </>
              ) : i === 1 ? (
                <>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Mesas</CardTitle>
                  <Crown className="h-4 w-4 text-primary" />
                </>
              ) : i === 2 ? (
                <>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Garrafas</CardTitle>
                  <Wine className="h-4 w-4 text-secondary" />
                </>
              ) : (
                <>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Consumo</CardTitle>
                  <DollarSign className="h-4 w-4 text-success" />
                </>
              )}
            </CardHeader>
            <CardContent>
              {loading && camaroteTables.length === 0 ? (
                <Skeleton className="h-8 w-20" />
              ) : i === 1 ? (
                <div className="text-2xl font-bold">{camaroteTables.length}</div>
              ) : i === 2 ? (
                <div className="text-2xl font-bold">{totalGarrafas}</div>
              ) : (
                <div className="text-2xl font-bold text-success">
                  R$ {totalCamaroteRevenue.toLocaleString("pt-BR")}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {loading && camaroteTables.length === 0 ? (
          [1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-card border-border">
              <CardHeader className="flex flex-row items-start justify-between">
                <div className="flex-1">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24 mt-2" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))
        ) : (
          camaroteTables.map((table) => {
            const tableSpend = getTableSpending(table.id)
            return (
              <Card key={table.id} className="bg-card border-border">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-primary" />
                      {table.nome}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-sm text-muted-foreground">
                        Garcom: {table.garcom || "Nao definido"}
                      </p>
                      {table.garcom && (
                        <button
                          type="button"
                          onClick={() => updateCamaroteTable(table.id, { garcom: "" })}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          title="Remover garcom"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <Badge className="bg-primary text-primary-foreground">
                    R$ {tableSpend.toLocaleString("pt-BR")}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8 ml-2" onClick={() => openEditTable(table)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {/* Pessoas na mesa */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-muted-foreground">Pessoas</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTableId(table.id)
                          setAddPersonDialogOpen(true)
                        }}
                        className="h-7 text-xs"
                      >
                        <UserPlus className="mr-1 h-3 w-3" />
                        Adicionar
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {table.pessoaIds.map((pid) => {
                        const pessoa = pessoas.find((p) => p.id === pid)
                        return (
                          <Badge
                            key={pid}
                            variant="outline"
                            className="border-border flex items-center gap-1"
                          >
                            {pessoa?.nome || "-"}
                            <button
                              type="button"
                              onClick={() => removePessoaFromCamarote(table.id, pid)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        )
                      })}
                      {table.pessoaIds.length === 0 && (
                        <span className="text-xs text-muted-foreground">Nenhuma pessoa</span>
                      )}
                    </div>
                  </div>

                  {/* Garrafas */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-muted-foreground">Garrafas</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTableId(table.id)
                          setGarrafaDialogOpen(true)
                        }}
                        className="h-7 text-xs"
                      >
                        <Wine className="mr-1 h-3 w-3" />
                        Adicionar
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {table.garrafas.map((g, i) => (
                        <Badge key={`${g}-${i}`} className="bg-secondary text-secondary-foreground flex items-center gap-1">
                          {g}
                          <button
                            type="button"
                            onClick={() => removeGarrafaFromCamarote(table.id, i)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      {table.garrafas.length === 0 && (
                        <span className="text-xs text-muted-foreground">Nenhuma garrafa</span>
                      )}
                    </div>
                  </div>

                  {/* Historico de Consumo */}
                  <div className="mt-2 border-t border-border pt-4">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3">Consumo Recente</h4>
                    <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto pr-2">
                      {table.pessoaIds.flatMap(pid =>
                        barSales.filter(s => s.pessoaId === pid)
                      ).sort((a, b) => b.hora.localeCompare(a.hora)).slice(0, 5).map(sale => {
                        const prod = products.find(p => p.id === sale.productId)
                        const cli = pessoas.find(p => p.id === sale.pessoaId)
                        return (
                          <div key={sale.id} className="flex items-center justify-between text-xs bg-muted/30 p-2 rounded">
                            <div className="flex flex-col">
                              <span className="font-medium">{sale.quantidade}x {prod?.nome || "Item"}</span>
                              <span className="text-[10px] text-muted-foreground">{cli?.nome || "Desconhecido"} • {sale.hora}</span>
                            </div>
                            <span className="font-bold">R$ {sale.valorTotal.toLocaleString("pt-BR")}</span>
                          </div>
                        )
                      })}
                      {table.pessoaIds.length === 0 && (
                        <span className="text-xs text-muted-foreground italic">Mesa vazia</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Ranking */}
      {spenderRanking.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-warning" />
              Ranking - Quem Mais Gastou
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {spenderRanking.map(([pessoaId, total], i) => {
                const pessoa = pessoas.find((p) => p.id === pessoaId)
                const maxSpend = spenderRanking[0]?.[1] || 1
                return (
                  <div key={pessoaId} className="flex items-center gap-3">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${i === 0
                        ? "bg-warning text-warning-foreground"
                        : i === 1
                          ? "bg-muted text-muted-foreground"
                          : "bg-secondary text-secondary-foreground"
                        }`}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{pessoa?.nome || "-"}</span>
                        <span className="font-bold">R$ {Number(total).toLocaleString("pt-BR")}</span>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(Number(total) / Number(maxSpend)) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Person Dialog */}
      <Dialog open={addPersonDialogOpen} onOpenChange={(v) => {
        setAddPersonDialogOpen(v)
        if (!v) {
          setErrors({})
          setPersonForm("")
        }
      }}>
        <DialogContent className="sm:max-w-md bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>Adicionar Pessoa a Mesa</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPerson} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Pessoa *</Label>
              <Select
                value={personForm}
                onValueChange={(v) => {
                  setPersonForm(v)
                  if (errors.person) setErrors(prev => ({ ...prev, person: false }))
                }}
              >
                <SelectTrigger className={errors.person ? "border-destructive focus-visible:ring-destructive" : ""}>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {pessoas.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">Adicionar</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Garrafa Dialog */}
      <Dialog open={garrafaDialogOpen} onOpenChange={(v) => {
        setGarrafaDialogOpen(v)
        if (!v) {
          setErrors({})
          setGarrafaForm("")
        }
      }}>
        <DialogContent className="sm:max-w-md bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>Adicionar Garrafa</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddGarrafa} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Nome da Garrafa *</Label>
              <Input
                value={garrafaForm}
                onChange={(e) => {
                  setGarrafaForm(e.target.value)
                  if (errors.garrafa) setErrors(prev => ({ ...prev, garrafa: false }))
                }}
                placeholder="Ex: Vodka Absolut"
                className={errors.garrafa ? "border-destructive focus-visible:ring-destructive" : ""}
              />
            </div>
            <Button type="submit" className="w-full">Adicionar</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
