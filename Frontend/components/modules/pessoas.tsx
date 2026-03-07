"use client"

import React from "react"

import { useState } from "react"
import { useEventData, type TicketType } from "@/lib/event-data"
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
import { Plus, Search, Trash2, Pencil, Users } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Skeleton } from "@/components/ui/skeleton"

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

function validateCPF(cpf: string) {
  if (!cpf) return false
  cpf = cpf.replace(/[^\d]+/g, "")
  if (cpf.length !== 11) return false

  // Bloqueia sequencias como 111.111.111-11
  if (/^(\d)\1+$/.test(cpf)) return false

  let soma = 0
  let resto

  for (let i = 1; i <= 9; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (11 - i)
  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(cpf.substring(9, 10))) return false

  soma = 0
  for (let i = 1; i <= 10; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (12 - i)
  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(cpf.substring(10, 11))) return false

  return true
}

function formatCPF(v: string) {
  v = v.replace(/\D/g, "")
  if (v.length > 11) v = v.slice(0, 11)
  if (v.length <= 3) return v
  if (v.length <= 6) return v.replace(/(\d{3})(\d+)/, "$1.$2")
  if (v.length <= 9) return v.replace(/(\d{3})(\d{3})(\d+)/, "$1.$2.$3")
  return v.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, "$1.$2.$3-$4")
}

