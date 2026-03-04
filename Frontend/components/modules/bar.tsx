"use client"

import React, { useState, useEffect } from "react"
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
import { Plus, Wine, TrendingUp, DollarSign, ShoppingCart, Trophy, Trash2, X, Pencil } from "lucide-react"
import { BarRanking } from "./bar-ranking"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Skeleton } from "@/components/ui/skeleton"

export function BarModule() {
  const { products, barSales, pessoas, colaboradores, addProducts, addBarSale, addBarSales, removeProduct, updateProduct, removeBarSale, updateBarSale, loading } = useEventData()
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any | null>(null)
  const [saleDialogOpen, setSaleDialogOpen] = useState(false)
  const [editingSale, setEditingSale] = useState<any | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmDeleteSaleId, setConfirmDeleteSaleId] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, any>>({})

  const [productRows, setProductRows] = useState([{
    nome: "",
    custo: "",
    precoVenda: "",
    estoqueInicial: "",
  }])

  const [saleForm, setSaleForm] = useState({
    productId: "",
    pessoaId: "",
    vendedor: "",
    quantidade: 1,
  })

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

  const totalRevenue = barSales.reduce((sum, s) => sum + s.valorTotal, 0)
  const totalCost = barSales.reduce((sum, s) => {
    const prod = products.find((p) => p.id === s.productId)
    return sum + (prod ? prod.custo * s.quantidade : 0)
  }, 0)
  const totalProfit = totalRevenue - totalCost
  const avgTicket = barSales.length > 0 ? totalRevenue / new Set(barSales.map((s) => s.pessoaId)).size : 0

  const salesByProduct = products.map((p) => {
    const qty = barSales.filter((s) => s.productId === p.id).reduce((sum, s) => sum + s.quantidade, 0)
    return { ...p, sold: qty }
  }).sort((a, b) => b.sold - a.sold)

  const salesByHour = barSales.reduce<Record<string, number>>((acc, s) => {
    acc[s.hora] = (acc[s.hora] || 0) + s.valorTotal
    return acc
  }, {})
  const peakHour = Object.entries(salesByHour).sort(([, a], [, b]) => b - a)[0]

  function handleAddRow() {
    setProductRows([...productRows, { nome: "", custo: "", precoVenda: "", estoqueInicial: "" }])
  }

  function handleRemoveRow(index: number) {
    if (productRows.length === 1) return
    setProductRows(productRows.filter((_, i) => i !== index))
  }

  function openEditProduct(product: any) {
    setEditingProduct(product)
    setProductRows([{
      nome: product.nome,
      custo: String(product.custo),
      precoVenda: String(product.precoVenda),
      estoqueInicial: String(product.estoqueInicial),
    }])
    setProductDialogOpen(true)
  }

  function handleAddProduct(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, boolean> = {}
    let hasError = false
    productRows.forEach((row, index) => {
      if (!row.nome) { newErrors[`product-${index}-nome`] = true; hasError = true; }
      if (!row.custo) { newErrors[`product-${index}-custo`] = true; hasError = true; }
      if (!row.precoVenda) { newErrors[`product-${index}-precoVenda`] = true; hasError = true; }
      if (!row.estoqueInicial) { newErrors[`product-${index}-estoqueInicial`] = true; hasError = true; }
    })
    setErrors(newErrors)
    if (hasError) {
      toast.error("Preencha todos os campos destacados em vermelho.")
      return
    }

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        nome: productRows[0].nome,
        custo: parseCurrency(productRows[0].custo),
        precoVenda: parseCurrency(productRows[0].precoVenda),
        estoqueInicial: Number(productRows[0].estoqueInicial),
        estoqueAtual: editingProduct.estoqueAtual + (Number(productRows[0].estoqueInicial) - editingProduct.estoqueInicial)
      })
    } else {
      addProducts(productRows.map(p => ({
        nome: p.nome,
        custo: parseCurrency(p.custo),
        precoVenda: parseCurrency(p.precoVenda),
        estoqueInicial: Number(p.estoqueInicial) || 0,
      })))
    }
    setProductRows([{ nome: "", custo: "", precoVenda: "", estoqueInicial: "" }])
    setProductDialogOpen(false)
  }

  function handleAddSale(e: React.FormEvent) {
    e.preventDefault()
    const newErrors = {
      productId: !saleForm.productId,
      vendedor: !saleForm.vendedor,
      quantidade: !saleForm.quantidade || saleForm.quantidade <= 0,
      pessoaId: !saleForm.pessoaId,
    }
    setErrors(newErrors)
    if (Object.values(newErrors).some((v) => v)) {
      toast.error("Preencha os campos obrigatorios.")
      return
    }

    if (editingSale) {
      updateBarSale(editingSale.id, {
        vendedor: saleForm.vendedor,
        quantidade: saleForm.quantidade,
        pessoaId: saleForm.pessoaId
      })
    } else {
      addBarSales(saleForm.vendedor, [{
        productId: saleForm.productId,
        quantidade: saleForm.quantidade
      }], saleForm.pessoaId)
    }
    setSaleForm({ productId: "", pessoaId: "", vendedor: "", quantidade: 1 })
    setEditingSale(null)
    setSaleDialogOpen(false)
  }

  function openEditSale(sale: any) {
    setEditingSale(sale)
    setSaleForm({
      productId: sale.productId,
      pessoaId: sale.pessoaId || "",
      vendedor: sale.vendedor,
      quantidade: sale.quantidade,
    })
    setSaleDialogOpen(true)
  }

  function handleDeleteSale() {
    if (confirmDeleteSaleId) {
      removeBarSale(confirmDeleteSaleId)
      setConfirmDeleteSaleId(null)
    }
  }

  function exportToExcel() {
    const headers = ["Hora", "Produto", "Cliente", "Vendedor", "Qtd", "Total"]
    const rows = barSales.map(s => {
      const prod = products.find(p => p.id === s.productId)
      const pessoa = pessoas.find(p => p.id === s.pessoaId)
      return [s.hora, prod?.nome || "-", pessoa?.nome || "-", s.vendedor, s.quantidade, s.valorTotal.toFixed(2)].join(";")
    })
    const csvContent = [headers.join(";"), ...rows].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.setAttribute("download", `vendas_bar_${new Date().toLocaleDateString()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sistema de Bar</h1>
          <p className="text-sm text-muted-foreground">Vendas, estoque e relatorios</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Plus className="mr-2 h-4 w-4" />Produtos</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl bg-card">
              <DialogHeader><DialogTitle>{editingProduct ? "Editar Produto" : "Cadastrar Produtos"}</DialogTitle></DialogHeader>
              <form onSubmit={handleAddProduct} className="flex flex-col gap-4">
                {productRows.map((row, index) => (
                  <div key={index} className="p-4 rounded-lg border border-border relative bg-secondary/10">
                    <Label>Nome</Label>
                    <Input value={row.nome} onChange={(e) => {
                      const nr = [...productRows]; nr[index].nome = e.target.value; setProductRows(nr)
                    }} />
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      <Input value={row.custo} onChange={(e) => {
                        const nr = [...productRows]; nr[index].custo = formatCurrency(e.target.value); setProductRows(nr)
                      }} placeholder="Custo" />
                      <Input value={row.precoVenda} onChange={(e) => {
                        const nr = [...productRows]; nr[index].precoVenda = formatCurrency(e.target.value); setProductRows(nr)
                      }} placeholder="Venda" />
                      <Input type="number" value={row.estoqueInicial} onChange={(e) => {
                        const nr = [...productRows]; nr[index].estoqueInicial = e.target.value; setProductRows(nr)
                      }} placeholder="Qtd" />
                    </div>
                  </div>
                ))}
                <Button type="submit">Salvar</Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={saleDialogOpen} onOpenChange={setSaleDialogOpen}>
            <DialogTrigger asChild>
              <Button><ShoppingCart className="mr-2 h-4 w-4" />Nova Venda</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl bg-card">
              <DialogHeader><DialogTitle>Registrar Venda</DialogTitle></DialogHeader>
              <form onSubmit={handleAddSale} className="flex flex-col gap-4">
                <Label>Vendedor</Label>
                <Select value={saleForm.vendedor} onValueChange={(v) => setSaleForm({ ...saleForm, vendedor: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{colaboradores.filter(c => c.ativo).map(c => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}</SelectContent>
                </Select>
                <Label>Cliente</Label>
                <Select value={saleForm.pessoaId} onValueChange={(v) => setSaleForm({ ...saleForm, pessoaId: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{pessoas.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
                </Select>
                <Label>Produto</Label>
                <Select value={saleForm.productId} onValueChange={(v) => setSaleForm({ ...saleForm, productId: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
                </Select>
                <Label>Quantidade</Label>
                <Input type="number" value={saleForm.quantidade} onChange={(e) => setSaleForm({ ...saleForm, quantidade: Number(e.target.value) })} />
                <Button type="submit">Finalizar</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              {loading && products.length === 0 ? (
                <>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </>
              ) : i === 1 ? (
                <>
                  <CardTitle className="text-sm font-medium text-muted-foreground">Faturamento</CardTitle>
                  <DollarSign className="h-4 w-4 text-success" />
                </>
              ) : i === 2 ? (
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-secondary" />
                  Lucro Estimado
                </CardTitle>
              ) : i === 3 ? (
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                  Ticket Medio
                </CardTitle>
              ) : (
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-warning" />
                  Pico de Vendas
                </CardTitle>
              )}
            </CardHeader>
            <CardContent>
              {loading && products.length === 0 ? <Skeleton className="h-8 w-20" /> : (
                <div className="text-2xl font-bold">
                  {i === 1 ? `R$ ${totalRevenue.toLocaleString()}` : i === 2 ? `R$ ${totalProfit.toLocaleString()}` : i === 3 ? `R$ ${avgTicket.toFixed(2)}` : peakHour?.[0] || "-"}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="estoque">
        <TabsList><TabsTrigger value="estoque">Estoque</TabsTrigger><TabsTrigger value="vendas">Vendas</TabsTrigger><TabsTrigger value="ranking">Ranking</TabsTrigger></TabsList>
        <TabsContent value="estoque">
          <Table>
            <TableHeader><TableRow><TableHead>Produto</TableHead><TableHead>Custo</TableHead><TableHead>Venda</TableHead><TableHead>Estoque</TableHead><TableHead>Acoes</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading && products.length === 0 ? [1, 2, 3].map(i => <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell></TableRow>) :
                salesByProduct.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>{p.nome}</TableCell><TableCell>R$ {p.custo}</TableCell><TableCell>R$ {p.precoVenda}</TableCell><TableCell>{p.estoqueAtual}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditProduct(p)} className="h-8 w-8 text-muted-foreground hover:text-primary">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setConfirmDeleteId(p.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </TabsContent>
        <TabsContent value="vendas">
          <Table>
            <TableHeader><TableRow><TableHead>Hora</TableHead><TableHead>Produto</TableHead><TableHead>Cliente</TableHead><TableHead>Total</TableHead><TableHead>Acoes</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading && barSales.length === 0 ? [1, 2, 3].map(i => <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell></TableRow>) :
                barSales.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>{s.hora}</TableCell><TableCell>{products.find(p => p.id === s.productId)?.nome}</TableCell><TableCell>{pessoas.find(p => p.id === s.pessoaId)?.nome}</TableCell><TableCell>R$ {s.valorTotal}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditSale(s)} className="h-8 w-8 text-muted-foreground hover:text-primary">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setConfirmDeleteSaleId(s.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </TabsContent>
        <TabsContent value="ranking"><BarRanking /></TabsContent>
      </Tabs>
      <ConfirmDialog open={confirmDeleteId !== null} onOpenChange={() => setConfirmDeleteId(null)} onConfirm={() => { removeProduct(confirmDeleteId!); setConfirmDeleteId(null) }} title="Excluir Produto" description="Tem certeza que deseja remover este produto? Isso pode afetar o historico de vendas." />
      <ConfirmDialog open={confirmDeleteSaleId !== null} onOpenChange={() => setConfirmDeleteSaleId(null)} onConfirm={handleDeleteSale} title="Excluir Venda" description="Tem certeza que deseja remover este registro de venda?" />
    </div>
  )
}
