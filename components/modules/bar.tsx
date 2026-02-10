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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Wine, TrendingUp, Package, DollarSign, ShoppingCart } from "lucide-react"

export function BarModule() {
  const { products, barSales, pessoas, addProduct, addBarSale } = useEventData()
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [saleDialogOpen, setSaleDialogOpen] = useState(false)

  const [productForm, setProductForm] = useState({
    nome: "",
    custo: "",
    precoVenda: "",
    estoqueInicial: "",
  })

  const [saleForm, setSaleForm] = useState({
    productId: "",
    pessoaId: "",
    quantidade: "1",
  })

  const totalRevenue = barSales.reduce((sum, s) => sum + s.valorTotal, 0)
  const totalCost = barSales.reduce((sum, s) => {
    const prod = products.find((p) => p.id === s.productId)
    return sum + (prod ? prod.custo * s.quantidade : 0)
  }, 0)
  const totalProfit = totalRevenue - totalCost
  const avgTicket = barSales.length > 0 ? totalRevenue / new Set(barSales.map((s) => s.pessoaId)).size : 0

  // Best selling product
  const salesByProduct = products.map((p) => {
    const qty = barSales.filter((s) => s.productId === p.id).reduce((sum, s) => sum + s.quantidade, 0)
    return { ...p, sold: qty }
  }).sort((a, b) => b.sold - a.sold)

  // Sales by hour
  const salesByHour = barSales.reduce<Record<string, number>>((acc, s) => {
    acc[s.hora] = (acc[s.hora] || 0) + s.valorTotal
    return acc
  }, {})
  const peakHour = Object.entries(salesByHour).sort(([, a], [, b]) => b - a)[0]

  // Spending by person
  const spendingByPerson = barSales.reduce<Record<string, number>>((acc, s) => {
    acc[s.pessoaId] = (acc[s.pessoaId] || 0) + s.valorTotal
    return acc
  }, {})

  function handleAddProduct(e: React.FormEvent) {
    e.preventDefault()
    if (!productForm.nome) return
    addProduct({
      nome: productForm.nome,
      custo: Number(productForm.custo) || 0,
      precoVenda: Number(productForm.precoVenda) || 0,
      estoqueInicial: Number(productForm.estoqueInicial) || 0,
    })
    setProductForm({ nome: "", custo: "", precoVenda: "", estoqueInicial: "" })
    setProductDialogOpen(false)
  }

  function handleAddSale(e: React.FormEvent) {
    e.preventDefault()
    if (!saleForm.productId || !saleForm.pessoaId) return
    addBarSale({
      productId: saleForm.productId,
      pessoaId: saleForm.pessoaId,
      quantidade: Number(saleForm.quantidade) || 1,
    })
    setSaleForm({ productId: "", pessoaId: "", quantidade: "1" })
    setSaleDialogOpen(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sistema de Bar</h1>
          <p className="text-sm text-muted-foreground">
            Vendas, estoque e relatorios
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card text-card-foreground">
              <DialogHeader>
                <DialogTitle>Adicionar Produto</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddProduct} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="prod-nome">Nome *</Label>
                  <Input
                    id="prod-nome"
                    value={productForm.nome}
                    onChange={(e) => setProductForm({ ...productForm, nome: e.target.value })}
                    placeholder="Nome do produto"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-2">
                    <Label>Custo (R$)</Label>
                    <Input
                      type="number"
                      value={productForm.custo}
                      onChange={(e) => setProductForm({ ...productForm, custo: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Venda (R$)</Label>
                    <Input
                      type="number"
                      value={productForm.precoVenda}
                      onChange={(e) => setProductForm({ ...productForm, precoVenda: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Estoque</Label>
                    <Input
                      type="number"
                      value={productForm.estoqueInicial}
                      onChange={(e) => setProductForm({ ...productForm, estoqueInicial: e.target.value })}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">Adicionar</Button>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={saleDialogOpen} onOpenChange={setSaleDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Nova Venda
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card text-card-foreground">
              <DialogHeader>
                <DialogTitle>Registrar Venda</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddSale} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Produto *</Label>
                  <Select
                    value={saleForm.productId}
                    onValueChange={(v) => setSaleForm({ ...saleForm, productId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.filter((p) => p.estoqueAtual > 0).map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nome} - R$ {p.precoVenda} (estoque: {p.estoqueAtual})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Cliente *</Label>
                  <Select
                    value={saleForm.pessoaId}
                    onValueChange={(v) => setSaleForm({ ...saleForm, pessoaId: v })}
                  >
                    <SelectTrigger>
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
                <div className="flex flex-col gap-2">
                  <Label>Quantidade</Label>
                  <Input
                    type="number"
                    min="1"
                    value={saleForm.quantidade}
                    onChange={(e) => setSaleForm({ ...saleForm, quantidade: e.target.value })}
                  />
                </div>
                {saleForm.productId && (
                  <div className="rounded-lg bg-secondary/50 p-3 text-sm">
                    <span className="text-muted-foreground">Total: </span>
                    <span className="font-bold">
                      R$ {((products.find((p) => p.id === saleForm.productId)?.precoVenda || 0) * (Number(saleForm.quantidade) || 1)).toLocaleString("pt-BR")}
                    </span>
                  </div>
                )}
                <Button type="submit" className="w-full">Registrar Venda</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Faturamento</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalRevenue.toLocaleString("pt-BR")}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lucro Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              R$ {totalProfit.toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Medio</CardTitle>
            <Wine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {avgTicket.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pico de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{peakHour ? peakHour[0] : "-"}</div>
            {peakHour && (
              <p className="text-xs text-muted-foreground">R$ {Number(peakHour[1]).toLocaleString("pt-BR")}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="estoque" className="w-full">
        <TabsList className="bg-secondary">
          <TabsTrigger value="estoque">Estoque</TabsTrigger>
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
        </TabsList>
        <TabsContent value="estoque">
          <Card className="bg-card border-border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead>Produto</TableHead>
                    <TableHead>Custo</TableHead>
                    <TableHead>Venda</TableHead>
                    <TableHead>Lucro/Un</TableHead>
                    <TableHead>Estoque</TableHead>
                    <TableHead>Vendidos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesByProduct.map((p) => {
                    const stockPercent = p.estoqueInicial > 0
                      ? Math.round((p.estoqueAtual / p.estoqueInicial) * 100)
                      : 0
                    return (
                      <TableRow key={p.id} className="border-border">
                        <TableCell className="font-medium">{p.nome}</TableCell>
                        <TableCell className="text-muted-foreground">R$ {p.custo.toFixed(2)}</TableCell>
                        <TableCell>R$ {p.precoVenda.toFixed(2)}</TableCell>
                        <TableCell className="text-success">
                          R$ {(p.precoVenda - p.custo).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-16 overflow-hidden rounded-full bg-secondary">
                              <div
                                className={`h-full rounded-full ${
                                  stockPercent < 20 ? "bg-destructive" : "bg-primary"
                                }`}
                                style={{ width: `${stockPercent}%` }}
                              />
                            </div>
                            <span className="text-xs tabular-nums">
                              {p.estoqueAtual}/{p.estoqueInicial}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-border">{p.sold}</Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="vendas">
          <Card className="bg-card border-border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead>Hora</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...barSales].reverse().map((s) => {
                    const prod = products.find((p) => p.id === s.productId)
                    const pessoa = pessoas.find((p) => p.id === s.pessoaId)
                    return (
                      <TableRow key={s.id} className="border-border">
                        <TableCell className="font-mono text-muted-foreground">{s.hora}</TableCell>
                        <TableCell className="font-medium">{prod?.nome || "-"}</TableCell>
                        <TableCell>{pessoa?.nome || "-"}</TableCell>
                        <TableCell>{s.quantidade}</TableCell>
                        <TableCell className="font-semibold">
                          R$ {s.valorTotal.toLocaleString("pt-BR")}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {barSales.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhuma venda registrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="ranking">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base">Ranking de Gastos por Pessoa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {Object.entries(spendingByPerson)
                  .sort(([, a], [, b]) => b - a)
                  .map(([pessoaId, total], i) => {
                    const pessoa = pessoas.find((p) => p.id === pessoaId)
                    const maxSpend = Math.max(...Object.values(spendingByPerson))
                    return (
                      <div key={pessoaId} className="flex items-center gap-3">
                        <span className="w-6 text-center text-sm font-bold text-muted-foreground">
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{pessoa?.nome || "-"}</span>
                            <span className="font-bold">R$ {total.toLocaleString("pt-BR")}</span>
                          </div>
                          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-secondary">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${(total / maxSpend) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
