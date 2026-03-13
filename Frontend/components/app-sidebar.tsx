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
  ChevronDown,
  Plus,
  Calendar,
  ListTodo,
  LayoutGrid,
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
  useSidebar,
} from "@/components/ui/sidebar"
import { useEventData } from "@/lib/event-data"
import { useAuth } from "@/lib/auth-context"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { useState } from "react"
import { CreateEventModal } from "@/components/create-event-modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

const navItems = [
  { title: "Dashboard", icon: LayoutDashboard, id: "dashboard" },
  { title: "Minhas Festas", icon: Calendar, id: "festas" },
  { title: "Eventos - Geral", icon: LayoutGrid, id: "eventpro" },
  { title: "Pessoas", icon: Users, id: "pessoas" },
  { title: "Lista", icon: ListTodo, id: "lista" },
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
  const { pessoasDentro, lotacaoMaxima, eventos, selectedEventId, setSelectedEventId, currentEvento, isInitialLoad, setOverlay, overlay } = useEventData()
  const { user, logout } = useAuth()
  const { setOpenMobile } = useSidebar()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const handleNavigate = (id: string) => {
    if (id === "festas" || id === "eventpro") {
      setOverlay(id as any)
    } else {
      setOverlay("none")
    }
    onNavigate(id)
    setOpenMobile(false)
  }

  const handleEventSelect = (id: string) => {
    setSelectedEventId(id)
    setOpenMobile(false)
  }

  const handleExitParty = () => {
    setSelectedEventId(null)
    setOverlay("festas")
    onNavigate("festas")
  }

  const percentage = Math.round((pessoasDentro / lotacaoMaxima) * 100)
  const isNearCapacity = percentage >= 80


  const hasEventSelected = selectedEventId && selectedEventId !== "null" && selectedEventId !== "undefined";

  const filteredNavItems = navItems.filter(item => {
    if (item.id === "festas" || item.id === "eventpro") {
      return !hasEventSelected
    }
    if (item.id === "dashboard") {
      return hasEventSelected
    }
    return true
  })

  if (isInitialLoad && eventos.length === 0) {
    return (
      <Sidebar>
        <SidebarHeader className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-muted animate-pulse" />
            <div className="flex flex-col gap-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-3 w-16 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="size-4 rounded bg-muted animate-pulse" />
                <div className="h-4 w-full bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </SidebarContent>
        <SidebarFooter className="p-4">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-muted animate-pulse" />
            <div className="flex flex-col gap-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
              <div className="h-3 w-32 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
    )
  }

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Crown className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none overflow-hidden">
                <span className="font-semibold truncate">
                  {(overlay === "eventpro" || overlay === "festas") ? "Geral" : (currentEvento?.nome || "Selecione o Evento")}
                </span>
                <span className="text-xs text-muted-foreground truncate">EventPro • Gerenciar</span>
              </div>
              <ChevronDown className="ml-auto size-4 opacity-50" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg p-2 space-y-1" align="start" side="bottom" sideOffset={4}>
            {hasEventSelected && (
              <>
                <DropdownMenuItem
                  className="flex items-center gap-3 p-3 cursor-pointer rounded-lg hover:bg-destructive/10 focus:bg-destructive/10"
                  onClick={handleExitParty}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                    <LogOut className="size-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-destructive">Sair da Produção</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Limpar Seleção</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            <DropdownMenuItem
              className="flex items-center gap-3 p-3 cursor-pointer rounded-lg hover:bg-red-50 focus:bg-red-50"
              onClick={() => {
                handleNavigate("festas")
              }}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600/10 text-red-600">
                <Calendar className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm">Festas</span>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Trocar ou Criar</span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem
              className="flex items-center gap-3 p-3 cursor-pointer rounded-lg hover:bg-red-50 focus:bg-red-50"
              onClick={() => {
                handleNavigate("eventpro")
              }}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600/10 text-red-600">
                <Crown className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm">Eventos - Geral</span>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Visão Consolidada</span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 cursor-pointer p-3" onClick={() => setShowCreateModal(true)}>
              <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                <Plus className="size-4" />
              </div>
              <div className="font-medium text-sm">Nova Produção</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Modulos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeSection === item.id}
                    onClick={() => handleNavigate(item.id)}
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
        onConfirm={async () => {
          setShowLogoutConfirm(false)
          await logout()
        }}
        title="Sair do Sistema"
        description="Deseja realmente sair do sistema?"
        confirmText="Sair"
        variant="destructive"
      />

      <CreateEventModal open={showCreateModal} onOpenChange={setShowCreateModal} />
    </Sidebar>
  )
}
