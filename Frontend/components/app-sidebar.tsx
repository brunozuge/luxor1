"use client"

import {
  Users,
  Ticket,
  DoorOpen,
  Wine,
  Crown,
  LayoutDashboard,
  UserCog,
  User,
  LogOut,
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
  SidebarFooter,
} from "@/components/ui/sidebar"
import { useEventData } from "@/lib/event-data"
import { useAuth } from "@/lib/auth-context"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { useState } from "react"

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
  const { user, logout } = useAuth()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
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
                  className={`h-full rounded-full transition-all ${isNearCapacity ? "bg-destructive" : "bg-primary"
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
      <SidebarSeparator />
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 px-2 py-1.5 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <User className="h-4 w-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium leading-none truncate text-sidebar-foreground">
              {user?.name || "Usuário"}
            </span>
            <span className="text-xs leading-none truncate text-muted-foreground mt-1">
              {user?.email || "admin@eventpro.com"}
            </span>
          </div>
        </div>
        <SidebarMenu className="mt-2">
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setShowLogoutConfirm(true)}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair do Sistema</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <ConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        onConfirm={logout}
        title="Sair do Sistema"
        description="Deseja realmente sair do sistema?"
        confirmText="Sair"
        variant="destructive"
      />
    </Sidebar>
  )
}
