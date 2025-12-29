"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, Camera, Dumbbell, UtensilsCrossed, User, TrendingUp, Zap, LogOut, Star } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import ProgressModule from "@/components/fitness/progress-module"
import NutritionModule from "@/components/fitness/nutrition-module"
import WorkoutModule from "@/components/fitness/workout-module"
import DietPlanModule from "@/components/fitness/diet-plan-module"
import DashboardOverview from "@/components/fitness/dashboard-overview"
import CelebrityWorkoutModule from "@/components/fitness/celebrity-workout-module"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function FitnessApp() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [dashboardKey, setDashboardKey] = useState(0)
  const router = useRouter()

  useEffect(() => {
    // Verificar sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
      
      if (!session) {
        router.push("/login")
      }
    })

    // Listener para mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      
      if (!session) {
        router.push("/login")
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const handleMealAdded = () => {
    // Força o dashboard a recarregar os dados
    setDashboardKey(prev => prev + 1)
  }

  const handleWorkoutComplete = () => {
    // Força o dashboard a recarregar os dados quando treino é concluído
    setDashboardKey(prev => prev + 1)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="animate-pulse">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 flex items-center justify-center shadow-2xl">
            <Zap className="w-10 h-10 text-white" />
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header - Design Moderno com Logo Marcante */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Logo Marcante com Gradiente Vibrante */}
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 flex items-center justify-center shadow-2xl animate-pulse">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-slate-950 animate-ping"></div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-slate-950"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                  FitAI Pro
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Seu personal trainer inteligente
                </p>
              </div>
            </div>
            
            {/* Menu do Usuário */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-purple-100 dark:from-orange-950/30 dark:to-purple-950/30 flex items-center justify-center hover:scale-110 transition-all duration-300 shadow-lg border-2 border-orange-200 dark:border-orange-800">
                  <User className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Minha Conta</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Navigation Tabs - Design Moderno */}
          <TabsList className="grid w-full grid-cols-6 mb-8 bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-2xl border-2 border-slate-200 dark:border-slate-800">
            <TabsTrigger 
              value="dashboard" 
              className="rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-400 data-[state=active]:via-pink-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline font-semibold">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger 
              value="progress"
              className="rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-400 data-[state=active]:via-pink-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <Camera className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline font-semibold">Progresso</span>
            </TabsTrigger>
            <TabsTrigger 
              value="nutrition"
              className="rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-400 data-[state=active]:via-pink-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <UtensilsCrossed className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline font-semibold">FitCal</span>
            </TabsTrigger>
            <TabsTrigger 
              value="workout"
              className="rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-400 data-[state=active]:via-pink-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <Dumbbell className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline font-semibold">Treinos</span>
            </TabsTrigger>
            <TabsTrigger 
              value="diet"
              className="rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-400 data-[state=active]:via-pink-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <UtensilsCrossed className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline font-semibold">Dieta IA</span>
            </TabsTrigger>
            <TabsTrigger 
              value="celebrity"
              className="rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-yellow-400 data-[state=active]:via-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 hover:scale-105"
            >
              <Star className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline font-semibold">Famosos</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Contents */}
          <TabsContent value="dashboard" className="mt-0">
            <DashboardOverview key={dashboardKey} userId={user.id} />
          </TabsContent>

          <TabsContent value="progress" className="mt-0">
            <ProgressModule userId={user.id} />
          </TabsContent>

          <TabsContent value="nutrition" className="mt-0">
            <NutritionModule userId={user.id} onMealAdded={handleMealAdded} />
          </TabsContent>

          <TabsContent value="workout" className="mt-0">
            <WorkoutModule userId={user.id} onWorkoutComplete={handleWorkoutComplete} />
          </TabsContent>

          <TabsContent value="diet" className="mt-0">
            <DietPlanModule userId={user.id} />
          </TabsContent>

          <TabsContent value="celebrity" className="mt-0">
            <CelebrityWorkoutModule userId={user.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

// Componente auxiliar Sparkles
function Sparkles({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M5.6 18.4L18.4 5.6" />
    </svg>
  )
}
