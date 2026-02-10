"use client"

import { useEventData } from "@/lib/event-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Ticket,
  DoorOpen,
  Wine,
  Crown,
  DollarSign,
  TrendingUp,
  AlertTriangle,
} from "lucide-react"

export function DashboardModule() {
  const {
    pessoas,
    tickets,
    products,
    barSales,
    camaroteTables,
    pessoasDentro,
    lotacaoMaxima,
  } = useEventData()

  const percentage = Math.round((pessoasDentro / lotacaoMaxima) * 100)
  const isNearCapacity = percentage >= 80

  // Ticket revenue
  const ticketRevenue = tickets.reduce((sum, t) => sum + t.valorPago, 0)
  const ticketsPending = tickets.filter((t) => !t.entrou).length

  // Bar stats
  const barRevenue = barSales.reduce((sum, s) => sum + s.valorTotal, 0)
  const barCost = barSales.reduce((sum, s) => {
    const prod = products.find((p) => p.id === s.productId)
    return sum + (prod ? prod.custo * s.quantidade : 0)
  }, 0)
  const barProfit = barRevenue - barCost

  // Top product
  const productSales = products.map((p) => ({
    ...p,
    sold: barSales.filter((s) => s.productId === p.id).reduce((sum, s) => sum + s.quantidade, 0),
  })).sort((a, b) => b.sold - a.sold)
  const topProduct = productSales[0]

  // Camarote stats
  const totalGarrafas = camaroteTables.reduce((sum, t) => sum + t.garrafas.length, 0)

  // Low stock items
  const lowStock = products.filter(
    (p) => p.estoqueInicial > 0 && p.estoqueAtual / p.estoqueInicial < 0.2
  )

  // Revenue total
  const totalRevenue = ticketRevenue + barRevenue

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Visao geral do evento em tempo real
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pessoas Dentro</CardTitle>
            <DoorOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums">{pessoasDentro}</div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full rounded-full transition-all ${
                  isNearCapacity ? "bg-destructive" : "bg-primary"
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            <p className={`mt-1 text-xs ${isNearCapacity ? "text-destructive" : "text-muted-foreground"}`}>
              {percentage}% de {lotacaoMaxima}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">
              R$ {totalRevenue.toLocaleString("pt-BR")}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Ingressos + Bar
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cadastrados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pessoas.length}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {tickets.length} ingressos
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lucro Bar</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">
              R$ {barProfit.toLocaleString("pt-BR")}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Faturamento: R$ {barRevenue.toLocaleString("pt-BR")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed sections */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Ingressos summary */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Ticket className="h-4 w-4 text-primary" />
              Ingressos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{tickets.length}</div>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">{pessoasDentro}</div>
                <p className="text-xs text-muted-foreground">Entraram</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">{ticketsPending}</div>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </div>
            <div className="mt-4 rounded-lg bg-secondary/50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Arrecadado</span>
                <span className="font-bold">R$ {ticketRevenue.toLocaleString("pt-BR")}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bar summary */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wine className="h-4 w-4 text-primary" />
              Bar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{barSales.length}</div>
                <p className="text-xs text-muted-foreground">Vendas</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{products.length}</div>
                <p className="text-xs text-muted-foreground">Produtos</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">
                  R$ {barRevenue.toLocaleString("pt-BR")}
                </div>
                <p className="text-xs text-muted-foreground">Faturamento</p>
              </div>
            </div>
            {topProduct && (
              <div className="mt-4 rounded-lg bg-secondary/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Mais vendido</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{topProduct.nome}</span>
                    <Badge variant="outline" className="border-border">{topProduct.sold} un</Badge>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Camarote summary */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Crown className="h-4 w-4 text-primary" />
              Camarote / VIP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{camaroteTables.length}</div>
                <p className="text-xs text-muted-foreground">Mesas</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{totalGarrafas}</div>
                <p className="text-xs text-muted-foreground">Garrafas</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {camaroteTables.reduce((s, t) => s + t.pessoaIds.length, 0)}
                </div>
                <p className="text-xs text-muted-foreground">Pessoas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {isNearCapacity && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3">
                  <DoorOpen className="h-4 w-4 text-destructive" />
                  <span className="text-sm text-destructive">
                    Lotacao em {percentage}% da capacidade
                  </span>
                </div>
              )}
              {lowStock.map((p) => (
                <div key={p.id} className="flex items-center gap-2 rounded-lg bg-warning/10 p-3">
                  <Wine className="h-4 w-4 text-warning" />
                  <span className="text-sm text-warning">
                    {p.nome}: estoque baixo ({p.estoqueAtual} restantes)
                  </span>
                </div>
              ))}
              {!isNearCapacity && lowStock.length === 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-success/10 p-3">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span className="text-sm text-success">
                    Tudo funcionando normalmente
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
