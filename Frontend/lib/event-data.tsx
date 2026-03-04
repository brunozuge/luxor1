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
  garrafas: string[]
  pessoaIds: string[]
}

export interface Evento {
  id: string
  nome: string
  cor_primaria: string
  cor_secundaria: string
  logo: string | null
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
}

interface EventContextType extends EventData {
  loading: boolean
  selectedEventId: string | null
  setSelectedEventId: (id: string | null) => void
  currentEvento: Evento | null

  fetchData: (quiet?: boolean, modules?: (keyof EventData)[]) => Promise<void>
  refreshEventos: () => Promise<void>
  addEvento: (e: Omit<Evento, "id">) => Promise<Evento>
  updateEvento: (id: string, e: Partial<Evento>) => Promise<void>
  removeEvento: (id: string) => Promise<void>
  isInitialLoad: boolean
  fetchedModules: Set<keyof EventData>

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
  setLotacaoMaxima: (n: number) => void
  pessoasDentro: number
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
    eventos: []
  })
  const [loading, setLoading] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [fetchedModules, setFetchedModules] = useState<Set<keyof EventData>>(new Set())

  // Refs to avoid infinite loops in fetchData dependencies
  const isInitialLoadRef = useRef(isInitialLoad)
  const fetchedModulesRef = useRef(fetchedModules)

  useEffect(() => {
    isInitialLoadRef.current = isInitialLoad
  }, [isInitialLoad])

  useEffect(() => {
    fetchedModulesRef.current = fetchedModules
  }, [fetchedModules])

  const [selectedEventId, setSelectedEventIdState] = useState<string | null>(null)
  const { token, isAuthenticated } = useAuth()

  const setSelectedEventId = (id: string | null) => {
    if (String(id) === String(selectedEventId)) return
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
    }))

    if (id) {
      localStorage.setItem("selected_evento_id", id)
    } else {
      localStorage.removeItem("selected_evento_id")
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem("selected_evento_id")
    if (saved) setSelectedEventIdState(saved)
  }, [])

  const currentEvento = data.eventos.find(e => String(e.id) === String(selectedEventId)) || null

  const refreshEventos = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/eventos`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      })
      if (!res.ok) throw new Error("Erro ao carregar eventos")
      const eventos = await res.json()
      setData(prev => ({
        ...prev,
        eventos: eventos.map((e: any) => ({
          id: String(e.id),
          nome: e.nome,
          cor_primaria: e.cor_primaria,
          cor_secundaria: e.cor_secundaria,
          logo: e.logo
        }))
      }))
      if (eventos.length > 0) {
        const isValid = eventos.some((e: any) => String(e.id) === String(selectedEventId))
        if (!selectedEventId || !isValid) {
          setSelectedEventId(String(eventos[0].id))
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [token, selectedEventId])

  const fetchData = useCallback(async (quiet = false, modules?: (keyof EventData)[]) => {
    if (!token || !selectedEventId) return

    // Show loading if any of the requested modules hasn't been fetched yet
    const anyNewModule = modules
      ? modules.some(m => !fetchedModulesRef.current.has(m))
      : isInitialLoadRef.current

    if (!quiet && anyNewModule) setLoading(true)

    try {
      const allModules: { key: keyof EventData; url: string }[] = [
        { key: "pessoas", url: `${API_URL}/pessoas` },
        { key: "tickets", url: `${API_URL}/ingressos` },
        { key: "products", url: `${API_URL}/produtos` },
        { key: "barSales", url: `${API_URL}/vendas-bar` },
        { key: "colaboradores", url: `${API_URL}/colaboradores` },
        { key: "camaroteTables", url: `${API_URL}/mesas-camarote` },
      ]

      const modulesToFetch = modules
        ? allModules.filter(m => modules.includes(m.key))
        : allModules

      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "X-Evento-Id": selectedEventId
      }

      const responses = await Promise.all(
        modulesToFetch.map(m => fetch(m.url, { headers }))
      )

      for (const res of responses) {
        if (!res.ok) {
          if (res.status === 401) return
          throw new Error(`API Error: ${res.statusText} (${res.url})`)
        }
      }

      await Promise.all(responses.map(async (res, index) => {
        const json = await res.json()
        const m = modulesToFetch[index]

        let transformed: any = json
        if (m.key === "pessoas") {
          transformed = json.map((p: any) => ({
            id: String(p.id),
            nome: p.nome,
            instagram: p.instagram || "",
            cpfRg: p.cpf_rg || "",
            dataNascimento: p.data_nascimento || "",
            tipoIngresso: p.tipo_ingresso as TicketType,
            observacao: p.observacao || "",
            createdAt: p.created_at
          }))
        } else if (m.key === "tickets") {
          transformed = json.map((i: any) => ({
            id: String(i.id),
            numero: i.numero,
            lote: i.lote || "",
            valorPago: Number(i.valor_pago),
            vendedor: i.vendedor || "",
            formaPagamento: i.forma_pagamento as PaymentMethod,
            pessoaId: String(i.pessoa_id),
            entrou: Boolean(i.entrou),
            horaEntrada: i.hora_entrada,
            pulseira: i.pulseira as WristbandColor
          }))
        } else if (m.key === "products") {
          transformed = json.map((p: any) => ({
            id: String(p.id),
            nome: p.nome,
            custo: Number(p.custo),
            precoVenda: Number(p.preco_venda),
            estoqueInicial: p.estoque_inicial,
            estoqueAtual: p.estoque_atual
          }))
        } else if (m.key === "barSales") {
          transformed = json.map((v: any) => ({
            id: String(v.id),
            productId: String(v.produto_id),
            pessoaId: String(v.pessoa_id),
            vendedor: v.vendedor || "",
            quantidade: v.quantidade,
            valorTotal: Number(v.valor_total),
            hora: v.hora
          }))
        } else if (m.key === "colaboradores") {
          transformed = json.map((c: any) => ({
            id: String(c.id),
            nome: c.nome,
            cargo: c.cargo as CargoColaborador,
            telefone: c.telefone || "",
            ativo: Boolean(c.ativo)
          }))
        } else if (m.key === "camaroteTables") {
          transformed = json.map((m: any) => ({
            id: String(m.id),
            nome: m.nome,
            garcom: m.garcom || "",
            garrafas: m.garrafas || [],
            pessoaIds: m.pessoas?.map((p: any) => String(p.id)) || []
          }))
        }

        setData(prev => ({ ...prev, [m.key]: transformed }))
        setFetchedModules(prev => {
          if (prev.has(m.key)) return prev
          const next = new Set(prev)
          next.add(m.key)
          return next
        })
      }))

      if (!modules || modules.length === allModules.length) {
        setIsInitialLoad(false)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }, [token, selectedEventId]) // Removed isInitialLoad to avoid loop

  useEffect(() => {
    if (isAuthenticated) {
      refreshEventos()
    }
  }, [isAuthenticated, refreshEventos])


  const addEvento = useCallback(async (e: Omit<Evento, "id">) => {
    const res = await fetch(`${API_URL}/eventos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(e)
    })
    if (!res.ok) throw new Error("Erro ao criar evento")
    const newEvento = await res.json()
    setData(prev => ({ ...prev, eventos: [...prev.eventos, newEvento] }))
    setSelectedEventId(String(newEvento.id))
    return newEvento
  }, [token])

  const updateEvento = useCallback(async (id: string, e: Partial<Evento>) => {
    const res = await fetch(`${API_URL}/eventos/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(e)
    })
    if (!res.ok) throw new Error("Erro ao atualizar evento")
    const updated = await res.json()
    setData(prev => ({
      ...prev,
      eventos: prev.eventos.map(x => String(x.id) === id ? updated : x)
    }))
  }, [token])

  const removeEvento = useCallback(async (id: string) => {
    const res = await fetch(`${API_URL}/eventos/${id}`, {
      method: "DELETE",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      }
    })
    if (!res.ok) throw new Error("Erro ao remover evento")
    setData(prev => ({
      ...prev,
      eventos: prev.eventos.filter(x => String(x.id) !== id)
    }))
    if (selectedEventId === id) setSelectedEventId(null)
  }, [token, selectedEventId])

  const addPessoa = useCallback(async (p: Omit<Person, "id" | "createdAt">) => {
    const res = await fetch(`${API_URL}/pessoas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`,
        "X-Evento-Id": selectedEventId as string
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
    if (!res.ok) throw new Error("Erro ao cadastrar pessoa")
    const newItem = await res.json()
    fetchData(true, ["pessoas"])
    return String(newItem.id)
  }, [token, selectedEventId, fetchData])

  const updatePessoa = useCallback(async (id: string, p: Partial<Person>) => {
    const res = await fetch(`${API_URL}/pessoas/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`,
        "X-Evento-Id": selectedEventId as string
      },
      body: JSON.stringify({
        nome: p.nome,
        instagram: p.instagram,
        cpf_rg: p.cpfRg?.replace(/\D/g, ""),
        data_nascimento: p.dataNascimento,
        tipo_ingresso: p.tipoIngresso,
        observacao: p.observacao
      })
    })
    if (!res.ok) throw new Error("Erro ao atualizar pessoa")
    fetchData(true, ["pessoas"])
  }, [token, selectedEventId, fetchData])

  const removePessoa = useCallback(async (id: string) => {
    // Optimistic update
    setData(prev => ({ ...prev, pessoas: prev.pessoas.filter(x => x.id !== id) }))
    try {
      const res = await fetch(`${API_URL}/pessoas/${id}`, {
        method: "DELETE",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
          "X-Evento-Id": selectedEventId as string
        }
      })
      if (!res.ok) throw new Error("Erro ao remover")
    } catch (err) {
      console.error(err)
      toast.error("Erro ao remover pessoa")
      fetchData(true, ["pessoas"])
    }
  }, [token, selectedEventId, fetchData])

  const addTicket = useCallback(async (t: Omit<Ticket, "id" | "entrou" | "horaEntrada" | "pulseira">) => {
    const tempId = `temp-${Date.now()}`
    const optimisticTicket: Ticket = {
      ...t,
      id: tempId,
      entrou: false,
      horaEntrada: null,
      pulseira: null
    }

    // Optimistic update
    setData(prev => ({ ...prev, tickets: [optimisticTicket, ...prev.tickets] }))

    try {
      const res = await fetch(`${API_URL}/ingressos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
          "X-Evento-Id": selectedEventId as string
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
      if (!res.ok) throw new Error("Erro ingresso")
      fetchData(true, ["tickets"])
    } catch (err) {
      console.error(err)
      toast.error("Erro ao criar ingresso")
      fetchData(true, ["tickets"])
    }
  }, [token, selectedEventId, fetchData])

  const marcarEntrada = useCallback(async (ticketId: string, pulseira: WristbandColor) => {
    const now = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })

    // Optimistic update
    setData(prev => ({
      ...prev,
      tickets: prev.tickets.map(t => t.id === ticketId ? { ...t, entrou: true, horaEntrada: now, pulseira } : t)
    }))

    try {
      const res = await fetch(`${API_URL}/ingressos/${ticketId}/check-in`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
          "X-Evento-Id": selectedEventId as string
        },
        body: JSON.stringify({ pulseira })
      })
      if (!res.ok) throw new Error("Erro check-in")
    } catch (err) {
      console.error(err)
      toast.error("Erro ao marcar entrada")
      fetchData(true, ["tickets"])
    }
  }, [token, selectedEventId, fetchData])

  const addProduct = useCallback(async (p: Omit<Product, "id" | "estoqueAtual">) => {
    const res = await fetch(`${API_URL}/produtos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`,
        "X-Evento-Id": selectedEventId as string
      },
      body: JSON.stringify({
        nome: p.nome,
        custo: p.custo,
        preco_venda: p.precoVenda,
        estoque_inicial: p.estoqueInicial
      })
    })
    if (!res.ok) throw new Error("Erro produto")
    fetchData(true, ["products"])
  }, [token, selectedEventId, fetchData])

  const addProducts = useCallback(async (ps: Omit<Product, "id" | "estoqueAtual">[]) => {
    const res = await fetch(`${API_URL}/produtos/bulk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`,
        "X-Evento-Id": selectedEventId as string
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
    if (!res.ok) throw new Error("Erro bulk produtos")
    fetchData(true, ["products"])
  }, [token, selectedEventId, fetchData])

  const updateProduct = useCallback(async (id: string, p: Partial<Product>) => {
    const res = await fetch(`${API_URL}/produtos/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`,
        "X-Evento-Id": selectedEventId as string
      },
      body: JSON.stringify(p)
    })
    if (!res.ok) throw new Error("Erro atualizar produto")
    fetchData(true, ["products"])
  }, [token, selectedEventId, fetchData])

  const removeProduct = useCallback(async (id: string) => {
    // Optimistic update
    setData(prev => ({ ...prev, products: prev.products.filter(x => x.id !== id) }))
    try {
      const res = await fetch(`${API_URL}/produtos/${id}`, {
        method: "DELETE",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
          "X-Evento-Id": selectedEventId as string
        }
      })
      if (!res.ok) throw new Error("Erro remover produto")
    } catch (err) {
      console.error(err)
      toast.error("Erro ao remover produto")
      fetchData(true, ["products"])
    }
  }, [token, selectedEventId, fetchData])

  const addBarSale = useCallback(async (s: Omit<BarSale, "id" | "hora" | "valorTotal">) => {
    const prod = data.products.find(p => p.id === s.productId)
    const valorTotal = (prod?.precoVenda || 0) * s.quantidade
    const now = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })

    const tempId = `temp-${Date.now()}`
    const optimisticSale: BarSale = {
      ...s,
      id: tempId,
      hora: now,
      valorTotal: valorTotal
    }

    // Optimistic update
    setData(prev => ({
      ...prev,
      barSales: [optimisticSale, ...prev.barSales],
      products: prev.products.map(p => p.id === s.productId ? { ...p, estoqueAtual: p.estoqueAtual - s.quantidade } : p)
    }))

    try {
      const res = await fetch(`${API_URL}/vendas-bar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
          "X-Evento-Id": selectedEventId as string
        },
        body: JSON.stringify({
          produto_id: s.productId,
          pessoa_id: s.pessoaId,
          vendedor: s.vendedor,
          quantidade: s.quantidade
        })
      })
      if (!res.ok) throw new Error("Erro venda bar")
      const realSale = await res.json()

      // Replace temp with real
      setData(prev => ({
        ...prev,
        barSales: prev.barSales.map(sale => sale.id === tempId ? { ...sale, id: String(realSale.id) } : sale)
      }))
    } catch (err) {
      console.error(err)
      toast.error("Erro registrar venda")
      fetchData(true, ["barSales", "products"])
    }
  }, [token, selectedEventId, fetchData, data.products])

  const addBarSales = useCallback(async (vendedor: string, items: { productId: string; quantidade: number }[], pessoaId?: string) => {
    const now = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    const tempSales: BarSale[] = items.map((item, idx) => {
      const prod = data.products.find(p => p.id === item.productId)
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

    // Optimistic update
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

    try {
      const res = await fetch(`${API_URL}/vendas-bar/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
          "X-Evento-Id": selectedEventId as string
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
      if (!res.ok) throw new Error("Erro bulk vendas")
      fetchData(true, ["barSales", "products"])
    } catch (err) {
      console.error(err)
      toast.error("Erro registrar vendas")
      fetchData(true, ["barSales", "products"])
    }
  }, [token, selectedEventId, fetchData, data.products])

  const updateBarSale = useCallback(async (id: string, s: Partial<BarSale>) => {
    const res = await fetch(`${API_URL}/vendas-bar/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`,
        "X-Evento-Id": selectedEventId as string
      },
      body: JSON.stringify({
        vendedor: s.vendedor,
        quantidade: s.quantidade,
        pessoa_id: s.pessoaId === "none" ? null : s.pessoaId,
      })
    })
    if (!res.ok) throw new Error("Erro atualizar venda")
    fetchData(true, ["barSales", "products"])
  }, [token, selectedEventId, fetchData])

  const removeBarSale = useCallback(async (id: string) => {
    // Optimistic update
    const saleToRemove = data.barSales.find(s => s.id === id)
    setData(prev => ({
      ...prev,
      barSales: prev.barSales.filter(x => x.id !== id),
      products: saleToRemove ? prev.products.map(p => p.id === saleToRemove.productId ? { ...p, estoqueAtual: p.estoqueAtual + saleToRemove.quantidade } : p) : prev.products
    }))

    try {
      const res = await fetch(`${API_URL}/vendas-bar/${id}`, {
        method: "DELETE",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
          "X-Evento-Id": selectedEventId as string
        }
      })
      if (!res.ok) throw new Error("Erro remover venda")
    } catch (err) {
      console.error(err)
      toast.error("Erro ao remover venda")
      fetchData(true, ["barSales", "products"])
    }
  }, [token, selectedEventId, fetchData, data.barSales, data.products])

  const addColaborador = useCallback(async (c: Omit<Colaborador, "id">) => {
    const res = await fetch(`${API_URL}/colaboradores`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`,
        "X-Evento-Id": selectedEventId as string
      },
      body: JSON.stringify(c)
    })
    if (!res.ok) throw new Error("Erro colaborador")
    fetchData(true, ["colaboradores"])
  }, [token, selectedEventId, fetchData])

  const updateColaborador = useCallback(async (id: string, c: Partial<Colaborador>) => {
    const res = await fetch(`${API_URL}/colaboradores/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`,
        "X-Evento-Id": selectedEventId as string
      },
      body: JSON.stringify(c)
    })
    if (!res.ok) throw new Error("Erro atualizar colaborador")
    fetchData(true, ["colaboradores"])
  }, [token, selectedEventId, fetchData])

  const removeColaborador = useCallback(async (id: string) => {
    const res = await fetch(`${API_URL}/colaboradores/${id}`, {
      method: "DELETE",
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`,
        "X-Evento-Id": selectedEventId as string
      }
    })
    if (!res.ok) throw new Error("Erro remover colaborador")
    fetchData(true, ["colaboradores"])
  }, [token, selectedEventId, fetchData])

  const addCamaroteTable = useCallback(async (t: Omit<CamaroteTable, "id" | "pessoaIds" | "garrafas">) => {
    const res = await fetch(`${API_URL}/mesas-camarote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`,
        "X-Evento-Id": selectedEventId as string
      },
      body: JSON.stringify(t)
    })
    if (!res.ok) throw new Error("Erro mesa")
    fetchData(true, ["camaroteTables"])
  }, [token, selectedEventId, fetchData])

  const updateCamaroteTable = useCallback(async (id: string, t: Partial<CamaroteTable>) => {
    const res = await fetch(`${API_URL}/mesas-camarote/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`,
        "X-Evento-Id": selectedEventId as string
      },
      body: JSON.stringify(t)
    })
    if (!res.ok) throw new Error("Erro atualizar mesa")
    fetchData(true, ["camaroteTables"])
  }, [token, selectedEventId, fetchData])

  const addGarrafaToCamarote = useCallback(async (tableId: string, garrafa: string) => {
    // Optimistic update
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
          "Authorization": `Bearer ${token}`,
          "X-Evento-Id": selectedEventId as string
        },
        body: JSON.stringify({ garrafa })
      })
      if (!res.ok) throw new Error("Erro garrafa")
    } catch (err) {
      console.error(err)
      toast.error("Erro ao adicionar garrafa")
      fetchData(true, ["camaroteTables"])
    }
  }, [token, selectedEventId, fetchData])

  const removeGarrafaFromCamarote = useCallback(async (tableId: string, index: number) => {
    // Optimistic update
    setData(prev => ({
      ...prev,
      camaroteTables: prev.camaroteTables.map(t => t.id === tableId ? { ...t, garrafas: t.garrafas.filter((_, i) => i !== index) } : t)
    }))

    try {
      const res = await fetch(`${API_URL}/mesas-camarote/${tableId}/garrafas/${index}`, {
        method: "DELETE",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
          "X-Evento-Id": selectedEventId as string
        }
      })
      if (!res.ok) throw new Error("Erro remover garrafa")
    } catch (err) {
      console.error(err)
      toast.error("Erro ao remover garrafa")
      fetchData(true, ["camaroteTables"])
    }
  }, [token, selectedEventId, fetchData])

  const addPessoaToCamarote = useCallback(async (tableId: string, pessoaId: string) => {
    // Optimistic update
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
          "Authorization": `Bearer ${token}`,
          "X-Evento-Id": selectedEventId as string
        },
        body: JSON.stringify({ pessoa_id: pessoaId })
      })
      if (!res.ok) throw new Error("Erro pessoa mesa")
    } catch (err) {
      console.error(err)
      toast.error("Erro ao adicionar pessoa")
      fetchData(true, ["camaroteTables"])
    }
  }, [token, selectedEventId, fetchData])

  const removePessoaFromCamarote = useCallback(async (tableId: string, pessoaId: string) => {
    // Optimistic update
    setData(prev => ({
      ...prev,
      camaroteTables: prev.camaroteTables.map(t => t.id === tableId ? { ...t, pessoaIds: t.pessoaIds.filter(pid => pid !== pessoaId) } : t)
    }))

    try {
      const res = await fetch(`${API_URL}/mesas-camarote/${tableId}/pessoas/${pessoaId}`, {
        method: "DELETE",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
          "X-Evento-Id": selectedEventId as string
        }
      })
      if (!res.ok) throw new Error("Erro remover pessoa mesa")
    } catch (err) {
      console.error(err)
      toast.error("Erro ao remover pessoa")
      fetchData(true, ["camaroteTables"])
    }
  }, [token, selectedEventId, fetchData])

  const setLotacaoMaxima = (n: number) => setData(prev => ({ ...prev, lotacaoMaxima: n }))

  const pessoasDentro = data.tickets.filter(t => t.entrou).length

  return (
    <EventContext.Provider value={{
      ...data,
      loading,
      isInitialLoad,
      fetchedModules,
      selectedEventId,
      setSelectedEventId,
      currentEvento,
      fetchData,
      refreshEventos,
      addEvento,
      updateEvento,
      removeEvento,
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
      setLotacaoMaxima,
      pessoasDentro,
    }}>
      <EventColorInjector />
      {children}
    </EventContext.Provider>
  )
}
