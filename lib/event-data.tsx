"use client"

import React, { createContext, useContext, useState, useCallback } from "react"

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
  addPessoa: (p: Omit<Person, "id" | "createdAt">) => string
  updatePessoa: (id: string, p: Partial<Person>) => void
  removePessoa: (id: string) => void
  addTicket: (t: Omit<Ticket, "id" | "entrou" | "horaEntrada" | "pulseira">) => void
  marcarEntrada: (ticketId: string, pulseira: WristbandColor) => void
  addProduct: (p: Omit<Product, "id" | "estoqueAtual">) => void
  updateProduct: (id: string, p: Partial<Product>) => void
  removeProduct: (id: string) => void
  addBarSale: (s: Omit<BarSale, "id" | "hora" | "valorTotal">) => void

  addColaborador: (c: Omit<Colaborador, "id">) => void
  updateColaborador: (id: string, c: Partial<Colaborador>) => void
  removeColaborador: (id: string) => void
  addCamaroteTable: (t: Omit<CamaroteTable, "id" | "pessoaIds" | "garrafas">) => void
  updateCamaroteTable: (id: string, t: Partial<CamaroteTable>) => void
  addGarrafaToCamarote: (tableId: string, garrafa: string) => void
  addPessoaToCamarote: (tableId: string, pessoaId: string) => void
  removePessoaFromCamarote: (tableId: string, pessoaId: string) => void
  setLotacaoMaxima: (n: number) => void
  pessoasDentro: number
}

const EventContext = createContext<EventContextType | null>(null)

export function useEventData() {
  const ctx = useContext(EventContext)
  if (!ctx) throw new Error("useEventData must be used within EventDataProvider")
  return ctx
}

function generateId() {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36)
}

