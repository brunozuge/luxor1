"use client"

import React from "react"

import { useState } from "react"
import { useEventData, type TicketType } from "@/lib/event-data"
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
import { Plus, Search, Trash2, Edit, Users } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

const ticketTypeLabels: Record<TicketType, string> = {
  pista: "Pista",
  camarote: "Camarote",
  vip: "VIP",
  free: "Free",
}

const ticketTypeColors: Record<TicketType, string> = {
  pista: "bg-chart-5 text-primary-foreground",
  camarote: "bg-primary text-primary-foreground",
  vip: "bg-warning text-warning-foreground",
  free: "bg-success text-success-foreground",
}

function calcAge(dataNascimento: string) {
  const today = new Date()
  const birth = new Date(dataNascimento)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export function PessoasModule() {
  const { pessoas, addPessoa, removePessoa } = useEventData()
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
    nome: "",
    instagram: "",
    cpfRg: "",
    dataNascimento: "",
    tipoIngresso: "pista" as TicketType,
    observacao: "",
  })

  const filtered = pessoas.filter(
    (p) =>
      p.nome.toLowerCase().includes(search.toLowerCase()) ||
      p.cpfRg.includes(search) ||
      p.instagram.toLowerCase().includes(search.toLowerCase())
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome || !form.dataNascimento) return
    addPessoa(form)
    setForm({ nome: "", instagram: "", cpfRg: "", dataNascimento: "", tipoIngresso: "pista", observacao: "" })
    setDialogOpen(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cadastro de Pessoas</h1>
          <p className="text-sm text-muted-foreground">
            {pessoas.length} pessoas cadastradas
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Pessoa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-card text-card-foreground">
            <DialogHeader>
              <DialogTitle>Cadastrar Pessoa</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={form.instagram}
                  onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                  placeholder="@usuario"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="cpfRg">CPF/RG/Termo</Label>
                <Input
                  id="cpfRg"
                  value={form.cpfRg}
                  onChange={(e) => setForm({ ...form, cpfRg: e.target.value })}
                  placeholder="Documento"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="dataNascimento">Data de Nascimento *</Label>
                <Input
                  id="dataNascimento"
                  type="date"
                  value={form.dataNascimento}
                  onChange={(e) => setForm({ ...form, dataNascimento: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Tipo de Ingresso</Label>
                <Select
                  value={form.tipoIngresso}
                  onValueChange={(v) => setForm({ ...form, tipoIngresso: v as TicketType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pista">Pista</SelectItem>
                    <SelectItem value="camarote">Camarote</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="obs">Observacao</Label>
                <Textarea
                  id="obs"
                  value={form.observacao}
                  onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                  placeholder="Ex: influencer, amigo, etc."
                  rows={2}
                />
              </div>
              <Button type="submit" className="w-full">Cadastrar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pessoas.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Maiores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pessoas.filter((p) => calcAge(p.dataNascimento) >= 18).length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Menores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {pessoas.filter((p) => calcAge(p.dataNascimento) < 18).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, CPF ou Instagram..."
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
                <TableHead>Nome</TableHead>
                <TableHead>Instagram</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Idade</TableHead>
                <TableHead>Ingresso</TableHead>
                <TableHead>Obs.</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => {
                const age = calcAge(p.dataNascimento)
                const isMenor = age < 18
                return (
                  <TableRow key={p.id} className="border-border">
                    <TableCell className="font-medium">{p.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{p.instagram || "-"}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">{p.cpfRg || "-"}</TableCell>
                    <TableCell>
                      <span className={isMenor ? "text-warning font-semibold" : ""}>
                        {age} {isMenor ? "(menor)" : ""}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={ticketTypeColors[p.tipoIngresso]}>
                        {ticketTypeLabels[p.tipoIngresso]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs max-w-32 truncate">
                      {p.observacao || "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removePessoa(p.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma pessoa encontrada
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
