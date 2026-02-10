"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useEventData } from "@/lib/event-data"
import { motion, AnimatePresence } from "framer-motion"
import { Crown, TrendingUp, TrendingDown, Minus, Trophy, Medal, Star, Flame, Wine } from "lucide-react"

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

  function getPositionChange(person: RankedPerson) {
    if (person.previousPosition === null) return "new"
    if (person.previousPosition < person.position) return "down"
    if (person.previousPosition > person.position) return "up"
    return "same"
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Podium for Top 3 */}
      {top3.length > 0 && (
        <div className="relative">
          {/* Glow background */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 rounded-full bg-accent/10 blur-[80px]" />
          </div>

          <div className="flex items-end justify-center gap-3 sm:gap-6 pt-8 pb-4">
            {/* 2nd Place */}
            {top3.length > 1 && (
              <PodiumCard
                person={top3[1]}
                maxSpend={maxSpend}
                rank={2}
                delay={0.2}
                height="h-36 sm:h-44"
                getPositionChange={getPositionChange}
              />
            )}
            {/* 1st Place */}
            {top3.length > 0 && (
              <PodiumCard
                person={top3[0]}
                maxSpend={maxSpend}
                rank={1}
                delay={0}
                height="h-44 sm:h-56"
                getPositionChange={getPositionChange}
              />
            )}
            {/* 3rd Place */}
            {top3.length > 2 && (
              <PodiumCard
                person={top3[2]}
                maxSpend={maxSpend}
                rank={3}
                delay={0.4}
                height="h-28 sm:h-36"
                getPositionChange={getPositionChange}
              />
            )}
          </div>
        </div>
      )}

      {/* Rest of the ranking */}
      {rest.length > 0 && (
        <div className="flex flex-col gap-1">
          <div className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <span className="text-center">#</span>
            <span>Pessoa</span>
            <span className="text-right">Total</span>
          </div>

          <AnimatePresence mode="popLayout">
            {rest.map((person) => (
              <RankingRow
                key={person.pessoaId}
                person={person}
                maxSpend={maxSpend}
                change={getPositionChange(person)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {ranking.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Wine className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm">Nenhuma venda registrada ainda</p>
        </div>
      )}
    </div>
  )
}

// --- Podium Card ---

function PodiumCard({
  person,
  maxSpend,
  rank,
  delay,
  height,
  getPositionChange,
}: {
  person: RankedPerson
  maxSpend: number
  rank: 1 | 2 | 3
  delay: number
  height: string
  getPositionChange: (p: RankedPerson) => string
}) {
  const change = getPositionChange(person)

  const rankStyles = {
    1: {
      gradient: "from-accent/30 via-accent/10 to-transparent",
      border: "border-accent/50",
      glow: "shadow-[0_0_30px_rgba(200,160,60,0.3)]",
      icon: <Crown className="h-6 w-6 sm:h-8 sm:w-8 text-accent" />,
      nameClass: "text-accent font-extrabold",
      ring: "ring-2 ring-accent/40",
    },
    2: {
      gradient: "from-muted-foreground/20 via-muted-foreground/5 to-transparent",
      border: "border-muted-foreground/30",
      glow: "",
      icon: <Medal className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />,
      nameClass: "text-foreground font-bold",
      ring: "",
    },
    3: {
      gradient: "from-warning/20 via-warning/5 to-transparent",
      border: "border-warning/30",
      glow: "",
      icon: <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-warning/70" />,
      nameClass: "text-foreground font-bold",
      ring: "",
    },
  }

  const style = rankStyles[rank]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, type: "spring", stiffness: 100 }}
      className={`relative flex w-28 sm:w-36 flex-col items-center ${rank === 1 ? "z-10" : "z-0"}`}
    >
      {/* Crown / Medal icon floating above */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: delay + 0.3, type: "spring", stiffness: 200 }}
        className="mb-2"
      >
        {style.icon}
      </motion.div>

      {/* Position change indicator */}
      <AnimatePresence>
        {change !== "same" && change !== "new" && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="absolute -top-1 -right-1 z-20"
          >
            <ChangeIndicator change={change} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Podium body */}
      <div
        className={`
          w-full ${height} rounded-xl border ${style.border} ${style.glow} ${style.ring}
          bg-gradient-to-t ${style.gradient}
          backdrop-blur-sm
          flex flex-col items-center justify-end p-3 sm:p-4
          transition-shadow duration-500
        `}
      >
        {/* Avatar circle with initials */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: delay + 0.2, type: "spring" }}
          className={`
            mb-2 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full
            ${rank === 1 ? "bg-accent/20 text-accent border border-accent/30" : "bg-secondary text-foreground border border-border"}
            text-sm sm:text-base font-bold
          `}
        >
          {person.nome.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
        </motion.div>

        <p className={`text-xs sm:text-sm text-center leading-tight truncate w-full ${style.nameClass}`}>
          {person.nome}
        </p>

        <motion.p
          key={person.total}
          initial={{ scale: 1.3, color: "hsl(var(--accent))" }}
          animate={{ scale: 1, color: "hsl(var(--foreground))" }}
          transition={{ duration: 0.5 }}
          className="mt-1 text-sm sm:text-lg font-extrabold tabular-nums"
        >
          R$ {person.total.toLocaleString("pt-BR")}
        </motion.p>

        <div className="mt-1 flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
          <Flame className="h-3 w-3 text-primary" />
          {person.purchases} {person.purchases === 1 ? "compra" : "compras"}
        </div>

        {/* Bar fill indicator */}
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-secondary/50">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(person.total / maxSpend) * 100}%` }}
            transition={{ delay: delay + 0.5, duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full ${rank === 1 ? "bg-accent" : rank === 2 ? "bg-muted-foreground" : "bg-warning/60"}`}
          />
        </div>
      </div>

      {/* Rank number at base */}
      <div className={`
        mt-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold
        ${rank === 1 ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"}
      `}>
        {rank}
      </div>
    </motion.div>
  )
}

// --- Ranking Row ---

function RankingRow({
  person,
  maxSpend,
  change,
}: {
  person: RankedPerson
  maxSpend: number
  change: string
}) {
  const barWidth = (person.total / maxSpend) * 100

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
      className="group relative grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 rounded-lg px-4 py-3 hover:bg-secondary/40 transition-colors"
    >
      {/* Position */}
      <div className="flex items-center justify-center gap-1">
        <motion.span
          key={person.position}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-sm font-bold text-muted-foreground tabular-nums"
        >
          {person.position}
        </motion.span>
        <ChangeIndicator change={change} small />
      </div>

      {/* Name + bar */}
      <div className="flex flex-col gap-1.5 min-w-0">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-muted-foreground">
            {person.nome[0]?.toUpperCase()}
          </div>
          <span className="text-sm font-medium truncate">{person.nome}</span>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
            {person.purchases} {person.purchases === 1 ? "compra" : "compras"}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary/60">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${barWidth}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full rounded-full bg-primary/70"
          />
        </div>
      </div>

      {/* Total */}
      <motion.span
        key={person.total}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        className="text-sm font-bold tabular-nums whitespace-nowrap"
      >
        R$ {person.total.toLocaleString("pt-BR")}
      </motion.span>
    </motion.div>
  )
}

// --- Position Change Indicator ---

function ChangeIndicator({ change, small = false }: { change: string; small?: boolean }) {
  const size = small ? "h-3 w-3" : "h-4 w-4"

  if (change === "up") {
    return (
      <motion.div
        initial={{ y: 5, opacity: 0 }}
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
        initial={{ y: -5, opacity: 0 }}
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
