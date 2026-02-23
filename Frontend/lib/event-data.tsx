"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"
import { toast } from "sonner" // Assuming sonner is available based on package.json
import { useAuth } from "./auth-context"

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

export interface EventData {
  pessoas: Person[]
  tickets: Ticket[]
  products: Product[]
  barSales: BarSale[]
  camaroteTables: CamaroteTable[]
  colaboradores: Colaborador[]
  lotacaoMaxima: number
}

interface EventContextType extends EventData {
  loading: boolean
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
    lotacaoMaxima: 500
  })
  const [loading, setLoading] = useState(false)
  const { token, isAuthenticated } = useAuth()

  const fetchData = useCallback(async (quiet = false) => {
    if (!token) return
    if (!quiet) setLoading(true)
    try {
      const urls = [
        `${API_URL}/pessoas`,
        `${API_URL}/ingressos`,
        `${API_URL}/produtos`,
        `${API_URL}/vendas-bar`,
        `${API_URL}/colaboradores`,
        `${API_URL}/mesas-camarote`,
      ]

      const responses = await Promise.all(
        urls.map(url =>
          fetch(url, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          })
        )
      )

      // Check for any non-ok responses
      for (const res of responses) {
        if (!res.ok) {
          if (res.status === 401) return // Auth error, let context handle
          throw new Error(`API Error: ${res.statusText} (${res.url})`)
        }
      }

      const [pessoas, ingressos, produtos, vendas, colaboradores, mesas] = await Promise.all(
        responses.map(res => res.json())
      )

      setData(prev => ({
        ...prev,
        pessoas: pessoas.map((p: any) => ({
          id: String(p.id),
          nome: p.nome,
          instagram: p.instagram || "",
          cpfRg: p.cpf_rg || "",
          dataNascimento: p.data_nascimento || "",
          tipoIngresso: p.tipo_ingresso,
          observacao: p.observacao || "",
          createdAt: p.created_at
        })),
        tickets: ingressos.map((i: any) => ({
          id: String(i.id),
          numero: i.numero,
          lote: i.lote || "",
          valorPago: Number(i.valor_pago),
          vendedor: i.vendedor || "",
          formaPagamento: i.forma_pagamento,
          pessoaId: String(i.pessoa_id),
          entrou: Boolean(i.entrou),
          horaEntrada: i.hora_entrada,
          pulseira: i.pulseira
        })),
        products: produtos.map((p: any) => ({
          id: String(p.id),
          nome: p.nome,
          custo: Number(p.custo),
          precoVenda: Number(p.preco_venda),
          estoqueInicial: p.estoque_inicial,
          estoqueAtual: p.estoque_atual
        })),
        barSales: vendas.map((v: any) => ({
          id: String(v.id),
          productId: String(v.produto_id),
          pessoaId: String(v.pessoa_id),
          vendedor: v.vendedor || "",
          quantidade: v.quantidade,
          valorTotal: Number(v.valor_total),
          hora: v.hora
        })),
        colaboradores: colaboradores.map((c: any) => ({
          id: String(c.id),
          nome: c.nome,
          cargo: c.cargo,
          telefone: c.telefone || "",
          ativo: Boolean(c.ativo)
        })),
        camaroteTables: mesas.map((m: any) => ({
          id: String(m.id),
          nome: m.nome,
          garcom: m.garcom || "",
          garrafas: m.garrafas || [],
          pessoaIds: m.pessoas?.map((p: any) => String(p.id)) || []
        }))
      }))
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Erro ao carregar dados do servidor.")
    } finally {
      if (!quiet) setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const addPessoa = useCallback(async (p: Omit<Person, "id" | "createdAt">) => {
    const promise = async () => {
      let res
      try {
        res = await fetch(`${API_URL}/pessoas`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
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
      } catch (networkError) {
        throw new Error("Erro de conexão com o servidor")
      }

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.errors ? Object.values(errData.errors).flat()[0] as string : "Erro ao cadastrar")
      }
      const newItem = await res.json()

      // Update state ONLY after success
      setData(prev => ({
        ...prev,
        pessoas: [...prev.pessoas, newItem]
      }))

      fetchData(true)
      return newItem
    }

    const pRef = promise()

    toast.promise(pRef, {
      loading: "Sincronizando com o servidor...",
      success: "Pessoa cadastrada com sucesso!",
      error: (err) => `Erro no Cadastro: ${err.message || "Falha na sincronização"}`
    })

    return await pRef
  }, [token, fetchData])

  const updatePessoa = useCallback(async (id: string, p: Partial<Person>) => {
    const promise = async () => {
      let res
      try {
        res = await fetch(`${API_URL}/pessoas/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            nome: p.nome,
            instagram: p.instagram || "",
            cpf_rg: p.cpfRg ? p.cpfRg.replace(/\D/g, "") : undefined,
            data_nascimento: p.dataNascimento,
            tipo_ingresso: p.tipoIngresso,
            observacao: p.observacao
          })
        })
      } catch (networkError) {
        throw new Error("Erro de conexão com o servidor")
      }

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.errors ? Object.values(errData.errors).flat()[0] as string : "Erro ao atualizar")
      }

      // Update state ONLY after success
      setData(prev => ({
        ...prev,
        pessoas: prev.pessoas.map(x => x.id === id ? { ...x, ...p } : x)
      }))

      fetchData(true)
    }

    const pRef = promise()
    toast.promise(pRef, {
      loading: "Atualizando dados...",
      success: "Cadastro atualizado!",
      error: (err) => `Erro na Atualização: ${err.message || "Falha na sincronização"}`
    })

    await pRef
  }, [token, fetchData])

  const removePessoa = useCallback(async (id: string) => {
    const previousPessoas = [...data.pessoas]
    setData(prev => ({
      ...prev,
      pessoas: prev.pessoas.filter(x => x.id !== id)
    }))

    try {
      const res = await fetch(`${API_URL}/pessoas/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (!res.ok) throw new Error("Falha no servidor")
      toast.success("Removido com sucesso!")
      fetchData(true)
    } catch (error) {
      setData(prev => ({ ...prev, pessoas: previousPessoas }))
      toast.error("Erro ao remover. Revertendo...")
    }
  }, [data.pessoas, fetchData])

  const addTicket = useCallback(async (t: Omit<Ticket, "id" | "entrou" | "horaEntrada" | "pulseira">) => {
    const previousTickets = [...data.tickets]
    const tempId = "temp-t-" + Date.now()
    setData(prev => ({
      ...prev,
      tickets: [...prev.tickets, { ...t, id: tempId, entrou: false, horaEntrada: null, pulseira: null }]
    }))

    try {
      const res = await fetch(`${API_URL}/ingressos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          numero: t.numero,
          lote: t.lote,
          valor_pago: t.valorPago,
          vendedor: t.vendedor,
          forma_pagamento: t.formaPagamento
        })
      })
      if (!res.ok) throw new Error("Falha no servidor")
      toast.success("Ingresso registrado!")
      fetchData(true)
    } catch (error) {
      setData(prev => ({ ...prev, tickets: previousTickets }))
      toast.error("Erro ao registrar ingresso.")
    }
  }, [data.tickets, fetchData])

  const marcarEntrada = useCallback(async (ticketId: string, pulseira: WristbandColor) => {
    const previousTickets = [...data.tickets]
    const now = new Date()
    const hora = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`

    setData(prev => ({
      ...prev,
      tickets: prev.tickets.map(t => t.id === ticketId ? { ...t, entrou: true, horaEntrada: hora, pulseira } : t)
    }))

    try {
      const res = await fetch(`${API_URL}/ingressos/${ticketId}/check-in`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ pulseira })
      })
      if (!res.ok) throw new Error("Falha no servidor")
      toast.success("Entrada confirmada!")
      fetchData(true)
    } catch (error) {
      setData(prev => ({ ...prev, tickets: previousTickets }))
      toast.error("Erro ao confirmar entrada.")
    }
  }, [data.tickets, fetchData])

  const addProduct = useCallback(async (p: Omit<Product, "id" | "estoqueAtual">) => {
    const previousProducts = [...data.products]
    setData(prev => ({
      ...prev,
      products: [...prev.products, { ...p, id: "temp-pr", estoqueAtual: p.estoqueInicial }]
    }))

    try {
      const res = await fetch(`${API_URL}/produtos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          nome: p.nome,
          custo: p.custo,
          preco_venda: p.precoVenda,
          estoque_inicial: p.estoqueInicial
        })
      })
      if (!res.ok) throw new Error("Falha no servidor")
      toast.success("Produto adicionado!")
      fetchData(true)
    } catch (error) {
      setData(prev => ({ ...prev, products: previousProducts }))
      toast.error("Erro ao adicionar produto.")
    }
  }, [data.products, token, fetchData])

  const addProducts = useCallback(async (ps: Omit<Product, "id" | "estoqueAtual">[]) => {
    const previousProducts = [...data.products]
    const tempProducts = ps.map((p, i) => ({ ...p, id: `temp-bulk-${i}`, estoqueAtual: p.estoqueInicial }))

    setData(prev => ({
      ...prev,
      products: [...prev.products, ...tempProducts]
    }))

    try {
      const res = await fetch(`${API_URL}/produtos/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
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
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.errors ? Object.values(errData.errors).flat()[0] as string : "Erro ao cadastrar produtos")
      }
      toast.success(`${ps.length} produtos adicionados!`)
      fetchData(true)
    } catch (error: any) {
      setData(prev => ({ ...prev, products: previousProducts }))
      toast.error(error.message || "Erro ao adicionar produtos.")
    }
  }, [data.products, token, fetchData])

  const addBarSale = useCallback(async (s: Omit<BarSale, "id" | "hora" | "valorTotal">) => {
    const previousProducts = [...data.products]
    const previousSales = [...data.barSales]

    // Optimistic inventory update
    setData(prev => ({
      ...prev,
      products: prev.products.map(p =>
        p.id === s.productId ? { ...p, estoqueAtual: p.estoqueAtual - s.quantidade } : p
      )
    }))

    try {
      const res = await fetch(`${API_URL}/vendas-bar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          produto_id: s.productId,
          pessoa_id: s.pessoaId,
          vendedor: s.vendedor,
          quantidade: s.quantidade
        })
      })
      if (!res.ok) throw new Error("Falha no servidor")
      toast.success("Venda realizada!")
      fetchData(true)
    } catch (error) {
      setData(prev => ({ ...prev, products: previousProducts, barSales: previousSales }))
      toast.error("Erro na venda.")
    }
  }, [data.products, data.barSales, token, fetchData])

  const addBarSales = useCallback(async (vendedor: string, items: { productId: string; quantidade: number }[], pessoaId?: string) => {
    const previousProducts = [...data.products]
    const previousSales = [...data.barSales]

    const now = new Date()
    const hora = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`

    const tempSales = items.map((item, i) => {
      const prod = data.products.find(p => p.id === item.productId)
      return {
        id: `temp-sale-${Date.now()}-${i}`,
        productId: item.productId,
        pessoaId: pessoaId || "none",
        vendedor,
        quantidade: item.quantidade,
        valorTotal: (prod?.precoVenda || 0) * item.quantidade,
        hora
      }
    })

    // Optimistic inventory and sales update
    setData(prev => ({
      ...prev,
      products: prev.products.map(p => {
        const item = items.find(i => i.productId === p.id)
        return item ? { ...p, estoqueAtual: p.estoqueAtual - item.quantidade } : p
      }),
      barSales: [...tempSales, ...prev.barSales]
    }))

    try {
      const res = await fetch(`${API_URL}/vendas-bar/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
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
        const errData = await res.json()
        throw new Error(errData.message || "Falha no servidor")
      }
      toast.success("Vendas registradas!")
      fetchData(true)
    } catch (error: any) {
      setData(prev => ({ ...prev, products: previousProducts, barSales: previousSales }))
      toast.error(error.message || "Erro nas vendas.")
    }
  }, [data.products, data.barSales, token, fetchData])

  const updateBarSale = useCallback(async (id: string, s: Partial<BarSale>) => {
    const previousSales = [...data.barSales]
    const previousProducts = [...data.products]

    setData(prev => ({
      ...prev,
      barSales: prev.barSales.map(x => (x.id === id ? { ...x, ...s } : x))
    }))

    try {
      const res = await fetch(`${API_URL}/vendas-bar/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          vendedor: s.vendedor,
          quantidade: s.quantidade,
          pessoa_id: s.pessoaId === "none" ? null : s.pessoaId,
        })
      })
      if (!res.ok) throw new Error("Erro no servidor")
      toast.success("Venda atualizada!")
      fetchData(true)
    } catch (error) {
      setData(prev => ({ ...prev, barSales: previousSales, products: previousProducts }))
      toast.error("Erro ao atualizar venda.")
    }
  }, [data.barSales, data.products, token, fetchData])

  const removeBarSale = useCallback(async (id: string) => {
    const previousSales = [...data.barSales]
    const previousProducts = [...data.products]

    setData(prev => ({
      ...prev,
      barSales: prev.barSales.filter(x => x.id !== id)
    }))

    try {
      const res = await fetch(`${API_URL}/vendas-bar/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (!res.ok) throw new Error("Erro no servidor")
      toast.success("Venda removida!")
      fetchData(true)
    } catch (error) {
      setData(prev => ({ ...prev, barSales: previousSales, products: previousProducts }))
      toast.error("Erro ao remover venda.")
    }
  }, [data.barSales, data.products, token, fetchData])

  const addColaborador = useCallback(async (c: Omit<Colaborador, "id">) => {
    const previousColabs = [...data.colaboradores]
    setData(prev => ({
      ...prev,
      colaboradores: [...prev.colaboradores, { ...c, id: "temp-col" }]
    }))

    try {
      const res = await fetch(`${API_URL}/colaboradores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: c.nome,
          cargo: c.cargo,
          telefone: c.telefone,
          ativo: c.ativo
        })
      })
      if (!res.ok) throw new Error("Falha no servidor")
      toast.success("Colaborador adicionado!")
      fetchData(true)
    } catch (error) {
      setData(prev => ({ ...prev, colaboradores: previousColabs }))
      toast.error("Erro ao adicionar colaborador.")
    }
  }, [data.colaboradores, fetchData])

  const setLotacaoMaxima = useCallback((n: number) => {
    setData(prev => ({ ...prev, lotacaoMaxima: n }))
  }, [])

  // Sync wrappers for other camarote functions
  const addPessoaToCamarote = useCallback(async (tableId: string, pessoaId: string) => {
    try {
      await fetch(`${API_URL}/mesas-camarote/${tableId}/pessoas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ pessoa_id: pessoaId })
      })
      fetchData(true)
    } catch (error) {
      toast.error("Erro ao adicionar pessoa à mesa.")
    }
  }, [fetchData])

  // Placeholder for simple updates
  const updateProduct = useCallback(async (id: string, p: Partial<Product>) => {
    const previousProducts = [...data.products]
    setData(prev => ({
      ...prev,
      products: prev.products.map(x => (x.id === id ? { ...x, ...p } : x))
    }))
    try {
      await fetch(`${API_URL}/produtos/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          nome: p.nome,
          custo: p.custo,
          preco_venda: p.precoVenda,
          estoque_inicial: p.estoqueInicial,
          estoque_atual: p.estoqueAtual
        })
      })
      fetchData(true)
    } catch (error) {
      setData(prev => ({ ...prev, products: previousProducts }))
      toast.error("Erro ao atualizar produto.")
    }
  }, [data.products, token, fetchData])

  const removeProduct = useCallback(async (id: string) => {
    const previousProducts = [...data.products]
    setData(prev => ({
      ...prev,
      products: prev.products.filter(x => x.id !== id)
    }))
    try {
      await fetch(`${API_URL}/produtos/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })
      fetchData(true)
    } catch (error) {
      setData(prev => ({ ...prev, products: previousProducts }))
      toast.error("Erro ao remover produto.")
    }
  }, [data.products, token, fetchData])
  const updateColaborador = useCallback(async (id: string, c: Partial<Colaborador>) => {
    const previousColabs = [...data.colaboradores]
    setData(prev => ({
      ...prev,
      colaboradores: prev.colaboradores.map(x => (x.id === id ? { ...x, ...c } : x))
    }))
    try {
      await fetch(`${API_URL}/colaboradores/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(c)
      })
      fetchData(true)
    } catch (error) {
      setData(prev => ({ ...prev, colaboradores: previousColabs }))
      toast.error("Erro ao atualizar colaborador.")
    }
  }, [data.colaboradores, token, fetchData])

  const removeColaborador = useCallback(async (id: string) => {
    const previousColabs = [...data.colaboradores]
    setData(prev => ({
      ...prev,
      colaboradores: prev.colaboradores.filter(x => x.id !== id)
    }))
    try {
      await fetch(`${API_URL}/colaboradores/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })
      fetchData(true)
    } catch (error) {
      setData(prev => ({ ...prev, colaboradores: previousColabs }))
      toast.error("Erro ao remover colaborador.")
    }
  }, [data.colaboradores, token, fetchData])
  const addCamaroteTable = useCallback(async (t: Omit<CamaroteTable, "id" | "pessoaIds" | "garrafas">) => {
    const previousTables = [...data.camaroteTables]
    const tempId = "temp-" + Date.now()

    setData(prev => ({
      ...prev,
      camaroteTables: [...prev.camaroteTables, { ...t, id: tempId, pessoaIds: [], garrafas: [] }]
    }))

    try {
      const res = await fetch(`${API_URL}/mesas-camarote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(t)
      })
      if (!res.ok) throw new Error("Erro ao criar mesa")
      fetchData(true)
    } catch (error) {
      setData(prev => ({ ...prev, camaroteTables: previousTables }))
      toast.error("Erro ao adicionar mesa.")
    }
  }, [data.camaroteTables, token, fetchData])

  const updateCamaroteTable = useCallback(async (id: string, t: Partial<CamaroteTable>) => {
    const previousTables = [...data.camaroteTables]

    setData(prev => ({
      ...prev,
      camaroteTables: prev.camaroteTables.map(x => x.id === id ? { ...x, ...t } : x)
    }))

    try {
      const res = await fetch(`${API_URL}/mesas-camarote/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(t)
      })
      if (!res.ok) throw new Error("Erro ao atualizar mesa")
      fetchData(true)
    } catch (error) {
      setData(prev => ({ ...prev, camaroteTables: previousTables }))
      toast.error("Erro ao atualizar mesa.")
    }
  }, [data.camaroteTables, token, fetchData])
  const addGarrafaToCamarote = async (tableId: string, garrafa: string) => {
    await fetch(`${API_URL}/mesas-camarote/${tableId}/garrafas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ garrafa })
    })
    fetchData(true)
  }
  const removePessoaFromCamarote = useCallback(async (tableId: string, pessoaId: string) => {
    const previousTables = [...data.camaroteTables]

    // Optimistic Update
    setData(prev => ({
      ...prev,
      camaroteTables: prev.camaroteTables.map(t =>
        t.id === tableId
          ? { ...t, pessoaIds: t.pessoaIds.filter(id => id !== pessoaId) }
          : t
      )
    }))

    try {
      const res = await fetch(`${API_URL}/mesas-camarote/${tableId}/pessoas`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ pessoa_id: pessoaId })
      })
      if (!res.ok) throw new Error("Erro ao remover pessoa")
      fetchData(true)
    } catch (error) {
      setData(prev => ({ ...prev, camaroteTables: previousTables }))
      toast.error("Erro ao remover pessoa da mesa.")
    }
  }, [data.camaroteTables, token, fetchData])

  const removeGarrafaFromCamarote = useCallback(async (tableId: string, index: number) => {
    const previousTables = [...data.camaroteTables]

    setData(prev => ({
      ...prev,
      camaroteTables: prev.camaroteTables.map(t => {
        if (t.id === tableId) {
          const newGarrafas = [...t.garrafas]
          newGarrafas.splice(index, 1)
          return { ...t, garrafas: newGarrafas }
        }
        return t
      })
    }))

    try {
      const res = await fetch(`${API_URL}/mesas-camarote/${tableId}/garrafas`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ index })
      })
      if (!res.ok) throw new Error("Erro ao remover garrafa")
      fetchData(true)
    } catch (error) {
      setData(prev => ({ ...prev, camaroteTables: previousTables }))
      toast.error("Erro ao remover garrafa.")
    }
  }, [data.camaroteTables, token, fetchData])

  const pessoasDentro = data.tickets.filter(t => t.entrou).length

  return (
    <EventContext.Provider value={{
      ...data,
      loading,
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
      {children}
    </EventContext.Provider>
  )
}
