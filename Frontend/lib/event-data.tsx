"use client"

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react"
import { toast } from "sonner"
import { useAuth } from "./auth-context"
import { EventColorInjector } from "@/components/event-color-injector"

// --- Types ---

export type TicketType = "pista" | "camarote" | "vip" | "free"
export type WristbandColor = "maior" | "menor" | "camarote" | "staff"
export type PaymentMethod = "dinheiro" | "pix" | "cartao_credito" | "cartao_debito"

export interface Person {
  id: string
  nome: string
  instagram: string
  cpfRg: string
  dataNascimento: string
  tipoIngresso: TicketType
  observacao: string
  createdAt: string
}

export interface Ticket {
  id: string
  numero: string
  lote: string
  valorPago: number
  vendedor: string
  formaPagamento: PaymentMethod
  pessoaId: string
  entrou: boolean
  horaEntrada: string | null
  pulseira: WristbandColor | null
}

export interface Product {
  id: string
  nome: string
  custo: number
  precoVenda: number
  estoqueInicial: number
  estoqueAtual: number
}

export interface BarSale {
  id: string
  productId: string
  pessoaId: string
  vendedor: string
  quantidade: number
  valorTotal: number
  hora: string
}

export type CargoColaborador = "barman" | "garcom" | "porteiro" | "promoter" | "seguranca" | "caixa" | "outro"

export interface Colaborador {
  id: string
  nome: string
  cargo: CargoColaborador
  telefone: string
  ativo: boolean
}

export interface CamaroteTable {
  id: string
  nome: string
  garcom: string
  cor_pulseira?: string
  garrafas: string[]
  pessoaIds: string[]
}

export interface ListaItem {
  id: string
  nome: string
  descricao: string
}

export interface Evento {
  id: string
  nome: string
  cor_primaria: string
  cor_secundaria: string
  logo: string | null
  stats?: {
    faturamento_total: number
    faturamento_ingressos: number
    faturamento_bar: number
    colaboradores_count: number
    ingressos_count: number
    mesas_count: number
    garrafas_count: number
  }
}

export interface EventData {
  pessoas: Person[]
  tickets: Ticket[]
  products: Product[]
  barSales: BarSale[]
  camaroteTables: CamaroteTable[]
  colaboradores: Colaborador[]
  lotacaoMaxima: number
  eventos: Evento[]
  listas: ListaItem[]
}

interface EventContextType extends EventData {
  loading: boolean
  selectedEventId: string | null
  setSelectedEventId: (id: string | null) => void
  currentEvento: Evento | null

  fetchData: (quiet?: boolean, modules?: (keyof EventData)[]) => Promise<void>
  refreshEventos: () => Promise<void>
  fetchGlobalSummary: () => Promise<void>
  addEvento: (e: Omit<Evento, "id">) => Promise<Evento>
  updateEvento: (id: string, e: Partial<Evento>) => Promise<void>
  removeEvento: (id: string) => Promise<void>
  isInitialLoad: boolean
  isGlobalLoading: boolean
  fetchedModules: Set<keyof EventData>
  mounted: boolean

  addPessoa: (p: Omit<Person, "id" | "createdAt">) => Promise<string | undefined>
  updatePessoa: (id: string, p: Partial<Person>) => Promise<void>
  removePessoa: (id: string) => Promise<void>
  addTicket: (t: Omit<Ticket, "id" | "entrou" | "horaEntrada" | "pulseira">) => Promise<void>
  marcarEntrada: (ticketId: string, pulseira: WristbandColor) => Promise<void>
  addProduct: (p: Omit<Product, "id" | "estoqueAtual">) => Promise<void>
  addProducts: (ps: Omit<Product, "id" | "estoqueAtual">[]) => Promise<void>
  updateProduct: (id: string, p: Partial<Product>) => Promise<void>
  removeProduct: (id: string) => Promise<void>
  addBarSale: (s: Omit<BarSale, "id" | "hora" | "valorTotal">) => Promise<void>
  addBarSales: (vendedor: string, items: { productId: string; quantidade: number }[], pessoaId?: string) => Promise<void>
  updateBarSale: (id: string, s: Partial<BarSale>) => Promise<void>
  removeBarSale: (id: string) => Promise<void>

  addColaborador: (c: Omit<Colaborador, "id">) => Promise<void>
  updateColaborador: (id: string, c: Partial<Colaborador>) => Promise<void>
  removeColaborador: (id: string) => Promise<void>
  addCamaroteTable: (t: Omit<CamaroteTable, "id" | "pessoaIds" | "garrafas">) => Promise<void>
  updateCamaroteTable: (id: string, t: Partial<CamaroteTable>) => Promise<void>
  addGarrafaToCamarote: (tableId: string, garrafa: string) => Promise<void>
  addPessoaToCamarote: (tableId: string, pessoaId: string) => Promise<void>
  removePessoaFromCamarote: (tableId: string, pessoaId: string) => Promise<void>
  removeGarrafaFromCamarote: (tableId: string, index: number) => Promise<void>
  addListaItem: (item: Omit<ListaItem, "id">) => Promise<void>
  updateListaItem: (id: string, item: Partial<ListaItem>) => Promise<void>
  removeListaItem: (id: string) => Promise<void>
  setLotacaoMaxima: (n: number) => void
  pessoasDentro: number
  overlay: "none" | "festas" | "eventpro"
  setOverlay: (v: "none" | "festas" | "eventpro") => void
}

const EventContext = createContext<EventContextType | null>(null)

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"

export function useEventData() {
  const ctx = useContext(EventContext)
  if (!ctx) throw new Error("useEventData must be used within EventDataProvider")
  return ctx
}

