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
import { Login } from "@/components/login"
import { Loader2 } from "lucide-react"
import { EventSwitcher } from "@/components/event-switcher"

const sectionTitles: Record<string, string> = {
  dashboard: "Dashboard",
  pessoas: "Pessoas",
  ingressos: "Ingressos",
  portaria: "Portaria",
  bar: "Bar",
  camarote: "Camarote / VIP",
  colaboradores: "Colaboradores",
}

function DataFetcher({ activeSection }: { activeSection: string }) {
  const { fetchData, fetchedModules } = useEventData()

  // biome-ignore lint/correctness/useExhaustiveDependencies: Only trigger on section change
  useEffect(() => {
    const sectionModules: Record<string, any[]> = {
      dashboard: ["pessoas", "tickets", "products", "barSales", "colaboradores", "camaroteTables"],
      pessoas: ["pessoas"],
      ingressos: ["ingressos", "pessoas", "colaboradores"],
      portaria: ["ingressos", "pessoas"],
      bar: ["barSales", "products", "colaboradores"],
      camarote: ["camaroteTables", "pessoas"],
      colaboradores: ["colaboradores"],
    }

    const modules = sectionModules[activeSection] || []
    // @ts-ignore
    const needsLoading = modules.some(m => !fetchedModules.has(m))

    fetchData(!needsLoading, modules as any)
  }, [activeSection, fetchData])

  return null
}

function AppContent() {
  const [activeSection, setActiveSection] = useState("dashboard")
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
      <DataFetcher activeSection={activeSection} />
      <SidebarProvider>
        <AppSidebar activeSection={activeSection} onNavigate={setActiveSection} />
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-sm">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-6" />
            <EventSwitcher />
            <Separator orientation="vertical" className="h-6 ml-auto md:hidden" />
            <h2 className="text-sm font-semibold ml-auto hidden md:block">{sectionTitles[activeSection]}</h2>
          </header>
          <div className="flex-1 p-4 md:p-6">
            {activeSection === "dashboard" && <DashboardModule />}
            {activeSection === "pessoas" && <PessoasModule />}
            {activeSection === "ingressos" && <IngressosModule />}
            {activeSection === "portaria" && <PortariaModule />}
            {activeSection === "bar" && <BarModule />}
            {activeSection === "camarote" && <CamaroteModule />}
            {activeSection === "colaboradores" && <ColaboradoresModule />}
          </div>
        </SidebarInset>
      </SidebarProvider>
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
