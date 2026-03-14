"use client"

import { useState, useEffect } from "react"
import { EventDataProvider, useEventData, type EventData } from "@/lib/event-data"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { DashboardModule } from "@/components/modules/dashboard"
import { PessoasModule } from "@/components/modules/pessoas"
import { IngressosModule } from "@/components/modules/ingressos"
import { PortariaModule } from "@/components/modules/portaria"
import { BarModule } from "@/components/modules/bar"
import { CamaroteModule } from "@/components/modules/camarote"
import { ColaboradoresModule } from "@/components/modules/colaboradores"
import { ListaModule } from "@/components/modules/lista"
import { Login } from "@/components/login"
import { Loader2 } from "lucide-react"
import { FullScreenOverlays } from "@/components/full-screen-overlays"

const sectionTitles: Record<string, string> = {
  dashboard: "Dashboard",
  festas: "Minhas Festas",
  eventpro: "Eventos - Geral",
  pessoas: "Pessoas",
  lista: "Lista",
  ingressos: "Ingressos",
  portaria: "Portaria",
  bar: "Bar",
  camarote: "Camarote / VIP",
  colaboradores: "Colaboradores",
}

function DataFetcher({ activeSection }: { activeSection: string }) {
  const { fetchData, fetchedModules, selectedEventId, setFetchedModules } = useEventData()

  useEffect(() => {
    const sectionModules: Record<string, (keyof EventData)[]> = {
      dashboard: ["pessoas", "tickets", "products", "barSales", "colaboradores", "camaroteTables", "listas"],
      pessoas: ["pessoas"],
      lista: ["listas"],
      ingressos: ["tickets", "pessoas", "colaboradores"],
      portaria: ["tickets", "pessoas"],
      bar: ["barSales", "products", "colaboradores"],
      camarote: ["camaroteTables", "pessoas"],
      colaboradores: ["colaboradores"],
    }

    const modules = sectionModules[activeSection] || []

    if (modules.length > 0) {
      const missing = modules.filter(m => !fetchedModules.has(m))
      if (missing.length > 0) {
        fetchData(false, missing as any)
      }
    }
  }, [activeSection, fetchData, selectedEventId, fetchedModules])

  return null
}

function InnerContent({
  activeSection,
  setActiveSection
}: {
  activeSection: string,
  setActiveSection: (s: string) => void
}) {
  const { overlay, setOverlay, selectedEventId, mounted } = useEventData()
  const [initialized, setInitialized] = useState(false)

  // Decisão inicial de rota
  useEffect(() => {
    if (mounted && !initialized) {
      const savedId = localStorage.getItem("selected_evento_id")
      if (savedId) {
        setActiveSection("dashboard")
        setOverlay("none")
      } else {
        setActiveSection("eventpro")
        setOverlay("eventpro")
      }
      setInitialized(true)
    }
  }, [mounted, initialized, setActiveSection, setOverlay])

  // Sincroniza a seção ativa se o overlay mudar por fora
  useEffect(() => {
    if (overlay !== "none" && overlay !== activeSection) {
      setActiveSection(overlay)
    }
  }, [overlay, activeSection, setActiveSection])

  if (!initialized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0d0d0d]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <SidebarProvider>
      <DataFetcher activeSection={activeSection} />
      <AppSidebar activeSection={activeSection} onNavigate={setActiveSection} />
      <SidebarInset className="min-w-0 overflow-hidden">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-sm">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
          <h2 className="text-sm font-semibold ml-auto">{sectionTitles[activeSection]}</h2>
        </header>
        <div className="flex-1 min-w-0 p-4 md:p-6 pb-20 md:pb-6 overflow-x-hidden max-w-full">
          {(activeSection === "festas" || activeSection === "eventpro") && <FullScreenOverlays onNavigate={setActiveSection} />}
          {activeSection === "dashboard" && <DashboardModule />}
          {activeSection === "pessoas" && <PessoasModule />}
          {activeSection === "lista" && <ListaModule />}
          {activeSection === "ingressos" && <IngressosModule />}
          {activeSection === "portaria" && <PortariaModule />}
          {activeSection === "bar" && <BarModule />}
          {activeSection === "camarote" && <CamaroteModule />}
          {activeSection === "colaboradores" && <ColaboradoresModule />}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function AppContent() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0d0d0d]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) return <Login />

  return (
    <EventDataProvider>
      <InnerContentWrapper />
    </EventDataProvider>
  )
}

function InnerContentWrapper() {
  const [activeSection, setActiveSection] = useState("dashboard")
  return <InnerContent activeSection={activeSection} setActiveSection={setActiveSection} />
}

export default function Page() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