export function EventDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<EventData>({
    pessoas: [],
    tickets: [],
    products: [],
    barSales: [],
    camaroteTables: [],
    colaboradores: [],
    lotacaoMaxima: 500,
    eventos: [],
    listas: []
  })

  // Use a ref to always have access to current data without stale closures
  const dataRef = useRef(data)
  useEffect(() => {
    dataRef.current = data
  }, [data])

  const [loading, setLoading] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [fetchedModules, setFetchedModules] = useState<Set<keyof EventData>>(new Set())
  const [mounted, setMounted] = useState(false)

  const fetchedModulesRef = useRef(fetchedModules)
  useEffect(() => {
    fetchedModulesRef.current = fetchedModules
  }, [fetchedModules])

  const [selectedEventId, setSelectedEventIdState] = useState<string | null>(null)
  const selectedEventIdRef = useRef(selectedEventId)
  useEffect(() => {
    selectedEventIdRef.current = selectedEventId
  }, [selectedEventId])

  const { token, isAuthenticated } = useAuth()
  const tokenRef = useRef(token)
  useEffect(() => {
    tokenRef.current = token
  }, [token])

  const setSelectedEventId = useCallback((id: string | null) => {
    if (String(id) === String(selectedEventIdRef.current)) return
    setSelectedEventIdState(id)
    setIsInitialLoad(true)
    setFetchedModules(new Set())

    // Limpa os dados do evento anterior para nao misturar
    setData(prev => ({
      ...prev,
      pessoas: [],
      tickets: [],
      products: [],
      barSales: [],
      camaroteTables: [],
      colaboradores: [],
      listas: [],
    }))

    if (id) {
      localStorage.setItem("selected_evento_id", id)
    } else {
      localStorage.removeItem("selected_evento_id")
    }
  }, [])

  const [overlay, setOverlay] = useState<"none" | "festas" | "eventpro">("none")

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem("selected_evento_id")
    if (saved) setSelectedEventIdState(saved)
  }, [])

  const currentEvento = data.eventos.find(e => String(e.id) === String(selectedEventId)) || null

  const [isGlobalLoading, setIsGlobalLoading] = useState(false)

  const refreshEventos = useCallback(async () => {
    const currentToken = tokenRef.current
    if (!currentToken) return
    // Only set loading if it's the very first load of the list
    const isFirstListLoad = dataRef.current.eventos.length === 0
    if (isFirstListLoad) setLoading(true)

    try {
      const res = await fetch(`${API_URL}/eventos`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
          Accept: "application/json",
        },
      })
      if (!res.ok) throw new Error("Erro ao carregar eventos")
      const eventos = await res.json()
      const mapped = eventos.map((e: any) => ({
        id: String(e.id),
        nome: e.nome,
        cor_primaria: e.cor_primaria,
        cor_secundaria: e.cor_secundaria,
        logo: e.logo,
        // Lightweight list doesn't have stats yet, preserve if they exist
        stats: dataRef.current.eventos.find(ex => String(ex.id) === String(e.id))?.stats
      }))
      setData(prev => ({ ...prev, eventos: mapped }))

      if (eventos.length > 0) {
        const currentId = selectedEventIdRef.current
        const isValid = eventos.some((e: any) => String(e.id) === String(currentId))
        if (!currentId || !isValid) {
          setSelectedEventId(String(eventos[0].id))
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      if (isFirstListLoad) setLoading(false)
    }
  }, [setSelectedEventId])

  const fetchGlobalSummary = useCallback(async () => {
    const currentToken = tokenRef.current
    if (!currentToken) return
    setIsGlobalLoading(true)

    try {
      const res = await fetch(`${API_URL}/eventos/summary`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
          Accept: "application/json",
        },
      })
      if (!res.ok) throw new Error("Erro ao carregar resumo global")
      const summary = await res.json()
      const mapped = summary.map((e: any) => ({
        id: String(e.id),
        nome: e.nome,
        cor_primaria: e.cor_primaria,
        cor_secundaria: e.cor_secundaria,
        logo: e.logo,
        stats: {
          faturamento_total: Number(e.stats?.faturamento_total || 0),
          faturamento_ingressos: Number(e.stats?.faturamento_ingressos || 0),
          faturamento_bar: Number(e.stats?.faturamento_bar || 0),
          colaboradores_count: Number(e.stats?.colaboradores_count || 0),
          ingressos_count: Number(e.stats?.ingressos_count || 0),
          mesas_count: Number(e.stats?.mesas_count || 0),
          garrafas_count: Number(e.stats?.garrafas_count || 0),
        }
      }))
      setData(prev => ({ ...prev, eventos: mapped }))
    } catch (err) {
      console.error(err)
    } finally {
      setIsGlobalLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      refreshEventos()
    }
  }, [isAuthenticated, refreshEventos])

  const fetchData = useCallback(async (isSilent = false, modules?: (keyof EventData)[]) => {
    if (!isAuthenticated || !tokenRef.current || !selectedEventIdRef.current) {
      if (!selectedEventIdRef.current) setLoading(false)
      return
    }
    const currentToken = tokenRef.current
    const currentEventId = selectedEventIdRef.current

    if (!isSilent) setLoading(true)

    try {
      const allModulesConfig = [
        { key: "pessoas" as keyof EventData, url: `${API_URL}/pessoas` },
        { key: "tickets" as keyof EventData, url: `${API_URL}/ingressos` },
        { key: "products" as keyof EventData, url: `${API_URL}/produtos` },
        { key: "barSales" as keyof EventData, url: `${API_URL}/vendas-bar` },
        { key: "colaboradores" as keyof EventData, url: `${API_URL}/colaboradores` },
        { key: "camaroteTables" as keyof EventData, url: `${API_URL}/mesas-camarote` },
        { key: "listas" as keyof EventData, url: `${API_URL}/listas` },
      ]

      const modulesToFetch = modules
        ? allModulesConfig.filter(m => modules.includes(m.key))
        : allModulesConfig

      const headers = {
        Authorization: `Bearer ${currentToken}`,
        Accept: "application/json",
        "X-Evento-Id": String(currentEventId)
      }

      // Fetch each module and update independently
      await Promise.all(
        modulesToFetch.map(async (m) => {
          try {
            const res = await fetch(m.url, { headers })
            if (selectedEventIdRef.current !== currentEventId) return

            const json = res.ok ? await res.json() : []
            let transformed: any = json

            const key = m.key
            if (key === "pessoas") {
              transformed = json.map((p: any) => ({
                id: String(p.id), nome: p.nome, instagram: p.instagram || "",
                cpfRg: p.cpf_rg || "", dataNascimento: p.data_nascimento || "",
                tipoIngresso: p.tipo_ingresso, observacao: p.observacao || "", createdAt: p.created_at
              }))
            } else if (key === "tickets") {
              transformed = json.map((i: any) => ({
                id: String(i.id), numero: i.numero, lote: i.lote || "", valorPago: Number(i.valor_pago),
                vendedor: i.vendedor || "", formaPagamento: i.forma_pagamento, pessoaId: String(i.pessoa_id),
                entrou: Boolean(i.entrou), horaEntrada: i.hora_entrada, pulseira: i.pulseira
              }))
            } else if (key === "products") {
              transformed = json.map((p: any) => ({
                id: String(p.id), nome: p.nome, custo: Number(p.custo), precoVenda: Number(p.preco_venda),
                estoqueInicial: p.estoque_inicial, estoqueAtual: p.estoque_atual
              }))
            } else if (key === "barSales") {
              transformed = json.map((v: any) => ({
                id: String(v.id), productId: String(v.produto_id), pessoaId: String(v.pessoa_id),
                vendedor: v.vendedor || "", quantidade: v.quantidade, valorTotal: Number(v.valor_total), hora: v.hora
              }))
            } else if (key === "colaboradores") {
              transformed = json.map((c: any) => ({
                id: String(c.id), nome: c.nome, cargo: c.cargo, telefone: c.telefone || "", ativo: Boolean(c.ativo)
              }))
            } else if (key === "camaroteTables") {
              transformed = json.map((mt: any) => ({
                id: String(mt.id), nome: mt.nome, garcom: mt.garcom || "", cor_pulseira: mt.cor_pulseira || "",
                garrafas: mt.garrafas || [], pessoaIds: mt.pessoas?.map((p: any) => String(p.id)) || []
              }))
            } else if (key === "listas") {
              transformed = json.map((l: any) => ({ id: String(l.id), nome: l.nome, descricao: l.descricao || "" }))
            }

            // Update specific module data
            setData(prev => {
              if (selectedEventIdRef.current !== currentEventId) return prev
              const currentItems = (prev[key] as any[]) || []
              const tempItems = currentItems.filter(it => String(it.id).startsWith("temp-"))
              return {
                ...prev,
                [key]: [...tempItems, ...transformed]
              }
            })

            // Mark as fetched
            setFetchedModules(prev => {
              const next = new Set(prev)
              next.add(key)
              return next
            })

          } catch (e) {
            console.error(`Error fetching module ${m.key}:`, e)
            // Even on error, mark as fetched to avoid infinite skeletons
            setFetchedModules(prev => {
              const next = new Set(prev)
              next.add(m.key)
              return next
            })
          }
        })
      )

      if (!modules || modules.length === allModulesConfig.length) {
        setIsInitialLoad(false)
      }
    } catch (error) {
      console.error("Error in fetchData overall:", error)
    } finally {
      if (selectedEventIdRef.current === currentEventId) setLoading(false)
    }
  }, []) // No dependencies on data or selectedEventId — use refs instead

  useEffect(() => {
    if (isAuthenticated) {
      refreshEventos()
    }
  }, [isAuthenticated, refreshEventos])

  useEffect(() => {
    if (overlay !== "none" && isAuthenticated) {
      fetchGlobalSummary()
    }
  }, [overlay, isAuthenticated, fetchGlobalSummary])


  const addEvento = useCallback(async (e: Omit<Evento, "id">) => {
    const tempId = `temp-${Date.now()}`
    const optimisticEvento: Evento = { ...e, id: tempId, stats: { faturamento_total: 0, faturamento_ingressos: 0, faturamento_bar: 0, colaboradores_count: 0, ingressos_count: 0, mesas_count: 0, garrafas_count: 0 } }

    setData(prev => ({ ...prev, eventos: [...prev.eventos, optimisticEvento] }))
    toast.success("Evento criado com sucesso!")

    try {
      const res = await fetch(`${API_URL}/eventos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${tokenRef.current}`
        },
        body: JSON.stringify(e)
      })
      if (!res.ok) throw new Error("Erro ao criar evento")
      const newEvento = await res.json()
      const mapped = {
        id: String(newEvento.id),
        nome: newEvento.nome,
        cor_primaria: newEvento.cor_primaria,
        cor_secundaria: newEvento.cor_secundaria,
        logo: newEvento.logo,
        stats: newEvento.stats || { faturamento_total: 0, faturamento_ingressos: 0, faturamento_bar: 0, colaboradores_count: 0, ingressos_count: 0 }
      }
      setData(prev => ({
        ...prev,
        eventos: prev.eventos.map(ev => ev.id === tempId ? mapped : ev)
      }))
      setSelectedEventId(String(newEvento.id))
      return mapped
    } catch (error) {
      console.error(error)
      setData(prev => ({ ...prev, eventos: prev.eventos.filter(ev => ev.id !== tempId) }))
      toast.error("Erro ao realizar tarefa no banco")
      throw error
    }
  }, [setSelectedEventId])

  const updateEvento = useCallback(async (id: string, e: Partial<Evento>) => {
    const previousEventos = dataRef.current.eventos
    setData(prev => ({
      ...prev,
      eventos: prev.eventos.map(x => String(x.id) === id ? { ...x, ...e } : x)
    }))
    toast.success("Evento atualizado!")

    try {
      const res = await fetch(`${API_URL}/eventos/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${tokenRef.current}`
        },
        body: JSON.stringify(e)
      })
      if (!res.ok) throw new Error("Erro ao atualizar evento")
    } catch (error) {
      console.error(error)
      setData(prev => ({ ...prev, eventos: previousEventos }))
      toast.error("Erro ao realizar tarefa no banco")
      throw error
    }
  }, [])

  const removeEvento = useCallback(async (id: string) => {
    const previousEventos = dataRef.current.eventos
    const currentSelectedId = selectedEventIdRef.current

    setData(prev => ({
      ...prev,
      eventos: prev.eventos.filter(x => String(x.id) !== id)
    }))
    toast.success("Evento removido com sucesso")

    try {
      const res = await fetch(`${API_URL}/eventos/${id}`, {
        method: "DELETE",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${tokenRef.current}`
        }
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as any).message || "Erro ao remover evento")
      }

      if (String(currentSelectedId) === String(id)) {
        localStorage.removeItem("selected_evento_id")
        const remaining = previousEventos.filter(x => String(x.id) !== id)
        if (remaining.length > 0) {
          const nextId = String(remaining[0].id)
          setSelectedEventId(nextId)
        } else {
          setSelectedEventId(null)
        }
      }
    } catch (error: any) {
      console.error(error)
      setData(prev => ({ ...prev, eventos: previousEventos }))
      toast.error(error.message || "Falha ao remover evento no banco")
    }
  }, [setSelectedEventId])

  const addPessoa = useCallback(async (p: Omit<Person, "id" | "createdAt">) => {
    const tempId = `temp-${Date.now()}`
    const optimisticPerson: Person = { ...p, id: tempId, createdAt: new Date().toISOString() }

    setData(prev => ({ ...prev, pessoas: [optimisticPerson, ...prev.pessoas] }))
    toast.success("Pessoa cadastrada!")

    try {
      const res = await fetch(`${API_URL}/pessoas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${tokenRef.current}`,
          "X-Evento-Id": String(selectedEventIdRef.current)
        },
        body: JSON.stringify({
          nome: p.nome,
          instagram: p.instagram,
          cpf_rg: p.cpfRg.replace(/\D/g, ""),
          data_nascimento: p.dataNascimento,
          tipo_ingresso: p.tipoIngresso,
          observacao: p.observacao
        })
      })
      if (!res.ok) throw new Error("Erro banco")
      const newItem = await res.json()

      setData(prev => ({
        ...prev,
        pessoas: prev.pessoas.map(per => per.id === tempId ? { ...per, id: String(newItem.id) } : per)
      }))
      return String(newItem.id)
    } catch (err) {
      console.error(err)
      setData(prev => ({ ...prev, pessoas: prev.pessoas.filter(per => per.id !== tempId) }))
      toast.error("Erro ao realizar tarefa no banco")
      return ""
    }
  }, [])

  const updatePessoa = useCallback(async (id: string, p: Partial<Person>) => {
    const previous = dataRef.current.pessoas
    setData(prev => ({
      ...prev,
      pessoas: prev.pessoas.map(x => x.id === id ? { ...x, ...p } : x)
    }))
    toast.success("Pessoa atualizada!")

    const body: any = {}
    if (p.nome !== undefined) body.nome = p.nome
    if (p.instagram !== undefined) body.instagram = p.instagram
    if (p.cpfRg !== undefined) body.cpf_rg = p.cpfRg.replace(/\D/g, "")
    if (p.dataNascimento !== undefined) body.data_nascimento = p.dataNascimento
    if (p.tipoIngresso !== undefined) body.tipo_ingresso = p.tipoIngresso
    if (p.observacao !== undefined) body.observacao = p.observacao

    try {
      const res = await fetch(`${API_URL}/pessoas/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${tokenRef.current}`,
          "X-Evento-Id": String(selectedEventIdRef.current)
        },
        body: JSON.stringify(body)
      })
      if (!res.ok) throw new Error("Erro banco")
    } catch (err) {
      console.error(err)
      setData(prev => ({ ...prev, pessoas: previous }))
      toast.error("Erro ao realizar tarefa no banco")
    }
  }, [])

  const removePessoa = useCallback(async (id: string) => {
    const previous = dataRef.current.pessoas
    setData(prev => ({ ...prev, pessoas: prev.pessoas.filter(x => x.id !== id) }))
    toast.success("Pessoa removida")

    try {
      const res = await fetch(`${API_URL}/pessoas/${id}`, {
        method: "DELETE",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${tokenRef.current}`,
          "X-Evento-Id": String(selectedEventIdRef.current)
        }
      })
      if (!res.ok) throw new Error("Erro banco")
    } catch (err) {
      console.error(err)
      setData(prev => ({ ...prev, pessoas: previous }))
      toast.error("Erro ao realizar tarefa no banco")
    }
  }, [])

  const addTicket = useCallback(async (t: Omit<Ticket, "id" | "entrou" | "horaEntrada" | "pulseira">) => {
    const tempId = `temp-${Date.now()}`
    const optimisticTicket: Ticket = {
      ...t,
      id: tempId,
      entrou: false,
      horaEntrada: null,
      pulseira: null
    }

    setData(prev => ({ ...prev, tickets: [optimisticTicket, ...prev.tickets] }))
    toast.success("Ingresso criado!")

    try {
      const res = await fetch(`${API_URL}/ingressos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${tokenRef.current}`,
          "X-Evento-Id": String(selectedEventIdRef.current)
        },
        body: JSON.stringify({
          numero: t.numero,
          lote: t.lote,
          valor_pago: t.valorPago,
          vendedor: t.vendedor,
          forma_pagamento: t.formaPagamento,
          pessoa_id: t.pessoaId
        })
      })
      if (!res.ok) throw new Error("Erro banco")
      const newItem = await res.json()
      setData(prev => ({
        ...prev,
        tickets: prev.tickets.map(tic => tic.id === tempId ? { ...tic, id: String(newItem.id) } : tic)
      }))
      refreshEventos()
    } catch (err) {
      console.error(err)
      setData(prev => ({ ...prev, tickets: prev.tickets.filter(t => t.id !== tempId) }))
      toast.error("Erro ao realizar tarefa no banco")
    }
  }, [])

  const marcarEntrada = useCallback(async (ticketId: string, pulseira: WristbandColor) => {
    const previous = dataRef.current.tickets
    const now = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })

    setData(prev => ({
      ...prev,
      tickets: prev.tickets.map(t => t.id === ticketId ? { ...t, entrou: true, horaEntrada: now, pulseira } : t)
    }))
    toast.success("Check-in realizado!")

    try {
      const res = await fetch(`${API_URL}/ingressos/${ticketId}/check-in`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${tokenRef.current}`,
          "X-Evento-Id": String(selectedEventIdRef.current)
        },
        body: JSON.stringify({ pulseira })
      })
      if (!res.ok) throw new Error("Erro banco")
      refreshEventos()
    } catch (err) {
      console.error(err)
      setData(prev => ({ ...prev, tickets: previous }))
      toast.error("Erro ao realizar tarefa no banco")
    }
  }, [])

  const addProduct = useCallback(async (p: Omit<Product, "id" | "estoqueAtual">) => {
    const tempId = `temp-${Date.now()}`
    const optimisticProduct: Product = { ...p, id: tempId, estoqueAtual: p.estoqueInicial }

    setData(prev => ({ ...prev, products: [...prev.products, optimisticProduct] }))
    toast.success("Produto adicionado!")

    try {
      const res = await fetch(`${API_URL}/produtos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${tokenRef.current}`,
          "X-Evento-Id": String(selectedEventIdRef.current)
        },
        body: JSON.stringify({
          nome: p.nome,
          custo: p.custo,
          preco_venda: p.precoVenda,
          estoque_inicial: p.estoqueInicial
        })
      })
      if (!res.ok) throw new Error("Erro banco")
      const realProduct = await res.json()
      setData(prev => ({
        ...prev,
        products: prev.products.map(prod => prod.id === tempId ? { ...prod, id: String(realProduct.id) } : prod)
      }))
    } catch (err) {
      console.error(err)
      setData(prev => ({ ...prev, products: prev.products.filter(prod => prod.id !== tempId) }))
      toast.error("Erro ao realizar tarefa no banco")
    }
  }, [])

  const addProducts = useCallback(async (ps: Omit<Product, "id" | "estoqueAtual">[]) => {
    const tempProducts: Product[] = ps.map((p, idx) => ({
      ...p,
      id: `temp-bulk-${Date.now()}-${idx}`,
      estoqueAtual: p.estoqueInicial
    }))
    const tempIds = tempProducts.map(p => p.id)

    setData(prev => ({ ...prev, products: [...prev.products, ...tempProducts] }))
    toast.success("Produtos adicionados!")

    try {
      const res = await fetch(`${API_URL}/produtos/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${tokenRef.current}`,
          "X-Evento-Id": String(selectedEventIdRef.current)
        },
        body: JSON.stringify({
          products: ps.map(p => ({
            nome: p.nome,
            custo: p.custo,
            preco_venda: p.precoVenda,
            estoque_inicial: p.estoqueInicial
          }))
        })
      })
      if (!res.ok) throw new Error("Erro banco")
      // Remove temp items and re-fetch real ones
      setData(prev => ({ ...prev, products: prev.products.filter(p => !tempIds.includes(p.id)) }))
      fetchData(true, ["products"])
    } catch (err) {
      console.error(err)
      setData(prev => ({ ...prev, products: prev.products.filter(p => !tempIds.includes(p.id)) }))
      toast.error("Erro ao realizar tarefa no banco")
    }
  }, [fetchData])

  const updateProduct = useCallback(async (id: string, p: Partial<Product>) => {
    const previous = dataRef.current.products
    setData(prev => ({
      ...prev,
      products: prev.products.map(x => x.id === id ? { ...x, ...p } : x)
    }))
    toast.success("Produto atualizado!")

    const body: any = {}
    if (p.nome !== undefined) body.nome = p.nome
    if (p.custo !== undefined) body.custo = p.custo
    if (p.precoVenda !== undefined) body.preco_venda = p.precoVenda
    if (p.estoqueInicial !== undefined) body.estoque_inicial = p.estoqueInicial
    if (p.estoqueAtual !== undefined) body.estoque_atual = p.estoqueAtual

    try {
      const res = await fetch(`${API_URL}/produtos/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${tokenRef.current}`,
          "X-Evento-Id": String(selectedEventIdRef.current)
        },
        body: JSON.stringify(body)
      })
      if (!res.ok) throw new Error("Erro banco")
    } catch (err) {
      console.error(err)
      setData(prev => ({ ...prev, products: previous }))
      toast.error("Erro ao realizar tarefa no banco")
    }
  }, [])

  const removeProduct = useCallback(async (id: string) => {
    const previous = dataRef.current.products
    setData(prev => ({ ...prev, products: prev.products.filter(x => x.id !== id) }))
    toast.success("Produto removido")

    try {
      const res = await fetch(`${API_URL}/produtos/${id}`, {
        method: "DELETE",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${tokenRef.current}`,
          "X-Evento-Id": String(selectedEventIdRef.current)
        }
      })
      if (!res.ok) throw new Error("Erro banco")
    } catch (err) {
      console.error(err)
      setData(prev => ({ ...prev, products: previous }))
      toast.error("Erro ao realizar tarefa no banco")
    }
  }, [])

  const addBarSale = useCallback(async (s: Omit<BarSale, "id" | "hora" | "valorTotal">) => {
    const prod = dataRef.current.products.find(p => p.id === s.productId)
    const valorTotal = (prod?.precoVenda || 0) * s.quantidade
    const now = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })

    const tempId = `temp-${Date.now()}`
    const optimisticSale: BarSale = { ...s, id: tempId, hora: now, valorTotal }

    setData(prev => ({
      ...prev,
      barSales: [optimisticSale, ...prev.barSales],
      products: prev.products.map(p => p.id === s.productId ? { ...p, estoqueAtual: p.estoqueAtual - s.quantidade } : p)
    }))
    toast.success("Venda registrada!")

    try {
      const res = await fetch(`${API_URL}/vendas-bar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${tokenRef.current}`,
          "X-Evento-Id": String(selectedEventIdRef.current)
        },
        body: JSON.stringify({
          produto_id: s.productId,
          pessoa_id: s.pessoaId,
          vendedor: s.vendedor,
          quantidade: s.quantidade
        })
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || "Erro banco")
      }
      const realSale = await res.json()
      setData(prev => ({
        ...prev,
        barSales: prev.barSales.map(sale => sale.id === tempId ? { ...sale, id: String(realSale.id) } : sale)
      }))
    } catch (err) {
      console.error(err)
      const previousBarSales = dataRef.current.barSales.filter(s => s.id !== tempId)
      setData(prev => ({
        ...prev,
        barSales: prev.barSales.filter(s => s.id !== tempId),
        products: prev.products.map(p => p.id === s.productId ? { ...p, estoqueAtual: p.estoqueAtual + s.quantidade } : p)
      }))
      toast.error(err instanceof Error ? err.message : "Erro ao realizar tarefa no banco")
    }
  }, [])

  const addBarSales = useCallback(async (vendedor: string, items: { productId: string; quantidade: number }[], pessoaId?: string) => {
    const now = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    const currentProducts = dataRef.current.products
    const tempSales: BarSale[] = items.map((item, idx) => {
      const prod = currentProducts.find(p => p.id === item.productId)
      return {
        id: `temp-bulk-${Date.now()}-${idx}`,
        productId: item.productId,
        pessoaId: (pessoaId === "none" ? "" : pessoaId) || "",
        vendedor,
        quantidade: item.quantidade,
        valorTotal: (prod?.precoVenda || 0) * item.quantidade,
        hora: now
      }
    })
    const tempIds = tempSales.map(s => s.id)

    setData(prev => {
      const nextProducts = [...prev.products]
      for (const item of items) {
        const idx = nextProducts.findIndex(p => p.id === item.productId)
        if (idx !== -1) {
          nextProducts[idx] = { ...nextProducts[idx], estoqueAtual: nextProducts[idx].estoqueAtual - item.quantidade }
        }
      }
      return {
        ...prev,
        barSales: [...tempSales, ...prev.barSales],
        products: nextProducts
      }
    })
    toast.success("Vendas registradas!")

    try {
      const res = await fetch(`${API_URL}/vendas-bar/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${tokenRef.current}`,
          "X-Evento-Id": String(selectedEventIdRef.current)
        },
        body: JSON.stringify({
          vendedor,
          pessoa_id: pessoaId === "none" ? null : pessoaId,
          items: items.map(i => ({
            produto_id: i.productId,
            quantidade: i.quantidade
          }))
        })
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || "Erro banco")
      }
      const createdItems = await res.json()
      const transformedReal = createdItems.map((v: any) => ({
        id: String(v.id),
        productId: String(v.produto_id),
        pessoaId: String(v.pessoa_id),
        vendedor: v.vendedor || "",
        quantidade: v.quantidade,
        valorTotal: Number(v.valor_total),
        hora: v.hora
      }))

      setData(prev => ({
        ...prev,
        barSales: [...transformedReal, ...prev.barSales.filter(s => !tempIds.includes(s.id))]
      }))
      fetchData(true, ["products"])
      refreshEventos()
    } catch (err) {
      console.error(err)
      setData(prev => ({
        ...prev,
        barSales: prev.barSales.filter(s => !tempIds.includes(s.id)),
        products: currentProducts
      }))
      toast.error(err instanceof Error ? err.message : "Erro ao realizar tarefa no banco")
    }
  }, [fetchData])

  const updateBarSale = useCallback(async (id: string, s: Partial<BarSale>) => {
    const previous = dataRef.current.barSales
    setData(prev => ({
      ...prev,
      barSales: prev.barSales.map(x => x.id === id ? { ...x, ...s } : x)
    }))
    toast.success("Venda atualizada!")

    try {
      const res = await fetch(`${API_URL}/vendas-bar/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${tokenRef.current}`,
          "X-Evento-Id": String(selectedEventIdRef.current)
        },
        body: JSON.stringify({
          vendedor: s.vendedor,
          quantidade: s.quantidade,
          pessoa_id: s.pessoaId === "none" ? null : s.pessoaId,
        })
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || "Erro banco")
      }
      fetchData(true, ["barSales", "products"])
      refreshEventos()
    } catch (err) {
      console.error(err)
      setData(prev => ({ ...prev, barSales: previous }))
      toast.error(err instanceof Error ? err.message : "Erro ao realizar tarefa no banco")
    }
  }, [fetchData])

  const removeBarSale = useCallback(async (id: string) => {
    const saleToRemove = dataRef.current.barSales.find(s => s.id === id)
    setData(prev => ({
      ...prev,
      barSales: prev.barSales.filter(x => x.id !== id),
      products: saleToRemove ? prev.products.map(p => p.id === saleToRemove.productId ? { ...p, estoqueAtual: p.estoqueAtual + saleToRemove.quantidade } : p) : prev.products
    }))
    toast.success("Venda removida")

    const previousBarSales = dataRef.current.barSales
    const previousProducts = dataRef.current.products

    try {
      const res = await fetch(`${API_URL}/vendas-bar/${id}`, {
        method: "DELETE",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${tokenRef.current}`,
          "X-Evento-Id": String(selectedEventIdRef.current)
        }
      })
      if (!res.ok) throw new Error("Erro banco")
      refreshEventos()
    } catch (err) {
      console.error(err)
      setData(prev => ({ ...prev, barSales: previousBarSales, products: previousProducts }))
      toast.error("Erro ao realizar tarefa no banco")
    }
  }, [])

  const addColaborador = useCallback(async (c: Omit<Colaborador, "id">) => {
    const tempId = `temp-${Date.now()}`
    const optimisticColaborador: Colaborador = { ...c, id: tempId }

    setData(prev => ({ ...prev, colaboradores: [...prev.colaboradores, optimisticColaborador] }))
    toast.success("Colaborador adicionado!")

    try {
      const res = await fetch(`${API_URL}/colaboradores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${tokenRef.current}`,
          "X-Evento-Id": String(selectedEventIdRef.current)
        },
        body: JSON.stringify(c)
      })
      if (!res.ok) throw new Error("Erro banco")
      const newItem = await res.json()
      setData(prev => ({
        ...prev,
        colaboradores: prev.colaboradores.map(item => item.id === tempId ? { ...item, id: String(newItem.id) } : item)
      }))
      refreshEventos()
    } catch (err) {
      console.error(err)
      setData(prev => ({ ...prev, colaboradores: prev.colaboradores.filter(item => item.id !== tempId) }))
      toast.error("Erro ao realizar tarefa no banco")
    }
  }, [])

  const updateColaborador = useCallback(async (id: string, c: Partial<Colaborador>) => {
    const previous = dataRef.current.colaboradores
    setData(prev => ({
      ...prev,
      colaboradores: prev.colaboradores.map(x => x.id === id ? { ...x, ...c } : x)
    }))
    toast.success("Colaborador atualizado!")

    try {
      const res = await fetch(`${API_URL}/colaboradores/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${tokenRef.current}`,
          "X-Evento-Id": String(selectedEventIdRef.current)
        },
        body: JSON.stringify(c)
      })
      if (!res.ok) throw new Error("Erro banco")
    } catch (err) {
      console.error(err)
      setData(prev => ({ ...prev, colaboradores: previous }))
      toast.error("Erro ao realizar tarefa no banco")
    }
  }, [])

  const removeColaborador = useCallback(async (id: string) => {
    const previous = dataRef.current.colaboradores
    setData(prev => ({ ...prev, colaboradores: prev.colaboradores.filter(x => x.id !== id) }))
    toast.success("Colaborador removido")

    try {
      const res = await fetch(`${API_URL}/colaboradores/${id}`, {
        method: "DELETE",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${tokenRef.current}`,
          "X-Evento-Id": String(selectedEventIdRef.current)
        }
      })
      if (!res.ok) throw new Error("Erro banco")
    } catch (err) {
      console.error(err)
      setData(prev => ({ ...prev, colaboradores: previous }))
      toast.error("Erro ao realizar tarefa no banco")
    }
  }, [])

  const addCamaroteTable = useCallback(async (t: Omit<CamaroteTable, "id" | "pessoaIds" | "garrafas">) => {
    const tempId = `temp-${Date.now()}`
    const optimisticTable: CamaroteTable = { ...t, id: tempId, pessoaIds: [], garrafas: [] }

    setData(prev => ({ ...prev, camaroteTables: [...prev.camaroteTables, optimisticTable] }))
    toast.success("Mesa adicionada!")

    try {
      const res = await fetch(`${API_URL}/mesas-camarote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${tokenRef.current}`,
          "X-Evento-Id": String(selectedEventIdRef.current)
        },
        body: JSON.stringify(t)
      })
      if (!res.ok) throw new Error("Erro banco")
      const newItem = await res.json()
      setData(prev => ({
        ...prev,
        camaroteTables: prev.camaroteTables.map(item => item.id === tempId ? { ...item, id: String(newItem.id) } : item)
      }))
    } catch (err) {
      console.error(err)
      setData(prev => ({ ...prev, camaroteTables: prev.camaroteTables.filter(item => item.id !== tempId) }))
      toast.error("Erro ao realizar tarefa no banco")
    }
  }, [])

  const updateCamaroteTable = useCallback(async (id: string, t: Partial<CamaroteTable>) => {
    const previous = dataRef.current.camaroteTables
    setData(prev => ({
      ...prev,
      camaroteTables: prev.camaroteTables.map(x => x.id === id ? { ...x, ...t } : x)
    }))
    toast.success("Mesa atualizada!")

    try {
      const res = await fetch(`${API_URL}/mesas-camarote/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${tokenRef.current}`,
          "X-Evento-Id": String(selectedEventIdRef.current)
        },
        body: JSON.stringify(t)
      })
      if (!res.ok) throw new Error("Erro banco")
    } catch (err) {
      console.error(err)
      setData(prev => ({ ...prev, camaroteTables: previous }))
      toast.error("Erro ao realizar tarefa no banco")
    }
  }, [])

  const addGarrafaToCamarote = useCallback(async (tableId: string, garrafa: string) => {
    setData(prev => ({
      ...prev,
      camaroteTables: prev.camaroteTables.map(t => t.id === tableId ? { ...t, garrafas: [...t.garrafas, garrafa] } : t)
    }))

    try {
      const res = await fetch(`${API_URL}/mesas-camarote/${tableId}/garrafas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${tokenRef.current}`,
          "X-Evento-Id": selectedEventIdRef.current as string
        },
        body: JSON.stringify({ garrafa })
      })
      if (!res.ok) throw new Error("Erro garrafa")
    } catch (err) {
      console.error(err)
      toast.error("Erro ao adicionar garrafa")
      fetchData(true, ["camaroteTables"])
    }
  }, [fetchData])

  const removeGarrafaFromCamarote = useCallback(async (tableId: string, index: number) => {
    setData(prev => ({
      ...prev,
      camaroteTables: prev.camaroteTables.map(t => t.id === tableId ? { ...t, garrafas: t.garrafas.filter((_, i) => i !== index) } : t)
    }))

    try {
      const res = await fetch(`${API_URL}/mesas-camarote/${tableId}/garrafas/${index}`, {
        method: "DELETE",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${tokenRef.current}`,
          "X-Evento-Id": selectedEventIdRef.current as string
        }
      })
      if (!res.ok) throw new Error("Erro remover garrafa")
    } catch (err) {
      console.error(err)
      toast.error("Erro ao remover garrafa")
      fetchData(true, ["camaroteTables"])
    }
  }, [fetchData])

  const addPessoaToCamarote = useCallback(async (tableId: string, pessoaId: string) => {
    setData(prev => ({
      ...prev,
      camaroteTables: prev.camaroteTables.map(t => t.id === tableId ? { ...t, pessoaIds: [...t.pessoaIds, pessoaId] } : t)
    }))

    try {
      const res = await fetch(`${API_URL}/mesas-camarote/${tableId}/pessoas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${tokenRef.current}`,
          "X-Evento-Id": selectedEventIdRef.current as string
        },
        body: JSON.stringify({ pessoa_id: pessoaId })
      })
      if (!res.ok) throw new Error("Erro pessoa mesa")
    } catch (err) {
      console.error(err)
      toast.error("Erro ao adicionar pessoa")
      fetchData(true, ["camaroteTables"])
    }
  }, [fetchData])

  const removePessoaFromCamarote = useCallback(async (tableId: string, pessoaId: string) => {
    setData(prev => ({
      ...prev,
      camaroteTables: prev.camaroteTables.map(t => t.id === tableId ? { ...t, pessoaIds: t.pessoaIds.filter(pid => pid !== pessoaId) } : t)
    }))

    try {
      const res = await fetch(`${API_URL}/mesas-camarote/${tableId}/pessoas/${pessoaId}`, {
        method: "DELETE",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${tokenRef.current}`,
          "X-Evento-Id": selectedEventIdRef.current as string
        }
      })
      if (!res.ok) throw new Error("Erro remover pessoa mesa")
    } catch (err) {
      console.error(err)
      toast.error("Erro ao remover pessoa")
      fetchData(true, ["camaroteTables"])
    }
  }, [fetchData])

  const addListaItem = useCallback(async (item: Omit<ListaItem, "id">) => {
    const tempId = `temp-${Date.now()}`
    const optimisticItem: ListaItem = { ...item, id: tempId }

    setData(prev => ({ ...prev, listas: [...prev.listas, optimisticItem] }))
    toast.success("Lista criada!")

    try {
      const res = await fetch(`${API_URL}/listas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${tokenRef.current}`,
          "X-Evento-Id": String(selectedEventIdRef.current)
        },
        body: JSON.stringify(item)
      })
      if (!res.ok) throw new Error("Erro banco")
      const newItem = await res.json()
      setData(prev => ({
        ...prev,
        listas: prev.listas.map(i => i.id === tempId ? { ...i, id: String(newItem.id) } : i)
      }))
    } catch (err) {
      console.error(err)
      setData(prev => ({ ...prev, listas: prev.listas.filter(i => i.id !== tempId) }))
      toast.error("Erro ao realizar tarefa no banco")
    }
  }, [])

  const updateListaItem = useCallback(async (id: string, item: Partial<ListaItem>) => {
    const previous = dataRef.current.listas
    setData(prev => ({
      ...prev,
      listas: prev.listas.map(x => x.id === id ? { ...x, ...item } : x)
    }))
    toast.success("Lista atualizada!")

    try {
      const res = await fetch(`${API_URL}/listas/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${tokenRef.current}`,
          "X-Evento-Id": String(selectedEventIdRef.current)
        },
        body: JSON.stringify(item)
      })
      if (!res.ok) throw new Error("Erro banco")
    } catch (err) {
      console.error(err)
      setData(prev => ({ ...prev, listas: previous }))
      toast.error("Erro ao realizar tarefa no banco")
    }
  }, [])

  const removeListaItem = useCallback(async (id: string) => {
    const previous = dataRef.current.listas
    setData(prev => ({ ...prev, listas: prev.listas.filter(l => l.id !== id) }))
    toast.success("Lista removida!")

    try {
      const res = await fetch(`${API_URL}/listas/${id}`, {
        method: "DELETE",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${tokenRef.current}`,
          "X-Evento-Id": String(selectedEventIdRef.current)
        }
      })
      if (!res.ok) throw new Error("Erro banco")
    } catch (err) {
      console.error(err)
      setData(prev => ({ ...prev, listas: previous }))
      toast.error("Erro ao realizar tarefa no banco")
    }
  }, [])

  const setLotacaoMaxima = (n: number) => setData(prev => ({ ...prev, lotacaoMaxima: n }))

  const pessoasDentro = data.tickets.filter(t => t.entrou).length

  return (
    <EventContext.Provider value={{
      ...data,
      loading,
      selectedEventId,
      setSelectedEventId,
      currentEvento,
      fetchData,
      refreshEventos,
      fetchGlobalSummary,
      addEvento,
      updateEvento,
      removeEvento,
      isInitialLoad,
      isGlobalLoading,
      fetchedModules,
      mounted,
      addPessoa,
      updatePessoa,
      removePessoa,
      addTicket,
      marcarEntrada,
      addProduct,
      addProducts,
      updateProduct,
      removeProduct,
      addBarSale,
      addBarSales,
      updateBarSale,
      removeBarSale,
      addColaborador,
      updateColaborador,
      removeColaborador,
      addCamaroteTable,
      updateCamaroteTable,
      addGarrafaToCamarote,
      addPessoaToCamarote,
      removePessoaFromCamarote,
      removeGarrafaFromCamarote,
      addListaItem,
      updateListaItem,
      removeListaItem,
      setLotacaoMaxima,
      pessoasDentro,
      overlay,
      setOverlay,
    }}>
      <EventColorInjector />
      {children}
    </EventContext.Provider>
  )
}
