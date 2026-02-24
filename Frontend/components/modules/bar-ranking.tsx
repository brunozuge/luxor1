"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useEventData } from "@/lib/event-data"
import { motion, AnimatePresence } from "framer-motion"
import {
  Crown,
  TrendingUp,
  TrendingDown,
  Trophy,
  Medal,
  Star,
  Flame,
  Wine,
  Users,
  DollarSign,
  Zap,
} from "lucide-react"

interface RankedPerson {
  pessoaId: string
  nome: string
  total: number
  purchases: number
  position: number
  previousPosition: number | null
}

export function BarRanking() {
  const { barSales, pessoas } = useEventData()
  const [previousRanking, setPreviousRanking] = useState<Map<string, number>>(new Map())
  const isFirstRender = useRef(true)

  const ranking: RankedPerson[] = useMemo(() => {
    const spendingByPerson = barSales.reduce<Record<string, { total: number; purchases: number }>>((acc, s) => {
      if (!acc[s.pessoaId]) acc[s.pessoaId] = { total: 0, purchases: 0 }
      acc[s.pessoaId].total += s.valorTotal
      acc[s.pessoaId].purchases += 1
      return acc
    }, {})

    return Object.entries(spendingByPerson)
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([pessoaId, data], i) => {
        const pessoa = pessoas.find((p) => p.id === pessoaId)
        return {
          pessoaId,
          nome: pessoa?.nome || "Desconhecido",
          total: data.total,
          purchases: data.purchases,
          position: i + 1,
          previousPosition: previousRanking.get(pessoaId) ?? null,
        }
      })
  }, [barSales, pessoas, previousRanking])

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      const initial = new Map<string, number>()
      ranking.forEach((r) => initial.set(r.pessoaId, r.position))
      setPreviousRanking(initial)
      return
    }

    const timer = setTimeout(() => {
      const newMap = new Map<string, number>()
      ranking.forEach((r) => newMap.set(r.pessoaId, r.position))
      setPreviousRanking(newMap)
    }, 2000)

    return () => clearTimeout(timer)
  }, [ranking])

  const maxSpend = ranking.length > 0 ? ranking[0].total : 1
  const top3 = ranking.slice(0, 3)
  const rest = ranking.slice(3)

  const totalSpent = ranking.reduce((s, r) => s + r.total, 0)
  const totalPurchases = ranking.reduce((s, r) => s + r.purchases, 0)

  function getPositionChange(person: RankedPerson) {
    if (person.previousPosition === null) return "new"
    if (person.previousPosition < person.position) return "down"
    if (person.previousPosition > person.position) return "up"
    return "same"
  }

  if (ranking.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary/50 mb-4">
          <Wine className="h-10 w-10 opacity-40" />
        </div>
        <p className="text-base font-medium">Nenhuma venda registrada</p>
        <p className="text-sm mt-1 opacity-60">O ranking aparece quando houver vendas no bar</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Stats Header */}
      <StatsHeader
        totalParticipants={ranking.length}
        totalSpent={totalSpent}
        totalPurchases={totalPurchases}
      />

      {/* Podium */}
      {top3.length > 0 && (
        <Podium top3={top3} maxSpend={maxSpend} getPositionChange={getPositionChange} />
      )}

      {/* Divider */}
      {rest.length > 0 && (
        <div className="flex items-center gap-3 px-2">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
            Demais posicoes
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
      )}

      {/* List */}
      {rest.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <AnimatePresence mode="popLayout">
            {rest.map((person, i) => (
              <RankingRow
                key={person.pessoaId}
                person={person}
                maxSpend={maxSpend}
                change={getPositionChange(person)}
                index={i}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

/* ============================
   Stats Header
   ============================ */

function StatsHeader({
  totalParticipants,
  totalSpent,
  totalPurchases,
}: {
  totalParticipants: number
  totalSpent: number
  totalPurchases: number
}) {
  const stats = [
    {
      icon: <Users className="h-4 w-4" />,
      label: "Participantes",
      value: totalParticipants.toString(),
    },
    {
      icon: <DollarSign className="h-4 w-4" />,
      label: "Total gasto",
      value: `R$ ${totalSpent.toLocaleString("pt-BR")}`,
    },
    {
      icon: <Zap className="h-4 w-4" />,
      label: "Compras",
      value: totalPurchases.toString(),
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map((stat) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-1 rounded-xl bg-secondary/50 px-3 py-3 border border-border/50"
        >
          <div className="flex items-center gap-1.5 text-muted-foreground">
            {stat.icon}
            <span className="text-[10px] font-medium uppercase tracking-wider">{stat.label}</span>
          </div>
          <span className="text-sm font-bold tabular-nums">{stat.value}</span>
        </motion.div>
      ))}
    </div>
  )
}

/* ============================
   Podium
   ============================ */

function Podium({
  top3,
  maxSpend,
  getPositionChange,
}: {
  top3: RankedPerson[]
  maxSpend: number
  getPositionChange: (p: RankedPerson) => string
}) {
  // Display order: 2nd, 1st, 3rd
  const displayOrder = [
    top3.length > 1 ? { person: top3[1], rank: 2 as const } : null,
    { person: top3[0], rank: 1 as const },
    top3.length > 2 ? { person: top3[2], rank: 3 as const } : null,
  ].filter(Boolean) as { person: RankedPerson; rank: 1 | 2 | 3 }[]

  return (
    <div className="relative pt-6 pb-2">
      {/* Background glow for 1st place */}
      <div className="absolute inset-0 flex items-start justify-center pointer-events-none overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="w-48 h-48 rounded-full bg-accent/8 blur-[60px] mt-8"
        />
      </div>

      <div className="relative flex items-end justify-center gap-2 sm:gap-4">
        {displayOrder.map((item) => (
          <PodiumColumn
            key={item.person.pessoaId}
            person={item.person}
            rank={item.rank}
            maxSpend={maxSpend}
            change={getPositionChange(item.person)}
          />
        ))}
      </div>

      {/* Podium base line */}
      <div className="mt-4 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
    </div>
  )
}

/* ============================
   Podium Column
   ============================ */

const RANK_CONFIG = {
  1: {
    pillarHeight: "h-40 sm:h-52",
    avatarSize: "h-14 w-14 sm:h-16 sm:w-16",
    avatarBg: "bg-accent/15 border-accent/40",
    avatarText: "text-accent",
    nameClass: "text-accent font-extrabold",
    accentColor: "accent",
    icon: Crown,
    iconSize: "h-7 w-7 sm:h-8 sm:w-8",
    iconColor: "text-accent",
    badgeBg: "bg-accent text-accent-foreground",
    barColor: "bg-accent",
    delay: 0,
    columnWidth: "w-[7.5rem] sm:w-[9rem]",
    glowShadow: "shadow-[0_0_40px_-8px_hsl(42_80%_52%/0.35)]",
    borderColor: "border-accent/25",
    pillarGradient: "from-accent/12 via-accent/4 to-transparent",
  },
  2: {
    pillarHeight: "h-32 sm:h-40",
    avatarSize: "h-11 w-11 sm:h-13 sm:w-13",
    avatarBg: "bg-secondary border-muted-foreground/30",
    avatarText: "text-muted-foreground",
    nameClass: "text-foreground font-bold",
    accentColor: "muted-foreground",
    icon: Medal,
    iconSize: "h-5 w-5 sm:h-6 sm:w-6",
    iconColor: "text-muted-foreground",
    badgeBg: "bg-secondary text-muted-foreground",
    barColor: "bg-muted-foreground/60",
    delay: 0.15,
    columnWidth: "w-[6.5rem] sm:w-[8rem]",
    glowShadow: "",
    borderColor: "border-border",
    pillarGradient: "from-muted-foreground/8 via-muted-foreground/3 to-transparent",
  },
  3: {
    pillarHeight: "h-24 sm:h-32",
    avatarSize: "h-10 w-10 sm:h-12 sm:w-12",
    avatarBg: "bg-secondary border-warning/30",
    avatarText: "text-warning/80",
    nameClass: "text-foreground font-bold",
    accentColor: "warning",
    icon: Trophy,
    iconSize: "h-5 w-5 sm:h-6 sm:w-6",
    iconColor: "text-warning/70",
    badgeBg: "bg-secondary text-warning/80",
    barColor: "bg-warning/50",
    delay: 0.3,
    columnWidth: "w-[6rem] sm:w-[7.5rem]",
    glowShadow: "",
    borderColor: "border-border",
    pillarGradient: "from-warning/8 via-warning/3 to-transparent",
  },
}

function PodiumColumn({
  person,
  rank,
  maxSpend,
  change,
}: {
  person: RankedPerson
  rank: 1 | 2 | 3
  maxSpend: number
  change: string
}) {
  const config = RANK_CONFIG[rank]
  const Icon = config.icon
  const initials = person.nome
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 60, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: config.delay,
        duration: 0.6,
        type: "spring",
        stiffness: 80,
        damping: 14,
      }}
      className={`relative flex flex-col items-center ${config.columnWidth} ${rank === 1 ? "z-10" : "z-0"}`}
    >
      {/* Floating icon */}
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: config.delay + 0.3, type: "spring", stiffness: 180 }}
        className="mb-1.5"
      >
        <Icon className={`${config.iconSize} ${config.iconColor}`} />
      </motion.div>

      {/* Change indicator floating */}
      <AnimatePresence>
        {change !== "same" && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="absolute top-0 -right-0.5 z-20"
          >
            <ChangeIndicator change={change} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: config.delay + 0.15, type: "spring", stiffness: 150 }}
        className={`
          mb-2.5 flex items-center justify-center rounded-full border-2
          ${config.avatarSize} ${config.avatarBg}
          text-sm sm:text-base font-bold ${config.avatarText}
        `}
      >
        {initials}
      </motion.div>

      {/* Pillar */}
      <div
        className={`
          w-full ${config.pillarHeight} rounded-t-2xl border ${config.borderColor}
          border-b-0
          bg-gradient-to-t ${config.pillarGradient}
          ${config.glowShadow}
          flex flex-col items-center justify-center px-2.5 sm:px-3
          relative overflow-hidden
        `}
      >
        {/* Subtle shine line */}
        {rank === 1 && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: "200%", opacity: [0, 0.5, 0] }}
            transition={{ delay: 1.2, duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-accent/20 to-transparent pointer-events-none"
          />
        )}

        {/* Name */}
        <p className={`text-xs sm:text-sm text-center leading-tight truncate w-full ${config.nameClass}`}>
          {person.nome.split(" ")[0]}
        </p>
        {person.nome.split(" ").length > 1 && (
          <p className="text-[10px] sm:text-xs text-muted-foreground truncate w-full text-center mt-0.5">
            {person.nome.split(" ").slice(1).join(" ")}
          </p>
        )}

        {/* Amount */}
        <motion.p
          key={person.total}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4 }}
          className={`mt-2 text-base sm:text-xl font-extrabold tabular-nums ${rank === 1 ? "text-accent" : "text-foreground"}`}
        >
          R$ {person.total.toLocaleString("pt-BR")}
        </motion.p>

        {/* Purchases count */}
        <div className="mt-1.5 flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
          <Flame className="h-3 w-3 text-primary" />
          <span>{person.purchases} {person.purchases === 1 ? "compra" : "compras"}</span>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-secondary/60">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(person.total / maxSpend) * 100}%` }}
            transition={{ delay: config.delay + 0.6, duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full ${config.barColor}`}
          />
        </div>
      </div>

      {/* Rank badge at base */}
      <div
        className={`
          -mt-px w-full flex items-center justify-center py-2
          rounded-b-xl border ${config.borderColor} border-t-0
          ${rank === 1 ? "bg-accent/10" : "bg-secondary/50"}
        `}
      >
        <span className={`text-xs font-bold ${rank === 1 ? "text-accent" : "text-muted-foreground"}`}>
          {rank === 1 ? "1o Lugar" : rank === 2 ? "2o Lugar" : "3o Lugar"}
        </span>
      </div>
    </motion.div>
  )
}

/* ============================
   Ranking Row (4th+)
   ============================ */

function RankingRow({
  person,
  maxSpend,
  change,
  index,
}: {
  person: RankedPerson
  maxSpend: number
  change: string
  index: number
}) {
  const barWidth = (person.total / maxSpend) * 100
  const initial = person.nome[0]?.toUpperCase() || "?"

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 25,
        delay: index * 0.04,
      }}
      className="group relative flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-secondary/40 transition-colors duration-200"
    >
      {/* Position number */}
      <div className="flex items-center gap-1 w-8 shrink-0 justify-center">
        <motion.span
          key={person.position}
          initial={{ scale: 1.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-sm font-bold text-muted-foreground tabular-nums"
        >
          {person.position}
        </motion.span>
      </div>

      {/* Avatar */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary border border-border text-xs font-bold text-muted-foreground">
        {initial}
      </div>

      {/* Name, purchases, bar */}
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold truncate">{person.nome}</span>
          <ChangeIndicator change={change} small />
          <span className="ml-auto text-[10px] text-muted-foreground whitespace-nowrap">
            {person.purchases} {person.purchases === 1 ? "compra" : "compras"}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary/60">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${barWidth}%` }}
            transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.04 }}
            className="h-full rounded-full bg-primary/60"
          />
        </div>
      </div>

      {/* Total */}
      <motion.span
        key={person.total}
        initial={{ scale: 1.15 }}
        animate={{ scale: 1 }}
        className="text-sm font-bold tabular-nums whitespace-nowrap shrink-0 ml-2"
      >
        R$ {person.total.toLocaleString("pt-BR")}
      </motion.span>
    </motion.div>
  )
}

/* ============================
   Position Change Indicator
   ============================ */

function ChangeIndicator({ change, small = false }: { change: string; small?: boolean }) {
  const size = small ? "h-3 w-3" : "h-3.5 w-3.5"

  if (change === "up") {
    return (
      <motion.div
        initial={{ y: 4, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center"
      >
        <TrendingUp className={`${size} text-success`} />
      </motion.div>
    )
  }
  if (change === "down") {
    return (
      <motion.div
        initial={{ y: -4, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center"
      >
        <TrendingDown className={`${size} text-destructive`} />
      </motion.div>
    )
  }
  if (change === "new") {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="flex items-center"
      >
        <Star className={`${size} text-accent fill-accent`} />
      </motion.div>
    )
  }
  return null
}