export function PessoasModule() {
  const { pessoas, addPessoa, updatePessoa, removePessoa, fetchedModules } = useEventData()
  const isLoading = !fetchedModules.has("pessoas")
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({
    nome: "",
    instagram: "",
    cpfRg: "",
    dataNascimento: "",
    tipoIngresso: "pista" as TicketType,
    observacao: "",
  })
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  const filtered = pessoas.filter(
    (p) =>
      p.nome.toLowerCase().includes(search.toLowerCase()) ||
      p.cpfRg.includes(search) ||
      p.instagram.toLowerCase().includes(search.toLowerCase())
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const newErrors: Record<string, boolean> = {
      nome: !form.nome,
      cpfRg: !form.cpfRg,
      dataNascimento: !form.dataNascimento,
      tipoIngresso: !form.tipoIngresso,
    }
    setErrors(newErrors)

    if (Object.values(newErrors).some(v => v)) {
      toast.error("Por favor, preencha todos os campos destacados em vermelho.")
      return
    }

    const digitsOnly = form.cpfRg.replace(/\D/g, "")
    const isEditing = !!editingId

    // 1. Validar CPF (se tiver 11 dígitos)
    if (digitsOnly.length === 11) {
      if (!validateCPF(digitsOnly)) {
        toast.error("CPF Inválido", {
          description: "Os dígitos verificadores do CPF não conferem. Por favor, revise os números."
        })
        setErrors(prev => ({ ...prev, cpfRg: true }))
        return
      }
    } else if (digitsOnly.length > 0 && digitsOnly.length < 11) {
      // Se informou algo mas não completou 11 dígitos, tratamos como erro de CPF incompleto/inválido
      toast.error("CPF Inválido", {
        description: "O CPF deve conter 11 dígitos."
      })
      setErrors(prev => ({ ...prev, cpfRg: true }))
      return
    }

    // 2. Validar Data de Nascimento (não pode ser futura)
    if (form.dataNascimento) {
      const birthDate = new Date(form.dataNascimento)
      const today = new Date()
      if (birthDate > today) {
        toast.error("Data de Nascimento Invalida", {
          description: "A data de nascimento nao pode ser uma data futura."
        })
        setErrors(prev => ({ ...prev, dataNascimento: true }))
        return
      }
    }

    // 3. Validar Unicidade (Frontend)
    const alreadyExists = pessoas.find(p => {
      const pCpf = (p.cpfRg || "").replace(/\D/g, "")
      return pCpf === digitsOnly && p.id !== editingId
    })

    if (alreadyExists) {
      toast.error("Documento em Uso", {
        description: `Este CPF/RG ja esta cadastrado para ${alreadyExists.nome}.`
      })
      setErrors(prev => ({ ...prev, cpfRg: true }))
      return
    }

    // 4. Se passou em tudo, prossegue com a requisição
    try {
      let success = false
      if (isEditing) {
        // updatePessoa em lib/event-data.tsx deve retornar algo ou disparar erro
        const res = await updatePessoa(editingId, form)
        success = true // Se nao der erro, consideramos sucesso
      } else {
        const resId = await addPessoa(form)
        if (resId) success = true
      }

      if (success) {
        // SÓ LIMPA E FECHA SE DER CERTO
        setForm({ nome: "", instagram: "", cpfRg: "", dataNascimento: "", tipoIngresso: "pista", observacao: "" })
        setEditingId(null)
        setErrors({})
        setDialogOpen(false)
      }
    } catch (err) {
      console.error("Erro ao salvar:", err)
      // O toast.promise ja mostra o erro, entao nao fazemos nada aqui para manter a modal aberta
    }
  }

  function openEditDialog(pessoa: any) {
    setEditingId(pessoa.id)
    setForm({
      nome: pessoa.nome,
      instagram: pessoa.instagram || "",
      cpfRg: formatCPF(pessoa.cpfRg || ""),
      dataNascimento: pessoa.dataNascimento || "",
      tipoIngresso: pessoa.tipoIngresso,
      observacao: pessoa.observacao || "",
    })
    setDialogOpen(true)
  }

  function openNewDialog() {
    setEditingId(null)
    setForm({ nome: "", instagram: "", cpfRg: "", dataNascimento: "", tipoIngresso: "pista", observacao: "" })
    setDialogOpen(true)
  }

  function handleDeletePessoa() {
    if (confirmDeleteId) {
      removePessoa(confirmDeleteId)
      setConfirmDeleteId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-foreground">Cadastro de Pessoas</h1>
          <p className="text-sm text-muted-foreground">
            {pessoas.length} pessoas cadastradas
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Dialog open={dialogOpen} onOpenChange={(v) => {
            setDialogOpen(v)
            if (!v) {
              setEditingId(null)
              setErrors({})
              setForm({ nome: "", instagram: "", cpfRg: "", dataNascimento: "", tipoIngresso: "pista", observacao: "" })
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={openNewDialog} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Nova Pessoa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-xl bg-card text-card-foreground p-0 overflow-hidden flex flex-col max-h-[90vh]">
              <DialogHeader className="p-6 pb-2">
                <DialogTitle>{editingId ? "Editar Pessoa" : "Cadastrar Pessoa"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 pt-2 flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      value={form.nome}
                      onChange={(e) => {
                        setForm({ ...form, nome: e.target.value })
                        if (errors.nome) setErrors(prev => ({ ...prev, nome: false }))
                      }}
                      placeholder="Nome completo"
                      className={errors.nome ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      value={form.instagram}
                      onChange={(e) => {
                        setForm({ ...form, instagram: e.target.value })
                        if (errors.instagram) setErrors(prev => ({ ...prev, instagram: false }))
                      }}
                      placeholder="@usuario"
                      className={errors.instagram ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="cpfRg">CPF/RG/Termo *</Label>
                    <Input
                      id="cpfRg"
                      value={form.cpfRg}
                      onChange={(e) => {
                        setForm({ ...form, cpfRg: formatCPF(e.target.value) })
                        if (errors.cpfRg) setErrors(prev => ({ ...prev, cpfRg: false }))
                      }}
                      placeholder="000.000.000-00"
                      className={errors.cpfRg ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="dataNascimento">Data de Nascimento *</Label>
                    <Input
                      id="dataNascimento"
                      type="date"
                      value={form.dataNascimento}
                      onChange={(e) => {
                        setForm({ ...form, dataNascimento: e.target.value })
                        if (errors.dataNascimento) setErrors(prev => ({ ...prev, dataNascimento: false }))
                      }}
                      className={errors.dataNascimento ? "border-destructive focus-visible:ring-destructive" : ""}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Tipo de Ingresso *</Label>
                  <Select
                    value={form.tipoIngresso}
                    onValueChange={(v) => {
                      setForm({ ...form, tipoIngresso: v as TicketType })
                      if (errors.tipoIngresso) setErrors(prev => ({ ...prev, tipoIngresso: false }))
                    }}
                  >
                    <SelectTrigger className={errors.tipoIngresso ? "border-destructive focus-visible:ring-destructive" : ""}>
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
                  <Label htmlFor="obs">Observação</Label>
                  <Textarea
                    id="obs"
                    value={form.observacao}
                    onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                    placeholder="Ex: influencer, amigo, etc."
                    rows={2}
                  />
                </div>
                <div className="pt-2 sticky bottom-0 bg-card">
                  <Button type="submit" className="w-full">{editingId ? "Salvar Alterações" : "Cadastrar"}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className={`bg-card border-border ${i === 3 ? "col-span-2 sm:col-span-1" : ""}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-4 pt-4">
              {isLoading && pessoas.length === 0 ? (
                <>
                  <Skeleton className="h-4 w-[60%]" />
                  <Skeleton className="h-4 w-4" />
                </>
              ) : i === 1 ? (
                <>
                  <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-tight">Total Pessoas</CardTitle>
                  <Users className="h-4 w-4 text-primary shrink-0" />
                </>
              ) : i === 2 ? (
                <>
                  <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-tight">Maiores Idade</CardTitle>
                  <Users className="h-4 w-4 text-success shrink-0" />
                </>
              ) : (
                <>
                  <CardTitle className="text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-tight">Menores Idade</CardTitle>
                  <Users className="h-4 w-4 text-warning shrink-0" />
                </>
              )}
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              {isLoading && pessoas.length === 0 ? (
                <Skeleton className="h-8 w-[40%]" />
              ) : i === 1 ? (
                <div className="text-xl sm:text-2xl font-bold">{pessoas.length}</div>
              ) : i === 2 ? (
                <div className="text-xl sm:text-2xl font-bold">
                  {pessoas.filter((p) => calcAge(p.dataNascimento) >= 18).length}
                </div>
              ) : (
                <div className="text-xl sm:text-2xl font-bold text-warning">
                  {pessoas.filter((p) => calcAge(p.dataNascimento) < 18).length}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
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
                <TableHead className="hidden md:table-cell">Instagram</TableHead>
                <TableHead className="hidden sm:table-cell">Documento</TableHead>
                <TableHead>Idade</TableHead>
                <TableHead>Ingresso</TableHead>
                <TableHead className="hidden lg:table-cell">Obs.</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && pessoas.length === 0 ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24 font-mono" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                  </TableRow>
                ))
              ) : (
                filtered.map((p) => {
                  const age = calcAge(p.dataNascimento)
                  const isMenor = age < 18
                  return (
                    <TableRow key={p.id} className="border-border">
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{p.nome}</span>
                          <span className="text-[10px] text-muted-foreground sm:hidden">{formatCPF(p.cpfRg)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell">{p.instagram || "-"}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs hidden sm:table-cell">{formatCPF(p.cpfRg) || "-"}</TableCell>
                      <TableCell>
                        <span className={isMenor ? "text-warning font-semibold text-xs" : "text-xs"}>
                          {age}{isMenor ? "m" : ""}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${ticketTypeColors[p.tipoIngresso]} text-[10px] px-1.5 h-5`}>
                          {ticketTypeLabels[p.tipoIngresso]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs max-w-32 truncate hidden lg:table-cell">
                        {p.observacao || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(p)}
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setConfirmDeleteId(p.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
              {!isLoading && filtered.length === 0 && (
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

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        onConfirm={handleDeletePessoa}
        title="Excluir Pessoa"
        description="Tem certeza que deseja remover esta pessoa? Isso tambem pode afetar ingressos e vendas associadas."
      />
    </div>
  )
}
