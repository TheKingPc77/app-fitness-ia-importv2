"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Activity, Flame, Target, TrendingUp, Droplet, Moon, Edit2, Check, X } from "lucide-react"
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { supabase } from "@/lib/supabase"

interface DashboardOverviewProps {
  userId: string
  onWorkoutUpdate?: () => void
}

interface WeightRecord {
  date: string
  weight: number
}

interface CalorieRecord {
  day: string
  consumed: number
  target: number
}

interface DashboardStats {
  todayCalories: number
  targetCalories: number
  weeklyWorkouts: number
  weeklyWorkoutGoal: number
  currentWeight: number
  targetWeight: number
  weightProgress: number
  todayHydration: number
  yesterdaySleep: number
  todaySteps: number
}

export default function DashboardOverview({ userId, onWorkoutUpdate }: DashboardOverviewProps) {
  const [weightData, setWeightData] = useState<WeightRecord[]>([])
  const [caloriesData, setCaloriesData] = useState<CalorieRecord[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    todayCalories: 0,
    targetCalories: 2000,
    weeklyWorkouts: 0,
    weeklyWorkoutGoal: 5,
    currentWeight: 0,
    targetWeight: 0,
    weightProgress: 0,
    todayHydration: 0,
    yesterdaySleep: 0,
    todaySteps: 0,
  })
  const [loading, setLoading] = useState(true)
  
  // Estados para edição de peso
  const [editingWeight, setEditingWeight] = useState(false)
  const [editingTargetWeight, setEditingTargetWeight] = useState(false)
  const [tempCurrentWeight, setTempCurrentWeight] = useState("")
  const [tempTargetWeight, setTempTargetWeight] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (userId) {
      fetchDashboardData()
    }
  }, [userId])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Buscar dados de peso (últimas 6 semanas)
      const sixWeeksAgo = new Date()
      sixWeeksAgo.setDate(sixWeeksAgo.getDate() - 42)
      
      const { data: weightRecords } = await supabase
        .from("weight_records")
        .select("weight, date")
        .eq("user_id", userId)
        .gte("date", sixWeeksAgo.toISOString().split('T')[0])
        .order("date", { ascending: true })

      if (weightRecords && weightRecords.length > 0) {
        const formattedWeightData = weightRecords.map((record, index) => ({
          date: `Sem ${index + 1}`,
          weight: parseFloat(record.weight)
        }))
        setWeightData(formattedWeightData)
      }

      // Buscar dados de calorias (última semana)
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      
      const { data: calorieRecords } = await supabase
        .from("daily_calories")
        .select("consumed, target, date")
        .eq("user_id", userId)
        .gte("date", oneWeekAgo.toISOString().split('T')[0])
        .order("date", { ascending: true })

      if (calorieRecords && calorieRecords.length > 0) {
        const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
        const formattedCaloriesData = calorieRecords.map((record) => {
          const date = new Date(record.date)
          return {
            day: daysOfWeek[date.getDay()],
            consumed: record.consumed,
            target: record.target
          }
        })
        setCaloriesData(formattedCaloriesData)
      }

      // Buscar calorias de hoje
      const today = new Date().toISOString().split('T')[0]
      const { data: todayCalories } = await supabase
        .from("daily_calories")
        .select("consumed, target")
        .eq("user_id", userId)
        .eq("date", today)
        .single()

      // Buscar treinos da semana
      const startOfWeek = new Date()
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
      
      const { data: workoutLogs, count: workoutCount } = await supabase
        .from("workout_logs")
        .select("*", { count: "exact" })
        .eq("user_id", userId)
        .gte("date", startOfWeek.toISOString().split('T')[0])

      // Buscar metas do usuário
      const { data: userGoals } = await supabase
        .from("user_goals")
        .select("target_weight, target_calories, weekly_workout_goal")
        .eq("user_id", userId)
        .single()

      // Buscar peso atual (mais recente)
      const { data: latestWeight } = await supabase
        .from("weight_records")
        .select("weight")
        .eq("user_id", userId)
        .order("date", { ascending: false })
        .limit(1)
        .single()

      // Buscar hidratação de hoje
      const { data: todayHydration } = await supabase
        .from("hydration_logs")
        .select("amount_liters")
        .eq("user_id", userId)
        .eq("date", today)
        .single()

      // Buscar sono de ontem
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayDate = yesterday.toISOString().split('T')[0]
      
      const { data: yesterdaySleep } = await supabase
        .from("sleep_logs")
        .select("hours")
        .eq("user_id", userId)
        .eq("date", yesterdayDate)
        .single()

      // Buscar passos de hoje
      const { data: todaySteps } = await supabase
        .from("steps_logs")
        .select("steps")
        .eq("user_id", userId)
        .eq("date", today)
        .single()

      // Calcular progresso de peso
      let weightProgress = 0
      if (latestWeight && userGoals?.target_weight) {
        const currentWeight = parseFloat(latestWeight.weight)
        const targetWeight = parseFloat(userGoals.target_weight)
        const initialWeight = weightRecords && weightRecords.length > 0 
          ? parseFloat(weightRecords[0].weight) 
          : currentWeight
        
        if (initialWeight !== targetWeight) {
          weightProgress = ((initialWeight - currentWeight) / (initialWeight - targetWeight)) * 100
          weightProgress = Math.max(0, Math.min(100, weightProgress))
        }
      }

      setStats({
        todayCalories: todayCalories?.consumed || 0,
        targetCalories: todayCalories?.target || userGoals?.target_calories || 2000,
        weeklyWorkouts: workoutCount || 0,
        weeklyWorkoutGoal: userGoals?.weekly_workout_goal || 5,
        currentWeight: latestWeight ? parseFloat(latestWeight.weight) : 0,
        targetWeight: userGoals?.target_weight ? parseFloat(userGoals.target_weight) : 0,
        weightProgress: weightProgress,
        todayHydration: todayHydration ? parseFloat(todayHydration.amount_liters) : 0,
        yesterdaySleep: yesterdaySleep ? parseFloat(yesterdaySleep.hours) : 0,
        todaySteps: todaySteps?.steps || 0,
      })

    } catch (error) {
      console.error("Erro ao buscar dados do dashboard:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCurrentWeight = async () => {
    const newWeight = parseFloat(tempCurrentWeight)
    if (isNaN(newWeight) || newWeight <= 0) {
      alert("Por favor, insira um peso válido")
      return
    }

    try {
      setSaving(true)
      const today = new Date().toISOString().split('T')[0]
      
      // Usar API route que bypassa RLS
      const response = await fetch('/api/dashboard/weight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          weight: newWeight,
          date: today
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao salvar peso')
      }

      // Atualizar estado local
      setStats(prev => ({ ...prev, currentWeight: newWeight }))
      setEditingWeight(false)
      setTempCurrentWeight("")
      
      // Recarregar dados para atualizar gráficos
      await fetchDashboardData()
      
      alert("Peso salvo com sucesso!")
    } catch (error) {
      console.error("Erro ao salvar peso:", error)
      alert(`Erro ao salvar peso: ${error instanceof Error ? error.message : 'Tente novamente'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveTargetWeight = async () => {
    const newTarget = parseFloat(tempTargetWeight)
    if (isNaN(newTarget) || newTarget <= 0) {
      alert("Por favor, insira uma meta válida")
      return
    }

    try {
      setSaving(true)
      
      // Usar API route que bypassa RLS
      const response = await fetch('/api/dashboard/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          targetWeight: newTarget,
          targetCalories: stats.targetCalories,
          weeklyWorkoutGoal: stats.weeklyWorkoutGoal
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao salvar meta')
      }

      // Atualizar estado local
      setStats(prev => ({ ...prev, targetWeight: newTarget }))
      setEditingTargetWeight(false)
      setTempTargetWeight("")
      
      // Recarregar dados para atualizar progresso
      await fetchDashboardData()
      
      alert("Meta salva com sucesso!")
    } catch (error) {
      console.error("Erro ao salvar meta:", error)
      alert(`Erro ao salvar meta: ${error instanceof Error ? error.message : 'Tente novamente'}`)
    } finally {
      setSaving(false)
    }
  }

  const startEditingWeight = () => {
    setTempCurrentWeight(stats.currentWeight > 0 ? stats.currentWeight.toString() : "")
    setEditingWeight(true)
  }

  const startEditingTargetWeight = () => {
    setTempTargetWeight(stats.targetWeight > 0 ? stats.targetWeight.toString() : "")
    setEditingTargetWeight(true)
  }

  const cancelEditingWeight = () => {
    setEditingWeight(false)
    setTempCurrentWeight("")
  }

  const cancelEditingTargetWeight = () => {
    setEditingTargetWeight(false)
    setTempTargetWeight("")
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="bg-slate-200 dark:bg-slate-800 rounded-3xl h-32"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-200 dark:bg-slate-800 rounded-2xl h-40"></div>
          ))}
        </div>
      </div>
    )
  }

  const caloriesProgress = stats.targetCalories > 0 
    ? (stats.todayCalories / stats.targetCalories) * 100 
    : 0
  
  const workoutsProgress = stats.weeklyWorkoutGoal > 0 
    ? (stats.weeklyWorkouts / stats.weeklyWorkoutGoal) * 100 
    : 0

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl p-8 text-white shadow-2xl">
        <h2 className="text-3xl font-bold mb-2">Bem-vindo de volta! 👋</h2>
        <p className="text-purple-100 text-lg">Você está fazendo um ótimo progresso. Continue assim!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats.todayCalories.toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Calorias Hoje</p>
          <Progress value={caloriesProgress} className="h-2" />
          <p className="text-xs text-slate-400 mt-2">
            Meta: {stats.targetCalories.toLocaleString()} kcal
          </p>
        </Card>

        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {stats.weeklyWorkouts}/{stats.weeklyWorkoutGoal}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Treinos Semana</p>
          <Progress value={workoutsProgress} className="h-2" />
          <p className="text-xs text-slate-400 mt-2">
            Meta: {stats.weeklyWorkoutGoal} treinos
          </p>
        </Card>

        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            {editingWeight ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.1"
                  value={tempCurrentWeight}
                  onChange={(e) => setTempCurrentWeight(e.target.value)}
                  className="w-20 h-8 text-sm"
                  placeholder="kg"
                  autoFocus
                  disabled={saving}
                />
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={handleSaveCurrentWeight} disabled={saving}>
                  <Check className="w-4 h-4 text-green-500" />
                </Button>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={cancelEditingWeight} disabled={saving}>
                  <X className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {stats.currentWeight > 0 ? `${stats.currentWeight}kg` : "-"}
                </span>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={startEditingWeight}>
                  <Edit2 className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                </Button>
              </div>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Peso Atual</p>
          <Progress value={stats.weightProgress} className="h-2" />
          {editingTargetWeight ? (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-slate-400">Meta:</span>
              <Input
                type="number"
                step="0.1"
                value={tempTargetWeight}
                onChange={(e) => setTempTargetWeight(e.target.value)}
                className="w-16 h-6 text-xs"
                placeholder="kg"
                autoFocus
                disabled={saving}
              />
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={handleSaveTargetWeight} disabled={saving}>
                <Check className="w-3 h-3 text-green-500" />
              </Button>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={cancelEditingTargetWeight} disabled={saving}>
                <X className="w-3 h-3 text-red-500" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-2">
              <p className="text-xs text-slate-400">
                {stats.targetWeight > 0 ? `Meta: ${stats.targetWeight}kg` : "Defina sua meta"}
              </p>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={startEditingTargetWeight}>
                <Edit2 className="w-3 h-3 text-slate-400 hover:text-slate-600" />
              </Button>
            </div>
          )}
        </Card>

        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {weightData.length > 1 && stats.currentWeight > 0
                ? `${(weightData[0].weight - stats.currentWeight).toFixed(1)}kg`
                : "-"}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Progresso</p>
          <Progress value={stats.weightProgress} className="h-2" />
          <p className="text-xs text-slate-400 mt-2">
            {weightData.length > 0 ? "Últimas 6 semanas" : "Registre seu peso"}
          </p>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weight Progress Chart */}
        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Evolução de Peso</h3>
          {weightData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={weightData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: 'none', 
                    borderRadius: '12px',
                    color: '#fff'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="url(#colorWeight)" 
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', r: 5 }}
                />
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-400">
              <p>Registre seu peso para ver a evolução</p>
            </div>
          )}
        </Card>

        {/* Calories Chart */}
        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Calorias Semanais</h3>
          {caloriesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={caloriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: 'none', 
                    borderRadius: '12px',
                    color: '#fff'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="consumed" 
                  stroke="#f97316" 
                  fill="url(#colorCalories)" 
                  strokeWidth={2}
                />
                <defs>
                  <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-400">
              <p>Registre suas calorias para ver o histórico</p>
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-blue-200 dark:border-blue-800 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center">
              <Droplet className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.todayHydration > 0 ? `${stats.todayHydration.toFixed(1)}L` : "-"}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Hidratação Hoje</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
              <Moon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.yesterdaySleep > 0 ? `${stats.yesterdaySleep.toFixed(1)}h` : "-"}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Sono Ontem</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats.todaySteps > 0 ? stats.todaySteps.toLocaleString() : "-"}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Passos Hoje</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
