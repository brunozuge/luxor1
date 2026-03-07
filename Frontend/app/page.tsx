"use client"

import { useState, useEffect } from "react"
import { EventDataProvider, useEventData } from "@/lib/event-data"
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
import { EventSwitcher } from "@/components/event-switcher"
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
  const { fetchData, fetchedModules, selectedEventId } = useEventData()

  // biome-ignore lint/correctness/useExhaustiveDependencies: Only trigger on section change or event change
  useEffect(() => {
    const sectionModules: Record<string, any[]> = {
      dashboard: ["pessoas", "tickets", "products", "barSales", "colaboradores", "camaroteTables"],
      pessoas: ["pessoas"],
      lista: ["listas"],
      ingressos: ["tickets", "pessoas", "colaboradores"],
      portaria: ["tickets", "pessoas"],
      bar: ["barSales", "products", "colaboradores"],
      camarote: ["camaroteTables", "pessoas"],
      colaboradores: ["colaboradores"],
    }

    const modules = sectionModules[activeSection] || []
    // @ts-ignore
    const needsLoading = modules.some(m => !fetchedModules.has(m))

    fetchData(!needsLoading, modules as any)
  }, [activeSection, fetchData, selectedEventId])

  return null
}

function InnerContent({ activeSection, setActiveSection }: { activeSection: string, setActiveSection: (s: string) => void }) {
  const { overlay, setOverlay } = useEventData()

  // Sincroniza a seção ativa se o overlay mudar por fora (ex: EventSwitcher)
  useEffect(() => {
    if (overlay !== "none" && overlay !== activeSection) {
      setActiveSection(overlay)
    }
  }, [overlay, activeSection])

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
  const [activeSection, setActiveSection] = useState("eventpro")
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0d0d0d]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login />
  }

  return (
    <EventDataProvider>
      <InnerContent activeSection={activeSection} setActiveSection={setActiveSection} />
    </EventDataProvider>
  )
}

export default function Page() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
