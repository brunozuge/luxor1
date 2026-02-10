"use client"

import {
  Users,
  Ticket,
  DoorOpen,
  Wine,
  Crown,
  LayoutDashboard,
  UserCog,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { useEventData } from "@/lib/event-data"

const navItems = [
  { title: "Dashboard", icon: LayoutDashboard, id: "dashboard" },
  { title: "Pessoas", icon: Users, id: "pessoas" },
  { title: "Ingressos", icon: Ticket, id: "ingressos" },
  { title: "Portaria", icon: DoorOpen, id: "portaria" },
  { title: "Bar", icon: Wine, id: "bar" },
  { title: "Camarote / VIP", icon: Crown, id: "camarote" },
  { title: "Colaboradores", icon: UserCog, id: "colaboradores" },
]

interface AppSidebarProps {
  activeSection: string
  onNavigate: (section: string) => void
}

export function AppSidebar({ activeSection, onNavigate }: AppSidebarProps) {
  const { pessoasDentro, lotacaoMaxima } = useEventData()
  const percentage = Math.round((pessoasDentro / lotacaoMaxima) * 100)
  const isNearCapacity = percentage >= 80

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Crown className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-sidebar-foreground">EventPro</h2>
            <p className="text-xs text-muted-foreground">Gestao de Eventos</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Modulos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeSection === item.id}
                    onClick={() => onNavigate(item.id)}
                    tooltip={item.title}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>Lotacao</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold tabular-nums text-sidebar-foreground">
                  {pessoasDentro}
                </span>
                <span className="text-xs text-muted-foreground">
                  / {lotacaoMaxima}
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={`h-full rounded-full transition-all ${
                    isNearCapacity ? "bg-destructive" : "bg-primary"
                  }`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              <p className={`mt-1 text-xs ${isNearCapacity ? "text-destructive" : "text-muted-foreground"}`}>
                {percentage}% da capacidade
              </p>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
