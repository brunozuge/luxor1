"use client"

import { useState } from "react"
import { EventDataProvider } from "@/lib/event-data"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { DashboardModule } from "@/components/modules/dashboard"
import { PessoasModule } from "@/components/modules/pessoas"
import { IngressosModule } from "@/components/modules/ingressos"
import { PortariaModule } from "@/components/modules/portaria"
import { BarModule } from "@/components/modules/bar"
import { CamaroteModule } from "@/components/modules/camarote"

const sectionTitles: Record<string, string> = {
  dashboard: "Dashboard",
  pessoas: "Pessoas",
  ingressos: "Ingressos",
  portaria: "Portaria",
  bar: "Bar",
  camarote: "Camarote / VIP",
}

function AppContent() {
  const [activeSection, setActiveSection] = useState("dashboard")

  return (
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
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function Page() {
  return (
    <EventDataProvider>
      <AppContent />
    </EventDataProvider>
  )
}