// --- Demo data ---
function createDemoData(): EventData {
  const pessoas: Person[] = [
    { id: "p1", nome: "Lucas Silva", instagram: "@lucassilva", cpfRg: "123.456.789-00", dataNascimento: "1998-03-15", tipoIngresso: "pista", observacao: "", createdAt: new Date().toISOString() },
    { id: "p2", nome: "Ana Costa", instagram: "@anacosta", cpfRg: "987.654.321-00", dataNascimento: "2000-07-22", tipoIngresso: "camarote", observacao: "influencer", createdAt: new Date().toISOString() },
    { id: "p3", nome: "Pedro Santos", instagram: "", cpfRg: "456.789.123-00", dataNascimento: "1995-11-01", tipoIngresso: "vip", observacao: "", createdAt: new Date().toISOString() },
    { id: "p4", nome: "Maria Oliveira", instagram: "@mariaoliveira", cpfRg: "321.654.987-00", dataNascimento: "2008-01-10", tipoIngresso: "pista", observacao: "menor de idade", createdAt: new Date().toISOString() },
    { id: "p5", nome: "Gabriel Ferreira", instagram: "", cpfRg: "789.123.456-00", dataNascimento: "1992-05-28", tipoIngresso: "free", observacao: "amigo do dono", createdAt: new Date().toISOString() },
  ]

  const tickets: Ticket[] = [
    { id: "t1", numero: "001", lote: "1", valorPago: 80, vendedor: "João", formaPagamento: "pix", pessoaId: "p1", entrou: true, horaEntrada: "22:30", pulseira: "maior" },
    { id: "t2", numero: "002", lote: "1", valorPago: 200, vendedor: "Maria", formaPagamento: "cartao_credito", pessoaId: "p2", entrou: true, horaEntrada: "23:00", pulseira: "camarote" },
    { id: "t3", numero: "003", lote: "2", valorPago: 150, vendedor: "João", formaPagamento: "dinheiro", pessoaId: "p3", entrou: false, horaEntrada: null, pulseira: null },
    { id: "t4", numero: "004", lote: "2", valorPago: 60, vendedor: "Maria", formaPagamento: "pix", pessoaId: "p4", entrou: true, horaEntrada: "22:45", pulseira: "menor" },
    { id: "t5", numero: "005", lote: "1", valorPago: 0, vendedor: "Admin", formaPagamento: "dinheiro", pessoaId: "p5", entrou: false, horaEntrada: null, pulseira: null },
  ]

  const products: Product[] = [
    { id: "prod1", nome: "Cerveja Lata", custo: 3, precoVenda: 10, estoqueInicial: 200, estoqueAtual: 180 },
    { id: "prod2", nome: "Vodka Absolut", custo: 40, precoVenda: 120, estoqueInicial: 30, estoqueAtual: 25 },
    { id: "prod3", nome: "Agua", custo: 0.5, precoVenda: 5, estoqueInicial: 100, estoqueAtual: 88 },
    { id: "prod4", nome: "Energetico", custo: 5, precoVenda: 18, estoqueInicial: 80, estoqueAtual: 65 },
    { id: "prod5", nome: "Whisky Jack", custo: 80, precoVenda: 250, estoqueInicial: 15, estoqueAtual: 12 },
  ]

  const barSales: BarSale[] = [
    { id: "s1", productId: "prod1", pessoaId: "p1", vendedor: "Roberto", quantidade: 3, valorTotal: 30, hora: "23:00" },
    { id: "s2", productId: "prod4", pessoaId: "p1", vendedor: "Carlos", quantidade: 1, valorTotal: 18, hora: "23:15" },
    { id: "s3", productId: "prod2", pessoaId: "p2", vendedor: "Roberto", quantidade: 1, valorTotal: 120, hora: "23:30" },
    { id: "s4", productId: "prod1", pessoaId: "p4", vendedor: "Felipe", quantidade: 2, valorTotal: 20, hora: "23:45" },
    { id: "s5", productId: "prod3", pessoaId: "p3", vendedor: "Carlos", quantidade: 2, valorTotal: 10, hora: "00:00" },
    { id: "s6", productId: "prod1", pessoaId: "p2", vendedor: "Felipe", quantidade: 4, valorTotal: 40, hora: "00:15" },
    { id: "s7", productId: "prod5", pessoaId: "p2", vendedor: "Roberto", quantidade: 1, valorTotal: 250, hora: "00:30" },
  ]

  const colaboradores: Colaborador[] = [
    { id: "col1", nome: "Roberto", cargo: "barman", telefone: "(11) 99999-0001", ativo: true },
    { id: "col2", nome: "Carlos", cargo: "barman", telefone: "(11) 99999-0002", ativo: true },
    { id: "col3", nome: "Felipe", cargo: "garcom", telefone: "(11) 99999-0003", ativo: true },
    { id: "col4", nome: "Marcos", cargo: "porteiro", telefone: "(11) 99999-0004", ativo: true },
    { id: "col5", nome: "Julia", cargo: "caixa", telefone: "(11) 99999-0005", ativo: true },
    { id: "col6", nome: "Amanda", cargo: "promoter", telefone: "(11) 99999-0006", ativo: true },
    { id: "col7", nome: "Rafael", cargo: "seguranca", telefone: "(11) 99999-0007", ativo: false },
  ]

  const camaroteTables: CamaroteTable[] = [
    { id: "cam1", nome: "Mesa 1", garcom: "Roberto", garrafas: ["Vodka Absolut", "Whisky Jack"], pessoaIds: ["p2"] },
    { id: "cam2", nome: "Mesa 2", garcom: "Carlos", garrafas: ["Vodka Absolut"], pessoaIds: ["p3"] },
  ]

  return { pessoas, tickets, products, barSales, camaroteTables, colaboradores, lotacaoMaxima: 500 }
}

