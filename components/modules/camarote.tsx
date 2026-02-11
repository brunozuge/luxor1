"use client"

import React from "react"

import { useState } from "react"
import { useEventData } from "@/lib/event-data"
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
import { Plus, Crown, Wine, UserPlus, X, Trophy } from "lucide-react"

export function CamaroteModule() {
  const {
    camaroteTables,
    pessoas,
    barSales,
    addCamaroteTable,
    addGarrafaToCamarote,
    addPessoaToCamarote,
    removePessoaFromCamarote,
    colaboradores,
  } = useEventData()

  const [tableDialogOpen, setTableDialogOpen] = useState(false)
  const [garrafaDialogOpen, setGarrafaDialogOpen] = useState(false)
  const [addPersonDialogOpen, setAddPersonDialogOpen] = useState(false)
  const [selectedTableId, setSelectedTableId] = useState("")
  const [tableForm, setTableForm] = useState({ nome: "", garcom: "" })
  const [garrafaForm, setGarrafaForm] = useState("")
  const [personForm, setPersonForm] = useState("")

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
    if (!tableForm.nome) return
    addCamaroteTable(tableForm)
    setTableForm({ nome: "", garcom: "" })
    setTableDialogOpen(false)
  }

  function handleAddGarrafa(e: React.FormEvent) {
    e.preventDefault()
    if (!garrafaForm || !selectedTableId) return
    addGarrafaToCamarote(selectedTableId, garrafaForm)
    setGarrafaForm("")
    setGarrafaDialogOpen(false)
  }

  function handleAddPerson(e: React.FormEvent) {
    e.preventDefault()
    if (!personForm || !selectedTableId) return
    addPessoaToCamarote(selectedTableId, personForm)
    setPersonForm("")
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
        <Dialog open={tableDialogOpen} onOpenChange={setTableDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Mesa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-card text-card-foreground">
            <DialogHeader>
              <DialogTitle>Adicionar Mesa</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddTable} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Nome da Mesa *</Label>
                <Input
                  value={tableForm.nome}
                  onChange={(e) => setTableForm({ ...tableForm, nome: e.target.value })}
                  placeholder="Ex: Mesa 3"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Garcom Responsavel</Label>
                <Select
                  value={tableForm.garcom}
                  onValueChange={(v) => setTableForm({ ...tableForm, garcom: v })}
                >
                  <SelectTrigger>
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
              <Button type="submit" className="w-full">Adicionar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mesas Ativas</CardTitle>
            <Crown className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{camaroteTables.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Garrafas</CardTitle>
            <Wine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGarrafas}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Consumo Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              R$ {totalCamaroteRevenue.toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {camaroteTables.map((table) => {
          const tableSpend = getTableSpending(table.id)
          return (
            <Card key={table.id} className="bg-card border-border">
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-primary" />
                    {table.nome}
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Garcom: {table.garcom || "Nao definido"}
                  </p>
                </div>
                <Badge className="bg-primary text-primary-foreground">
                  R$ {tableSpend.toLocaleString("pt-BR")}
                </Badge>
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
                      <Badge key={`${g}-${i}`} className="bg-secondary text-secondary-foreground">
                        {g}
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
                      const product = pessoas.find(p => p.id === sale.pessoaId)
                      return (
                        <div key={sale.id} className="flex items-center justify-between text-xs bg-muted/30 p-2 rounded">
                          <div className="flex flex-col">
                            <span className="font-medium">{sale.quantidade}x {sale.id.startsWith("temp") ? "Venda..." : "Item"}</span>
                            <span className="text-[10px] text-muted-foreground">{product?.nome} • {sale.hora}</span>
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
        })}
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
      <Dialog open={addPersonDialogOpen} onOpenChange={setAddPersonDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>Adicionar Pessoa a Mesa</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPerson} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Pessoa</Label>
              <Select value={personForm} onValueChange={setPersonForm}>
                <SelectTrigger>
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
      <Dialog open={garrafaDialogOpen} onOpenChange={setGarrafaDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>Adicionar Garrafa</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddGarrafa} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Nome da Garrafa</Label>
              <Input
                value={garrafaForm}
                onChange={(e) => setGarrafaForm(e.target.value)}
                placeholder="Ex: Vodka Absolut"
              />
            </div>
            <Button type="submit" className="w-full">Adicionar</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
