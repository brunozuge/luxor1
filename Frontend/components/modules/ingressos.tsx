"use client"

import React from "react"

import { useState } from "react"
import { useEventData, type PaymentMethod } from "@/lib/event-data"
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
import { Plus, Search, Ticket, DollarSign, CheckCircle2, Clock } from "lucide-react"

const paymentLabels: Record<PaymentMethod, string> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  cartao_credito: "Cartao Credito",
  cartao_debito: "Cartao Debito",
}

export function IngressosModule() {
  const { tickets, pessoas, addTicket } = useEventData()
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
    numero: "",
    lote: "",
    valorPago: "",
    vendedor: "",
    formaPagamento: "pix" as PaymentMethod,
  })
  const filtered = tickets.filter((t) => t.numero.includes(search))

  const totalArrecadado = tickets.reduce((sum, t) => sum + t.valorPago, 0)
  const totalEntrou = tickets.filter((t) => t.entrou).length
  const totalPendente = tickets.filter((t) => !t.entrou).length

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.numero) return
    addTicket({
      numero: form.numero,
      lote: form.lote,
      valorPago: Number(form.valorPago) || 0,
      vendedor: form.vendedor,
      formaPagamento: form.formaPagamento,
    })
    setForm({ numero: "", lote: "", valorPago: "", vendedor: "", formaPagamento: "pix" })
    setDialogOpen(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Controle de Ingressos</h1>
          <p className="text-sm text-muted-foreground">
            {tickets.length} ingressos registrados
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Ingresso
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-card text-card-foreground">
            <DialogHeader>
              <DialogTitle>Registrar Ingresso</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="numero">Numero *</Label>
                  <Input
                    id="numero"
                    value={form.numero}
                    onChange={(e) => setForm({ ...form, numero: e.target.value })}
                    placeholder="Ex: 006"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="lote">Lote</Label>
                  <Input
                    id="lote"
                    value={form.lote}
                    onChange={(e) => setForm({ ...form, lote: e.target.value })}
                    placeholder="Ex: 1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="valor">Valor (R$)</Label>
                  <Input
                    id="valor"
                    type="number"
                    value={form.valorPago}
                    onChange={(e) => setForm({ ...form, valorPago: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="vendedor">Vendedor</Label>
                  <Input
                    id="vendedor"
                    value={form.vendedor}
                    onChange={(e) => setForm({ ...form, vendedor: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Forma de Pagamento</Label>
                <Select
                  value={form.formaPagamento}
                  onValueChange={(v) => setForm({ ...form, formaPagamento: v as PaymentMethod })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cartao_credito">Cartao Credito</SelectItem>
                    <SelectItem value="cartao_debito">Cartao Debito</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full">Registrar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Ingressos</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tickets.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Arrecadado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              R$ {totalArrecadado.toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Entraram</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEntrou}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{totalPendente}</div>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por numero ou nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card className="bg-card border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead>Numero</TableHead>
                <TableHead>Lote</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => {
                return (
                  <TableRow key={t.id} className="border-border">
                    <TableCell className="font-mono font-bold">#{t.numero}</TableCell>
                    <TableCell className="text-muted-foreground">{t.lote}</TableCell>
                    <TableCell>R$ {t.valorPago.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-muted-foreground">{t.vendedor}</TableCell>
                    <TableCell className="text-muted-foreground">{paymentLabels[t.formaPagamento]}</TableCell>
                    <TableCell>
                      {t.entrou ? (
                        <Badge className="bg-success text-success-foreground">
                          Entrou {t.horaEntrada}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-warning text-warning">
                          Pendente
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum ingresso encontrado
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
