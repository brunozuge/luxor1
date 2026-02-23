"use client"

import { useState } from "react"
import { EventDataProvider } from "@/lib/event-data"
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

const sectionTitles: Record<string, string> = {
  dashboard: "Dashboard",
  pessoas: "Pessoas",
  ingressos: "Ingressos",
  portaria: "Portaria",
  bar: "Bar",
  camarote: "Camarote / VIP",
  colaboradores: "Colaboradores",
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
      <SidebarProvider>
        <AppSidebar activeSection={activeSection} onNavigate={setActiveSection} />
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-sm">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-6" />
            <h2 className="text-sm font-semibold">{sectionTitles[activeSection]}</h2>
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
