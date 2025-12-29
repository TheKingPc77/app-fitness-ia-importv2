"use client"

import { useState, useEffect } from 'react'
import { supabase, type UserGoals, type DailyMetrics } from '@/lib/supabase'
import { startOfWeek, endOfWeek, subWeeks, format, eachDayOfInterval, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export type DashboardData = {
  // Métricas principais
  caloriesConsumed: number
  caloriesGoal: number
  workoutsThisWeek: number
  workoutsGoal: number
  currentWeight: number | null
  targetWeight: number | null
  weightProgress: number
  
  // Métricas diárias
  waterToday: number
  waterGoal: number
  sleepYesterday: number
  sleepGoal: number
  stepsToday: number
  stepsGoal: number
  
  // Dados para gráficos
  weightData: Array<{ date: string; weight: number }>
  caloriesData: Array<{ day: string; consumed: number; target: number }>
  
  // Estado de carregamento
  loading: boolean
  error: string | null
}

export function useDashboardData(userId: string | undefined) {
  const [data, setData] = useState<DashboardData>({
    caloriesConsumed: 0,
    caloriesGoal: 2000,
    workoutsThisWeek: 0,
    workoutsGoal: 5,
    currentWeight: null,
    targetWeight: null,
    weightProgress: 0,
    waterToday: 0,
    waterGoal: 2000,
    sleepYesterday: 0,
    sleepGoal: 8.0,
    stepsToday: 0,
    stepsGoal: 10000,
    weightData: [],
    caloriesData: [],
    loading: true,
    error: null
  })

  useEffect(() => {
    if (!userId) return

    let mounted = true

    async function fetchDashboardData() {
      try {
        // 1. Buscar metas do usuário
        const { data: goals, error: goalsError } = await supabase
          .from('user_goals')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (goalsError && goalsError.code !== 'PGRST116') {
          throw goalsError
        }

        const userGoals: UserGoals = goals || {
          id: '',
          user_id: userId,
          target_weight: null,
          daily_calorie_goal: 2000,
          weekly_workout_goal: 5,
          daily_water_goal: 2000,
          daily_sleep_goal: 8.0,
          daily_steps_goal: 10000,
          created_at: '',
          updated_at: ''
        }

        // 2. Buscar calorias consumidas hoje
        const today = format(new Date(), 'yyyy-MM-dd')
        const { data: mealsToday, error: mealsError } = await supabase
          .from('meals')
          .select('calories')
          .eq('user_id', userId)
          .gte('created_at', `${today}T00:00:00`)
          .lte('created_at', `${today}T23:59:59`)

        if (mealsError) throw mealsError

        const caloriesConsumed = mealsToday?.reduce((sum, meal) => sum + meal.calories, 0) || 0

        // 3. Buscar treinos completados esta semana
        const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
        const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
        
        const { data: workoutLogs, error: workoutsError } = await supabase
          .from('workout_logs')
          .select('id')
          .eq('user_id', userId)
          .gte('completed_at', `${weekStart}T00:00:00`)
          .lte('completed_at', `${weekEnd}T23:59:59`)

        if (workoutsError) throw workoutsError

        const workoutsThisWeek = workoutLogs?.length || 0

        // 4. Buscar peso atual (último registro)
        const { data: latestWeight, error: weightError } = await supabase
          .from('progress_photos')
          .select('weight, created_at')
          .eq('user_id', userId)
          .not('weight', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (weightError && weightError.code !== 'PGRST116') {
          console.error('Erro ao buscar peso:', weightError)
        }

        const currentWeight = latestWeight?.weight || null

        // 5. Buscar dados de peso das últimas 6 semanas
        const sixWeeksAgo = subWeeks(new Date(), 6)
        const { data: weightHistory, error: weightHistoryError } = await supabase
          .from('progress_photos')
          .select('weight, created_at')
          .eq('user_id', userId)
          .not('weight', 'is', null)
          .gte('created_at', sixWeeksAgo.toISOString())
          .order('created_at', { ascending: true })

        if (weightHistoryError) throw weightHistoryError

        // Agrupar por semana
        const weightByWeek = new Map<number, number[]>()
        weightHistory?.forEach(record => {
          const weekNumber = Math.floor((new Date(record.created_at).getTime() - sixWeeksAgo.getTime()) / (7 * 24 * 60 * 60 * 1000))
          if (!weightByWeek.has(weekNumber)) {
            weightByWeek.set(weekNumber, [])
          }
          weightByWeek.get(weekNumber)!.push(record.weight)
        })

        const weightData = Array.from({ length: 6 }, (_, i) => {
          const weights = weightByWeek.get(i) || []
          const avgWeight = weights.length > 0 
            ? weights.reduce((sum, w) => sum + w, 0) / weights.length 
            : null
          return {
            date: `Sem ${i + 1}`,
            weight: avgWeight ? Math.round(avgWeight * 10) / 10 : 0
          }
        }).filter(d => d.weight > 0)

        // 6. Buscar calorias da semana atual
        const weekDays = eachDayOfInterval({
          start: startOfWeek(new Date(), { weekStartsOn: 1 }),
          end: endOfWeek(new Date(), { weekStartsOn: 1 })
        })

        const caloriesPromises = weekDays.map(async (day) => {
          const dayStr = format(day, 'yyyy-MM-dd')
          const { data: dayMeals } = await supabase
            .from('meals')
            .select('calories')
            .eq('user_id', userId)
            .gte('created_at', `${dayStr}T00:00:00`)
            .lte('created_at', `${dayStr}T23:59:59`)

          const consumed = dayMeals?.reduce((sum, meal) => sum + meal.calories, 0) || 0
          return {
            day: format(day, 'EEE', { locale: ptBR }),
            consumed,
            target: userGoals.daily_calorie_goal
          }
        })

        const caloriesData = await Promise.all(caloriesPromises)

        // 7. Buscar métricas diárias (água, sono, passos)
        const { data: todayMetrics } = await supabase
          .from('daily_metrics')
          .select('*')
          .eq('user_id', userId)
          .eq('date', today)
          .single()

        const yesterday = format(new Date(Date.now() - 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
        const { data: yesterdayMetrics } = await supabase
          .from('daily_metrics')
          .select('sleep_hours')
          .eq('user_id', userId)
          .eq('date', yesterday)
          .single()

        // Calcular progresso de peso
        const weightProgress = currentWeight && userGoals.target_weight
          ? Math.round(((currentWeight - userGoals.target_weight) / currentWeight) * 100)
          : 0

        if (mounted) {
          setData({
            caloriesConsumed,
            caloriesGoal: userGoals.daily_calorie_goal,
            workoutsThisWeek,
            workoutsGoal: userGoals.weekly_workout_goal,
            currentWeight,
            targetWeight: userGoals.target_weight || null,
            weightProgress,
            waterToday: todayMetrics?.water_ml || 0,
            waterGoal: userGoals.daily_water_goal,
            sleepYesterday: yesterdayMetrics?.sleep_hours || 0,
            sleepGoal: userGoals.daily_sleep_goal,
            stepsToday: todayMetrics?.steps || 0,
            stepsGoal: userGoals.daily_steps_goal,
            weightData,
            caloriesData,
            loading: false,
            error: null
          })
        }

        // 8. Configurar subscriptions em tempo real
        const mealsChannel = supabase
          .channel('meals-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'meals',
              filter: `user_id=eq.${userId}`
            },
            () => {
              // Recarregar dados quando houver mudanças
              fetchDashboardData()
            }
          )
          .subscribe()

        const workoutsChannel = supabase
          .channel('workouts-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'workout_logs',
              filter: `user_id=eq.${userId}`
            },
            () => {
              fetchDashboardData()
            }
          )
          .subscribe()

        const progressChannel = supabase
          .channel('progress-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'progress_photos',
              filter: `user_id=eq.${userId}`
            },
            () => {
              fetchDashboardData()
            }
          )
          .subscribe()

        const metricsChannel = supabase
          .channel('metrics-changes')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'daily_metrics',
              filter: `user_id=eq.${userId}`
            },
            () => {
              fetchDashboardData()
            }
          )
          .subscribe()

        return () => {
          mealsChannel.unsubscribe()
          workoutsChannel.unsubscribe()
          progressChannel.unsubscribe()
          metricsChannel.unsubscribe()
        }

      } catch (error) {
        console.error('Erro ao carregar dados da dashboard:', error)
        if (mounted) {
          setData(prev => ({
            ...prev,
            loading: false,
            error: 'Erro ao carregar dados. Tente novamente.'
          }))
        }
      }
    }

    fetchDashboardData()

    return () => {
      mounted = false
    }
  }, [userId])

  return data
}
