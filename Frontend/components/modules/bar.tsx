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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Wine, TrendingUp, Package, DollarSign, ShoppingCart, Trophy, Trash2, X, Pencil } from "lucide-react"
import { BarRanking } from "./bar-ranking"
import { ConfirmDialog } from "@/components/confirm-dialog"

export function BarModule() {
  const { products, barSales, pessoas, colaboradores, addProducts, addBarSales, removeProduct, updateProduct, removeBarSale, updateBarSale } = useEventData()
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

  const [saleVendedor, setSaleVendedor] = useState("")
  const [salePessoaId, setSalePessoaId] = useState("")
  const [saleRows, setSaleRows] = useState([{
    productId: "",
    quantidade: "1",
  }])

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
      const p = productRows[0]
      if (Number(p.precoVenda) < 0 || Number(p.custo) < 0 || Number(p.estoqueInicial) < 0) {
        toast.error("Valores nao podem ser negativos.")
        return
      }

      // Check Duplicates (except self)
      const duplicate = products.find(x => x.nome.toLowerCase() === p.nome.toLowerCase() && x.id !== editingProduct.id)
      if (duplicate) return toast.error(`Já existe um produto com o nome "${p.nome}".`)

      updateProduct(editingProduct.id, {
        nome: p.nome,
        custo: parseCurrency(p.custo),
        precoVenda: parseCurrency(p.precoVenda),
        estoqueInicial: Number(p.estoqueInicial),
        estoqueAtual: editingProduct.estoqueAtual + (Number(p.estoqueInicial) - editingProduct.estoqueInicial)
      })
      setEditingProduct(null)
    } else {
      const validProducts = productRows.filter(p => p.nome.trim())

      for (const p of validProducts) {
        const dup = products.find(x => x.nome.toLowerCase() === p.nome.toLowerCase())
        if (dup) {
          toast.error("Produto Duplicado", {
            description: `O produto "${p.nome}" já existe no estoque.`
          })
          return
        }
      }

      if (validProducts.some(p => Number(p.precoVenda) < 0 || Number(p.custo) < 0 || Number(p.estoqueInicial) < 0)) {
        toast.error("Valores nao podem ser negativos.")
        return
      }

      addProducts(validProducts.map(p => ({
        nome: p.nome,
        custo: parseCurrency(p.custo),
        precoVenda: parseCurrency(p.precoVenda),
        estoqueInicial: Number(p.estoqueInicial) || 0,
      })))
    }

    setProductRows([{ nome: "", custo: "", precoVenda: "", estoqueInicial: "" }])
    setErrors({})
    setProductDialogOpen(false)
  }

  function handleDeleteProduct() {
    if (confirmDeleteId) {
      removeProduct(confirmDeleteId)
      setConfirmDeleteId(null)
    }
  }

  function handleAddSaleRow() {
    setSaleRows([...saleRows, { productId: "", quantidade: "1" }])
  }

  function handleRemoveSaleRow(index: number) {
    if (saleRows.length === 1) return
    setSaleRows(saleRows.filter((_, i) => i !== index))
  }

  function handleAddSale(e: React.FormEvent) {
    e.preventDefault()

    const newErrors: Record<string, boolean> = {
      saleVendedor: !saleVendedor,
      salePessoaId: !salePessoaId || salePessoaId === "none"
    }

    saleRows.forEach((r, i) => {
      if (!r.productId) newErrors[`sale-${i}-product`] = true
      if (!r.quantidade || Number(r.quantidade) <= 0) newErrors[`sale-${i}-qty`] = true
    })

    setErrors(newErrors)

    if (Object.values(newErrors).some(v => v)) {
      toast.error("Venda Incompleta", {
        description: "Preencha o vendedor, cliente e todos os produtos."
      })
      return
    }

    if (editingSale) {
      updateBarSale(editingSale.id, {
        vendedor: saleVendedor,
        quantidade: Number(saleRows[0].quantidade),
        pessoaId: salePessoaId || undefined
      })
      setEditingSale(null)
    } else {
      addBarSales(
        saleVendedor,
        saleRows.map(r => ({
          productId: r.productId,
          quantidade: Math.floor(Number(r.quantidade)) || 1,
        })),
        salePessoaId || undefined
      )
    }

    setSaleVendedor("")
    setSalePessoaId("")
    setSaleRows([{ productId: "", quantidade: "1" }])
    setSaleDialogOpen(false)
  }

  function openEditSale(sale: any) {
    setEditingSale(sale)
    setSaleVendedor(sale.vendedor)
    setSalePessoaId(sale.pessoaId)
    setSaleRows([{
      productId: sale.productId,
      quantidade: String(sale.quantidade)
    }])
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
      return [
        s.hora,
        prod?.nome || "-",
        pessoa?.nome || "-",
        s.vendedor,
        s.quantidade,
        s.valorTotal.toFixed(2)
      ].join(";")
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

  function handlePrint() {
    window.print()
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
          <Dialog open={productDialogOpen} onOpenChange={(v) => {
            setProductDialogOpen(v)
            if (!v) {
              setEditingProduct(null)
              setErrors({})
              setProductRows([{ nome: "", custo: "", precoVenda: "", estoqueInicial: "" }])
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Produtos
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl bg-card text-card-foreground">
              <DialogHeader>
                <DialogTitle>{editingProduct ? "Editar Produto" : "Cadastrar Produtos"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddProduct} className="flex flex-col gap-4">
                <div className="max-h-[400px] overflow-y-auto pr-2 flex flex-col gap-6">
                  {productRows.map((row, index) => (
                    <div key={index} className="flex flex-col gap-3 p-4 rounded-lg border border-border relative bg-secondary/20">
                      {productRows.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => handleRemoveRow(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      <div className="flex flex-col gap-2">
                        <Label>Nome do Produto *</Label>
                        <Input
                          value={row.nome}
                          onChange={(e) => {
                            const newRows = [...productRows]
                            newRows[index].nome = e.target.value
                            setProductRows(newRows)
                            if (errors[`product-${index}-nome`]) setErrors(prev => ({ ...prev, [`product-${index}-nome`]: false }))
                          }}
                          placeholder="Ex: Cerveja Lata"
                          className={errors[`product-${index}-nome`] ? "border-destructive focus-visible:ring-destructive" : ""}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="flex flex-col gap-2">
                          <Label>Custo Unitario (R$) *</Label>
                          <Input
                            value={row.custo}
                            onChange={(e) => {
                              const newRows = [...productRows]
                              newRows[index].custo = formatCurrency(e.target.value)
                              setProductRows(newRows)
                              if (errors[`product-${index}-custo`]) setErrors(prev => ({ ...prev, [`product-${index}-custo`]: false }))
                            }}
                            placeholder="0,00"
                            className={errors[`product-${index}-custo`] ? "border-destructive focus-visible:ring-destructive" : ""}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>Preco de Venda (R$) *</Label>
                          <Input
                            value={row.precoVenda}
                            onChange={(e) => {
                              const newRows = [...productRows]
                              newRows[index].precoVenda = formatCurrency(e.target.value)
                              setProductRows(newRows)
                              if (errors[`product-${index}-precoVenda`]) setErrors(prev => ({ ...prev, [`product-${index}-precoVenda`]: false }))
                            }}
                            placeholder="0,00"
                            className={errors[`product-${index}-precoVenda`] ? "border-destructive focus-visible:ring-destructive" : ""}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>Estoque Inicial *</Label>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={row.estoqueInicial}
                            onChange={(e) => {
                              const newRows = [...productRows]
                              newRows[index].estoqueInicial = e.target.value
                              setProductRows(newRows)
                              if (errors[`product-${index}-estoqueInicial`]) setErrors(prev => ({ ...prev, [`product-${index}-estoqueInicial`]: false }))
                            }}
                            placeholder="0"
                            className={errors[`product-${index}-estoqueInicial`] ? "border-destructive focus-visible:ring-destructive" : ""}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  {!editingProduct && (
                    <Button type="button" variant="outline" className="flex-1" onClick={handleAddRow}>
                      <Plus className="mr-2 h-4 w-4" />
                      Mais um Produto
                    </Button>
                  )}
                  <Button type="submit" className="flex-1">
                    {editingProduct ? "Salvar Alteracoes" : "Salvar Todos"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={saleDialogOpen} onOpenChange={(v) => {
            setSaleDialogOpen(v)
            if (!v) {
              setEditingSale(null)
              setSaleVendedor("")
              setSalePessoaId("")
              setSaleRows([{ productId: "", quantidade: "1" }])
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Nova Venda
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl bg-card text-card-foreground">
              <DialogHeader>
                <DialogTitle>{editingSale ? "Editar Venda" : "Registrar Venda"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddSale} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>Funcionario (vendedor) *</Label>
                    <Select
                      value={saleVendedor}
                      onValueChange={(v) => {
                        setSaleVendedor(v)
                        if (errors.saleVendedor) setErrors(prev => ({ ...prev, saleVendedor: false }))
                      }}
                    >
                      <SelectTrigger className={errors.saleVendedor ? "border-destructive focus-visible:ring-destructive" : ""}>
                        <SelectValue placeholder="Selecione o funcionario" />
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
                  <div className="flex flex-col gap-2">
                    <Label>Cliente</Label>
                    <Select
                      value={salePessoaId}
                      onValueChange={(v) => {
                        setSalePessoaId(v)
                        if (errors.salePessoaId) setErrors(prev => ({ ...prev, salePessoaId: false }))
                      }}
                    >
                      <SelectTrigger className={errors.salePessoaId ? "border-destructive focus-visible:ring-destructive" : ""}>
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
                </div>

                <div className="max-h-[300px] overflow-y-auto pr-2 flex flex-col gap-4">
                  {saleRows.map((row, index) => (
                    <div key={index} className="flex items-end gap-3 p-3 rounded-lg border border-border bg-secondary/10 relative">
                      <div className="flex-1 flex flex-col gap-2">
                        <Label className="text-xs">Produto *</Label>
                        <Select
                          value={row.productId}
                          onValueChange={(v) => {
                            const newRows = [...saleRows]
                            newRows[index].productId = v
                            setSaleRows(newRows)
                            if (errors[`sale-${index}-product`]) setErrors(prev => ({ ...prev, [`sale-${index}-product`]: false }))
                          }}
                        >
                          <SelectTrigger className={errors[`sale-${index}-product`] ? "border-destructive focus-visible:ring-destructive" : ""}>
                            <SelectValue placeholder="Selecione produto" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.filter((p) => p.estoqueAtual > 0).map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.nome} - R$ {p.precoVenda}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-24 flex flex-col gap-2">
                        <Label className="text-xs">Qtd</Label>
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          value={row.quantidade}
                          onChange={(e) => {
                            const newRows = [...saleRows]
                            newRows[index].quantidade = e.target.value
                            setSaleRows(newRows)
                            if (errors[`sale-${index}-qty`]) setErrors(prev => ({ ...prev, [`sale-${index}-qty`]: false }))
                          }}
                          placeholder="1"
                          className={errors[`sale-${index}-qty`] ? "border-destructive focus-visible:ring-destructive" : ""}
                        />
                      </div>
                      {saleRows.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveSaleRow(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  {!editingSale && (
                    <Button type="button" variant="outline" onClick={handleAddSaleRow} className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar mais Item
                    </Button>
                  )}
                  <div className="rounded-lg bg-primary/10 p-3 flex justify-between items-center">
                    <span className="text-sm font-medium">Total do Pedido:</span>
                    <span className="text-lg font-bold text-primary">
                      R$ {saleRows.reduce((sum, r) => {
                        const p = products.find(x => x.id === r.productId)
                        return sum + (p ? p.precoVenda * (Number(r.quantidade) || 0) : 0)
                      }, 0).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <Button type="submit" className="w-full h-11">
                    Finalizar Venda
                  </Button>
                </div>
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
                    <TableHead className="text-right">Acoes</TableHead>
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
                                className={`h-full rounded-full ${stockPercent < 20 ? "bg-destructive" : "bg-primary"
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
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={() => openEditProduct(p)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => setConfirmDeleteId(p.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
          <div className="mb-4 flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={exportToExcel}>
              Exportar Excel (CSV)
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              Imprimir / PDF
            </Button>
          </div>
          <Card className="bg-card border-border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead>Hora</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="text-right">Acoes</TableHead>
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
                        <TableCell className="text-accent">{s.vendedor}</TableCell>
                        <TableCell>{s.quantidade}</TableCell>
                        <TableCell className="font-semibold">
                          R$ {s.valorTotal.toLocaleString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                              onClick={() => openEditSale(s)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => setConfirmDeleteSaleId(s.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {barSales.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
          <Card className="bg-card border-border overflow-hidden">
            <CardHeader className="flex flex-row items-center gap-3 border-b border-border pb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
                <Trophy className="h-5 w-5 text-accent" />
              </div>
              <div>
                <CardTitle className="text-base">Ranking de Gastos</CardTitle>
                <p className="text-xs text-muted-foreground">Quem mais consome no bar</p>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <BarRanking />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        onConfirm={handleDeleteProduct}
        title="Excluir Produto"
        description="Tem certeza que deseja excluir este produto? Esta acao nao pode ser desfeita."
      />

      <ConfirmDialog
        open={confirmDeleteSaleId !== null}
        onOpenChange={(open) => !open && setConfirmDeleteSaleId(null)}
        onConfirm={handleDeleteSale}
        title="Excluir Venda"
        description="Deseja realmente remover esta venda? O estoque do produto sera devolvido."
      />
    </div>
  )
}
