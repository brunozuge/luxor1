"use client"

import React, { useState } from "react"
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
import { Plus, Wine, TrendingUp, DollarSign, ShoppingCart, Trophy, Trash2, X, Pencil, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BarRanking } from "./bar-ranking"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Skeleton } from "@/components/ui/skeleton"

export function BarModule() {
  const { products, barSales, pessoas, colaboradores, addProducts, addBarSale, addBarSales, removeProduct, updateProduct, removeBarSale, updateBarSale, fetchedModules, selectedEventId } = useEventData()
  const isLoading = !fetchedModules.has("products") || !fetchedModules.has("barSales")
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any | null>(null)
  const [saleDialogOpen, setSaleDialogOpen] = useState(false)
  const [editingSale, setEditingSale] = useState<any | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmDeleteSaleId, setConfirmDeleteSaleId] = useState<string | null>(null)
  const [showEditProductConfirm, setShowEditProductConfirm] = useState(false)
  const [showEditSaleConfirm, setShowEditSaleConfirm] = useState(false)
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
      setShowEditProductConfirm(true)
    } else {
      addProducts(productRows.map(p => ({
        nome: p.nome,
        custo: parseCurrency(p.custo),
        precoVenda: parseCurrency(p.precoVenda),
        estoqueInicial: Number(p.estoqueInicial) || 0,
      })))
      setProductRows([{ nome: "", custo: "", precoVenda: "", estoqueInicial: "" }])
      setProductDialogOpen(false)
    }
  }

  function confirmUpdateProduct() {
      updateProduct(editingProduct.id, {
        nome: productRows[0].nome,
        custo: parseCurrency(productRows[0].custo),
        precoVenda: parseCurrency(productRows[0].precoVenda),
        estoqueInicial: Number(productRows[0].estoqueInicial),
        estoqueAtual: editingProduct.estoqueAtual + (Number(productRows[0].estoqueInicial) - editingProduct.estoqueInicial)
      })
      setProductRows([{ nome: "", custo: "", precoVenda: "", estoqueInicial: "" }])
      setProductDialogOpen(false)
      setShowEditProductConfirm(false)
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

    // Stock check
    const product = products.find(p => p.id === saleForm.productId)
    if (product && !editingSale && product.estoqueAtual < saleForm.quantidade) {
      toast.error(`Estoque insuficiente! ${product.nome} tem apenas ${product.estoqueAtual} em estoque.`)
      return
    }

    if (editingSale) {
      setShowEditSaleConfirm(true)
    } else {
      addBarSales(saleForm.vendedor, [{
        productId: saleForm.productId,
        quantidade: saleForm.quantidade
      }], saleForm.pessoaId)
      setSaleForm({ productId: "", pessoaId: "", vendedor: "", quantidade: 1 })
      setEditingSale(null)
      setSaleDialogOpen(false)
    }
  }

  function confirmUpdateSale() {
      updateBarSale(editingSale.id, {
        vendedor: saleForm.vendedor,
        quantidade: saleForm.quantidade,
        pessoaId: saleForm.pessoaId
      })
      setSaleForm({ productId: "", pessoaId: "", vendedor: "", quantidade: 1 })
      setEditingSale(null)
      setSaleDialogOpen(false)
      setShowEditSaleConfirm(false)
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-foreground">Bar</h1>
          <p className="text-sm text-muted-foreground">Vendas, estoque e relatórios</p>
        </div>

        {!selectedEventId && (
          <Alert className="border-warning bg-warning/10">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertTitle className="text-warning">Nenhum Evento Selecionado</AlertTitle>
            <AlertDescription className="text-warning/80">
              Selecione um evento na barra lateral para gerenciar o bar e produtos.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Dialog open={productDialogOpen} onOpenChange={(v) => {
            if (v && !selectedEventId) {
              toast.error("Selecione um evento primeiro")
              return
            }
            setProductDialogOpen(v)
          }}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white" disabled={!selectedEventId} title={!selectedEventId ? "Selecione um evento primeiro" : ""}><Plus className="mr-2 h-4 w-4" />Registrar Produto</Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-xl bg-card text-card-foreground p-0 overflow-hidden flex flex-col max-h-[90vh]">
              <DialogHeader className="p-6 pb-2">
                <DialogTitle>{editingProduct ? "Editar Produto" : "Cadastrar Produtos"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddProduct} className="flex-1 overflow-y-auto p-6 pt-2 flex flex-col gap-4">
                {productRows.map((row, index) => (
                  <div key={index} className="p-4 rounded-lg border border-border relative bg-secondary/10">
                    <Label>Nome</Label>
                    <Input value={row.nome} onChange={(e) => {
                      const nr = [...productRows]; nr[index].nome = e.target.value; setProductRows(nr)
                    }} />
                    <div className="grid grid-cols-1 xs:grid-cols-3 gap-3 mt-2">
                      <div className="flex flex-col gap-1">
                        <Label className="text-[10px] text-muted-foreground uppercase">Custo</Label>
                        <Input value={row.custo} onChange={(e) => {
                          const nr = [...productRows]; nr[index].custo = formatCurrency(e.target.value); setProductRows(nr)
                        }} placeholder="Custo" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-[10px] text-muted-foreground uppercase">Venda</Label>
                        <Input value={row.precoVenda} onChange={(e) => {
                          const nr = [...productRows]; nr[index].precoVenda = formatCurrency(e.target.value); setProductRows(nr)
                        }} placeholder="Venda" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label className="text-[10px] text-muted-foreground uppercase">Qtd</Label>
                        <Input type="number" value={row.estoqueInicial} onChange={(e) => {
                          const nr = [...productRows]; nr[index].estoqueInicial = e.target.value; setProductRows(nr)
                        }} placeholder="Qtd" />
                      </div>
                    </div>
                  </div>
                ))}
                {!editingProduct && (
                  <Button type="button" variant="ghost" onClick={handleAddRow} className="w-full border-dashed border-2">
                    <Plus className="mr-2 h-4 w-4" /> Adicionar Outro Produto
                  </Button>
                )}
                <div className="pt-2 sticky bottom-0 bg-card">
                  <Button type="submit" className="w-full">Salvar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={saleDialogOpen} onOpenChange={(v) => {
            if (v && !selectedEventId) {
              toast.error("Selecione um evento primeiro")
              return
            }
            setSaleDialogOpen(v)
            if (!v) {
              setErrors({})
              setSaleForm({ productId: "", pessoaId: "", vendedor: "", quantidade: 1 })
            }
          }}>
            <DialogTrigger asChild>
              <Button disabled={!selectedEventId} title={!selectedEventId ? "Selecione um evento primeiro" : ""} className="w-full sm:w-auto">
                <ShoppingCart className="mr-2 h-4 w-4" /> Nova Venda
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-md bg-card text-card-foreground p-0 overflow-hidden flex flex-col max-h-[90vh]">
              <DialogHeader className="p-6 pb-2">
                <DialogTitle>Registrar Venda</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddSale} className="flex-1 overflow-y-auto p-6 pt-2 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Vendedor</Label>
                  <Select value={saleForm.vendedor} onValueChange={(v) => {
                    setSaleForm({ ...saleForm, vendedor: v })
                    if (errors.vendedor) setErrors(prev => ({ ...prev, vendedor: false }))
                  }}>
                    <SelectTrigger className={errors.vendedor ? "border-destructive focus-visible:ring-destructive" : ""}><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{colaboradores.filter(c => c.ativo).map(c => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Cliente</Label>
                  <Select value={saleForm.pessoaId} onValueChange={(v) => {
                    setSaleForm({ ...saleForm, pessoaId: v })
                    if (errors.pessoaId) setErrors(prev => ({ ...prev, pessoaId: false }))
                  }}>
                    <SelectTrigger className={errors.pessoaId ? "border-destructive focus-visible:ring-destructive" : ""}><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{pessoas.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>Produto</Label>
                    <Select value={saleForm.productId} onValueChange={(v) => {
                      setSaleForm({ ...saleForm, productId: v })
                      if (errors.productId) setErrors(prev => ({ ...prev, productId: false }))
                    }}>
                      <SelectTrigger className={errors.productId ? "border-destructive focus-visible:ring-destructive" : ""}><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Quantidade</Label>
                    <Input type="number" value={saleForm.quantidade} onChange={(e) => {
                      setSaleForm({ ...saleForm, quantidade: Number(e.target.value) })
                      if (errors.quantidade) setErrors(prev => ({ ...prev, quantidade: false }))
                    }} className={errors.quantidade ? "border-destructive focus-visible:ring-destructive" : ""} />
                  </div>
                </div>
                <div className="pt-2 sticky bottom-0 bg-card">
                  <Button type="submit" className="w-full">Finalizar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 pt-4">
              {isLoading && products.length === 0 ? (
                <>
                  <Skeleton className="h-4 w-[60%]" />
                  <Skeleton className="h-4 w-4" />
                </>
              ) : i === 1 ? (
                <>
                  <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-tight">Faturamento</CardTitle>
                  <DollarSign className="h-4 w-4 text-success shrink-0" />
                </>
              ) : i === 2 ? (
                <>
                  <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-tight flex items-center gap-1">
                    Lucro Est.
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-secondary shrink-0" />
                </>
              ) : i === 3 ? (
                <>
                  <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-tight flex items-center gap-1">
                    Ticket Médio
                  </CardTitle>
                  <ShoppingCart className="h-4 w-4 text-primary shrink-0" />
                </>
              ) : (
                <>
                  <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-tight flex items-center gap-1">
                    Pico Vendas
                  </CardTitle>
                  <Trophy className="h-4 w-4 text-warning shrink-0" />
                </>
              )}
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              {isLoading && products.length === 0 ? <Skeleton className="h-8 w-[40%]" /> : (
                <div className="text-xl sm:text-2xl font-bold truncate">
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="hidden sm:table-cell">Custo</TableHead>
                  <TableHead>Venda</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead className="w-12">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && products.length === 0 ? [1, 2, 3].map(i => <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell></TableRow>) :
                  salesByProduct.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.nome}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-xs">R$ {p.custo}</TableCell>
                      <TableCell className="text-xs">R$ {p.precoVenda}</TableCell>
                      <TableCell>
                        <Badge variant={p.estoqueAtual < 10 ? "destructive" : "outline"} className="px-1.5 h-5 text-[10px]">
                          {p.estoqueAtual}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditProduct(p)} className="h-8 w-8 text-muted-foreground hover:text-primary">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                }
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        <TabsContent value="vendas">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Hora</TableHead><TableHead>Produto</TableHead><TableHead>Cliente</TableHead><TableHead>Total</TableHead><TableHead>Acoes</TableHead></TableRow></TableHeader>
              <TableBody>
                {isLoading && barSales.length === 0 ? [1, 2, 3].map(i => <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell></TableRow>) :
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
          </div>
        </TabsContent>
        <TabsContent value="ranking"><BarRanking /></TabsContent>
      </Tabs>
      <ConfirmDialog open={confirmDeleteId !== null} onOpenChange={() => setConfirmDeleteId(null)} onConfirm={() => { removeProduct(confirmDeleteId!); setConfirmDeleteId(null) }} title="Excluir Produto" description="Tem certeza que deseja remover este produto? Isso pode afetar o historico de vendas." />
      <ConfirmDialog open={confirmDeleteSaleId !== null} onOpenChange={() => setConfirmDeleteSaleId(null)} onConfirm={handleDeleteSale} title="Excluir Venda" description="Tem certeza que deseja remover este registro de venda?" />
      <ConfirmDialog open={showEditProductConfirm} onOpenChange={setShowEditProductConfirm} onConfirm={confirmUpdateProduct} title="Confirmar Edição" description="Tem certeza que deseja salvar as alterações neste produto?" />
      <ConfirmDialog open={showEditSaleConfirm} onOpenChange={setShowEditSaleConfirm} onConfirm={confirmUpdateSale} title="Confirmar Edição" description="Tem certeza que deseja salvar as alterações nesta venda?" />
    </div>
  )
}
