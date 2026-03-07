"use client"

import React from "react"

import { useState } from "react"
import { useEventData, type PaymentMethod } from "@/lib/event-data"
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

const formatCurrency = (value: string) => {
  const digits = value.replace(/\D/g, "")
  const amount = parseInt(digits || "0") / 100
  return amount.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const parseCurrency = (value: string) => {
  const clean = value.replace(/\./g, "").replace(",", ".")
  return parseFloat(clean) || 0
}
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
import { Skeleton } from "@/components/ui/skeleton"

const paymentLabels: Record<PaymentMethod, string> = {
  dinheiro: "Dinheiro",
  pix: "PIX",
  cartao_credito: "Cartao Credito",
  cartao_debito: "Cartao Debito",
}

export function IngressosModule() {
  const { tickets, pessoas, addTicket, colaboradores, fetchedModules } = useEventData()
  const isLoading = !fetchedModules.has("tickets")
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [form, setForm] = useState({
    numero: "",
    lote: "1",
    valorPago: "",
    vendedor: "",
    formaPagamento: "dinheiro" as PaymentMethod,
    pessoaId: "",
  })
  const filtered = tickets.filter((t) => t.numero.includes(search))

  const totalArrecadado = tickets.reduce((sum, t) => sum + t.valorPago, 0)
  const totalEntrou = tickets.filter((t) => t.entrou).length
  const totalPendente = tickets.filter((t) => !t.entrou).length

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const newErrors = {
      numero: !form.numero,
      lote: !form.lote,
      valorPago: !form.valorPago,
      vendedor: !form.vendedor,
      formaPagamento: !form.formaPagamento,
      pessoaId: !form.pessoaId
    }
    setErrors(newErrors)

    if (Object.values(newErrors).some(v => v)) {
      toast.error("Preencha todos os campos destacados em vermelho.")
      return
    }
    if (Number(form.valorPago) < 0) {
      toast.error("O valor nao pode ser negativo.")
      return
    }
    addTicket({
      numero: form.numero,
      lote: form.lote,
      valorPago: parseCurrency(form.valorPago),
      vendedor: form.vendedor,
      formaPagamento: form.formaPagamento,
      pessoaId: form.pessoaId,
    })
    setForm({ numero: "", lote: "1", valorPago: "", vendedor: "", formaPagamento: "dinheiro", pessoaId: "" })
    setDialogOpen(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-foreground">Controle de Ingressos</h1>
          <p className="text-sm text-muted-foreground">
            {tickets.length} ingressos registrados
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Dialog open={dialogOpen} onOpenChange={(v) => {
            setDialogOpen(v)
            if (!v) {
              setErrors({})
              setForm({ numero: "", lote: "1", valorPago: "", vendedor: "", formaPagamento: "dinheiro", pessoaId: "" })
            }
          }}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Novo Ingresso
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-md bg-card text-card-foreground p-0 overflow-hidden flex flex-col max-h-[90vh]">
              <DialogHeader className="p-6 pb-2">
                <DialogTitle>Registrar Ingresso</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 pt-2 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Pessoa *</Label>
                  <Select
                    value={form.pessoaId}
                    onValueChange={(v) => {
                      setForm({ ...form, pessoaId: v })
                      if (errors.pessoaId) setErrors(prev => ({ ...prev, pessoaId: false }))
                    }}
                  >
                    <SelectTrigger className={errors.pessoaId ? "border-destructive focus-visible:ring-destructive" : ""}>
                      <SelectValue placeholder="Selecione a pessoa" />
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="num">Número *</Label>
                    <Input
                      id="num"
                      value={form.numero}
                      onChange={(e) => {
                        setForm({ ...form, numero: e.target.value })
                        if (errors.numero) setErrors(prev => ({ ...prev, numero: false }))
                      }}
                      placeholder="000"
                      className={errors.numero ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="lote">Lote *</Label>
                    <Input
                      id="lote"
                      value={form.lote}
                      onChange={(e) => {
                        setForm({ ...form, lote: e.target.value })
                        if (errors.lote) setErrors(prev => ({ ...prev, lote: false }))
                      }}
                      placeholder="1"
                      className={errors.lote ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="valor">Valor Pago (R$) *</Label>
                    <Input
                      id="valor"
                      value={form.valorPago}
                      onChange={(e) => {
                        setForm({ ...form, valorPago: formatCurrency(e.target.value) })
                        if (errors.valorPago) setErrors(prev => ({ ...prev, valorPago: false }))
                      }}
                      placeholder="0,00"
                      className={errors.valorPago ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Vendedor *</Label>
                    <Select
                      value={form.vendedor}
                      onValueChange={(v) => {
                        setForm({ ...form, vendedor: v })
                        if (errors.vendedor) setErrors(prev => ({ ...prev, vendedor: false }))
                      }}
                    >
                      <SelectTrigger className={errors.vendedor ? "border-destructive focus-visible:ring-destructive" : ""}>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {colaboradores.map((c) => (
                          <SelectItem key={c.id} value={c.nome}>
                            {c.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Forma de Pagamento *</Label>
                  <Select
                    value={form.formaPagamento}
                    onValueChange={(v) => {
                      setForm({ ...form, formaPagamento: v as PaymentMethod })
                      if (errors.formaPagamento) setErrors(prev => ({ ...prev, formaPagamento: false }))
                    }}
                  >
                    <SelectTrigger className={errors.formaPagamento ? "border-destructive focus-visible:ring-destructive" : ""}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="cartao_credito">Cartão Crédito</SelectItem>
                      <SelectItem value="cartao_debito">Cartão Débito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-2 sticky bottom-0 bg-card">
                  <Button type="submit" className="w-full">Registrar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 pt-4">
              {isLoading && tickets.length === 0 ? (
                <>
                  <Skeleton className="h-4 w-[60%]" />
                  <Skeleton className="h-4 w-4" />
                </>
              ) : i === 1 ? (
                <>
                  <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-tight">Total Ingressos</CardTitle>
                  <Ticket className="h-4 w-4 text-primary shrink-0" />
                </>
              ) : i === 2 ? (
                <>
                  <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-tight">Total Arrecadado</CardTitle>
                  <DollarSign className="h-4 w-4 text-success shrink-0" />
                </>
              ) : i === 3 ? (
                <>
                  <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-tight">Entradas Conf.</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                </>
              ) : (
                <>
                  <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-tight">Entradas Pend.</CardTitle>
                  <Clock className="h-4 w-4 text-warning shrink-0" />
                </>
              )}
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              {isLoading && tickets.length === 0 ? (
                <Skeleton className="h-8 w-[40%]" />
              ) : i === 1 ? (
                <div className="text-xl sm:text-2xl font-bold">{tickets.length}</div>
              ) : i === 2 ? (
                <div className="text-xl sm:text-2xl font-bold text-success truncate">
                  R$ {totalArrecadado.toLocaleString("pt-BR")}
                </div>
              ) : i === 3 ? (
                <div className="text-xl sm:text-2xl font-bold">{totalEntrou}</div>
              ) : (
                <div className="text-xl sm:text-2xl font-bold text-warning">{totalPendente}</div>
              )}
            </CardContent>
          </Card>
        ))}
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
              <TableRow className="border-border hover:bg-transparent text-[10px] uppercase">
                <TableHead>Numero</TableHead>
                <TableHead className="hidden sm:table-cell">Lote</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="hidden md:table-cell">Vendedor</TableHead>
                <TableHead className="hidden lg:table-cell">Pagamento</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && tickets.length === 0 ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24 rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : (
                filtered.map((t) => {
                  return (
                    <TableRow key={t.id} className="border-border">
                      <TableCell className="font-mono font-bold text-xs">#{t.numero}</TableCell>
                      <TableCell className="text-muted-foreground text-xs hidden sm:table-cell">{t.lote}</TableCell>
                      <TableCell className="text-xs">R$ {t.valorPago.toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-muted-foreground text-xs hidden md:table-cell">{t.vendedor}</TableCell>
                      <TableCell className="text-muted-foreground text-xs hidden lg:table-cell">{paymentLabels[t.formaPagamento]}</TableCell>
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
                })
              )}
              {!isLoading && filtered.length === 0 && (
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