export function EventDataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<EventData>(createDemoData)

  const addPessoa = useCallback((p: Omit<Person, "id" | "createdAt">) => {
    const id = generateId()
    setData(prev => ({
      ...prev,
      pessoas: [...prev.pessoas, { ...p, id, createdAt: new Date().toISOString() }]
    }))
    return id
  }, [])

  const updatePessoa = useCallback((id: string, p: Partial<Person>) => {
    setData(prev => ({
      ...prev,
      pessoas: prev.pessoas.map(x => x.id === id ? { ...x, ...p } : x)
    }))
  }, [])

  const removePessoa = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      pessoas: prev.pessoas.filter(x => x.id !== id)
    }))
  }, [])

  const addTicket = useCallback((t: Omit<Ticket, "id" | "entrou" | "horaEntrada" | "pulseira">) => {
    setData(prev => ({
      ...prev,
      tickets: [...prev.tickets, { ...t, id: generateId(), entrou: false, horaEntrada: null, pulseira: null }]
    }))
  }, [])

  const marcarEntrada = useCallback((ticketId: string, pulseira: WristbandColor) => {
    const now = new Date()
    const hora = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
    setData(prev => ({
      ...prev,
      tickets: prev.tickets.map(t => t.id === ticketId ? { ...t, entrou: true, horaEntrada: hora, pulseira } : t)
    }))
  }, [])

  const addProduct = useCallback((p: Omit<Product, "id" | "estoqueAtual">) => {
    setData(prev => ({
      ...prev,
      products: [...prev.products, { ...p, id: generateId(), estoqueAtual: p.estoqueInicial }]
    }))
  }, [])

  const updateProduct = useCallback((id: string, p: Partial<Product>) => {
    setData(prev => ({
      ...prev,
      products: prev.products.map(x => x.id === id ? { ...x, ...p } : x)
    }))
  }, [])

  const removeProduct = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      products: prev.products.filter(x => x.id !== id)
    }))
  }, [])

  const addBarSale = useCallback((s: Omit<BarSale, "id" | "hora" | "valorTotal">) => {
    setData(prev => {
      const product = prev.products.find(p => p.id === s.productId)
      if (!product || product.estoqueAtual < s.quantidade) return prev
      const now = new Date()
      const hora = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
      return {
        ...prev,
        products: prev.products.map(p =>
          p.id === s.productId ? { ...p, estoqueAtual: p.estoqueAtual - s.quantidade } : p
        ),
        barSales: [...prev.barSales, { ...s, id: generateId(), hora, valorTotal: product.precoVenda * s.quantidade, vendedor: s.vendedor }]
      }
    })
  }, [])

  const addColaborador = useCallback((c: Omit<Colaborador, "id">) => {
    setData(prev => ({
      ...prev,
      colaboradores: [...prev.colaboradores, { ...c, id: generateId() }]
    }))
  }, [])

  const updateColaborador = useCallback((id: string, c: Partial<Colaborador>) => {
    setData(prev => ({
      ...prev,
      colaboradores: prev.colaboradores.map(x => x.id === id ? { ...x, ...c } : x)
    }))
  }, [])

  const removeColaborador = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      colaboradores: prev.colaboradores.filter(x => x.id !== id)
    }))
  }, [])

  const addCamaroteTable = useCallback((t: Omit<CamaroteTable, "id" | "pessoaIds" | "garrafas">) => {
    setData(prev => ({
      ...prev,
      camaroteTables: [...prev.camaroteTables, { ...t, id: generateId(), pessoaIds: [], garrafas: [] }]
    }))
  }, [])

  const updateCamaroteTable = useCallback((id: string, t: Partial<CamaroteTable>) => {
    setData(prev => ({
      ...prev,
      camaroteTables: prev.camaroteTables.map(x => x.id === id ? { ...x, ...t } : x)
    }))
  }, [])

  const addGarrafaToCamarote = useCallback((tableId: string, garrafa: string) => {
    setData(prev => ({
      ...prev,
      camaroteTables: prev.camaroteTables.map(t =>
        t.id === tableId ? { ...t, garrafas: [...t.garrafas, garrafa] } : t
      )
    }))
  }, [])

  const addPessoaToCamarote = useCallback((tableId: string, pessoaId: string) => {
    setData(prev => ({
      ...prev,
      camaroteTables: prev.camaroteTables.map(t =>
        t.id === tableId ? { ...t, pessoaIds: [...t.pessoaIds, pessoaId] } : t
      )
    }))
  }, [])

  const removePessoaFromCamarote = useCallback((tableId: string, pessoaId: string) => {
    setData(prev => ({
      ...prev,
      camaroteTables: prev.camaroteTables.map(t =>
        t.id === tableId ? { ...t, pessoaIds: t.pessoaIds.filter(id => id !== pessoaId) } : t
      )
    }))
  }, [])

  const setLotacaoMaxima = useCallback((n: number) => {
    setData(prev => ({ ...prev, lotacaoMaxima: n }))
  }, [])

  const pessoasDentro = data.tickets.filter(t => t.entrou).length

  return (
    <EventContext.Provider value={{
      ...data,
      addPessoa,
      updatePessoa,
      removePessoa,
      addTicket,
      marcarEntrada,
      addProduct,
      updateProduct,
      removeProduct,
      addBarSale,
      addColaborador,
      updateColaborador,
      removeColaborador,
      addCamaroteTable,
      updateCamaroteTable,
      addGarrafaToCamarote,
      addPessoaToCamarote,
      removePessoaFromCamarote,
      setLotacaoMaxima,
      pessoasDentro,
    }}>
      {children}
    </EventContext.Provider>
  )
}
