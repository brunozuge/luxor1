"use client"

import { useState } from "react"
import { useEventData, type WristbandColor } from "@/lib/event-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { DoorOpen, AlertTriangle, UserCheck, Search, ShieldAlert } from "lucide-react"

const wristbandLabels: Record<WristbandColor, string> = {
  maior: "Maior de Idade",
  menor: "Menor de Idade",
  camarote: "Camarote",
  staff: "Staff",
}

const wristbandStyles: Record<WristbandColor, string> = {
  maior: "bg-success text-success-foreground",
  menor: "bg-warning text-warning-foreground",
  camarote: "bg-primary text-primary-foreground",
  staff: "bg-secondary text-secondary-foreground border border-border",
}

function calcAge(dataNascimento: string) {
  const today = new Date()
  const birth = new Date(dataNascimento)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export function PortariaModule() {
  const { tickets, pessoas, pessoasDentro, lotacaoMaxima, marcarEntrada } = useEventData()
  const [searchTicket, setSearchTicket] = useState("")
  const [selectedWristband, setSelectedWristband] = useState<WristbandColor>("maior")
  const [lastEntry, setLastEntry] = useState<{ nome: string; hora: string } | null>(null)

  const percentage = Math.round((pessoasDentro / lotacaoMaxima) * 100)
  const isNearCapacity = percentage >= 80
  const isAtCapacity = percentage >= 100

  const foundTicket = tickets.find((t) => t.numero === searchTicket && !t.entrou)
  const foundPessoa = foundTicket ? pessoas.find((p) => p.id === foundTicket.pessoaId) : null
  const isMenor = foundPessoa ? calcAge(foundPessoa.dataNascimento) < 18 : false

  function handleEntry() {
    if (!foundTicket) return
    marcarEntrada(foundTicket.id, selectedWristband)
    const now = new Date()
    const hora = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
    setLastEntry({ nome: foundPessoa?.nome || "Desconhecido", hora })
    setSearchTicket("")
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sistema de Portaria</h1>
        <p className="text-sm text-muted-foreground">
          Controle de entrada no evento
        </p>
      </div>

      {isAtCapacity && (
        <Alert className="border-destructive bg-destructive/10">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <AlertTitle className="text-destructive">Lotacao Maxima Atingida!</AlertTitle>
          <AlertDescription className="text-destructive/80">
            O evento atingiu a capacidade maxima de {lotacaoMaxima} pessoas.
          </AlertDescription>
        </Alert>
      )}

      {isNearCapacity && !isAtCapacity && (
        <Alert className="border-warning bg-warning/10">
          <ShieldAlert className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning">Atencao: Lotacao Proxima</AlertTitle>
          <AlertDescription className="text-warning/80">
            {percentage}% da capacidade maxima.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dentro do Evento</CardTitle>
            <DoorOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold tabular-nums">{pessoasDentro}</div>
            <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full rounded-full transition-all ${
                  isNearCapacity ? "bg-destructive" : "bg-primary"
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {percentage}% de {lotacaoMaxima}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-warning tabular-nums">
              {tickets.filter((t) => !t.entrou).length}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">ingressos nao utilizados</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ultima Entrada</CardTitle>
            <UserCheck className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            {lastEntry ? (
              <>
                <div className="text-lg font-bold">{lastEntry.nome}</div>
                <p className="text-sm text-muted-foreground">{lastEntry.hora}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma entrada registrada</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Registrar Entrada</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="ticket-search" className="text-base">Numero do Ingresso</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="ticket-search"
                value={searchTicket}
                onChange={(e) => setSearchTicket(e.target.value)}
                placeholder="Digite o numero do ingresso..."
                className="h-14 pl-12 text-xl font-mono"
              />
            </div>
          </div>

          {searchTicket && !foundTicket && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
              <p className="text-destructive font-medium">
                Ingresso nao encontrado ou ja utilizado
              </p>
            </div>
          )}

          {foundTicket && foundPessoa && (
            <div className="rounded-lg border border-border bg-secondary/50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold">{foundPessoa.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    Ingresso #{foundTicket.numero} - Lote {foundTicket.lote}
                  </p>
                </div>
                {isMenor && (
                  <Badge className="bg-warning text-warning-foreground text-sm px-3 py-1">
                    MENOR DE IDADE
                  </Badge>
                )}
              </div>
              {foundPessoa.observacao && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Obs: {foundPessoa.observacao}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label className="text-base">Pulseira</Label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(Object.keys(wristbandLabels) as WristbandColor[]).map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedWristband(color)}
                  className={`rounded-lg border-2 p-4 text-center transition-all ${
                    selectedWristband === color
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <div className={`mx-auto mb-2 h-6 w-6 rounded-full ${wristbandStyles[color]}`} />
                  <span className="text-sm font-medium">{wristbandLabels[color]}</span>
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleEntry}
            disabled={!foundTicket || isAtCapacity}
            className="h-14 text-lg font-semibold"
            size="lg"
          >
            <DoorOpen className="mr-2 h-5 w-5" />
            Marcar Entrada
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Entradas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {tickets
              .filter((t) => t.entrou)
              .sort((a, b) => (b.horaEntrada || "").localeCompare(a.horaEntrada || ""))
              .slice(0, 10)
              .map((t) => {
                const pessoa = pessoas.find((p) => p.id === t.pessoaId)
                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm text-muted-foreground">#{t.numero}</span>
                      <span className="font-medium">{pessoa?.nome || "-"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {t.pulseira && (
                        <Badge className={wristbandStyles[t.pulseira]}>
                          {wristbandLabels[t.pulseira]}
                        </Badge>
                      )}
                      <span className="text-sm text-muted-foreground">{t.horaEntrada}</span>
                    </div>
                  </div>
                )
              })}
            {tickets.filter((t) => t.entrou).length === 0 && (
              <p className="py-4 text-center text-muted-foreground">
                Nenhuma entrada registrada ainda
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
