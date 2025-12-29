"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Camera, 
  Sparkles, 
  Apple, 
  Coffee, 
  UtensilsCrossed, 
  Droplet, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Settings,
  TrendingUp
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

interface DietPlanModuleProps {
  userId: string
}

interface Meal {
  name: string
  time: string
  foods: string[]
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface DietPlan {
  goal: string
  target_calories: number
  target_protein: number
  target_carbs: number
  target_fat: number
  meals: Meal[]
}

interface UserProfile {
  weight: number
  height: number
  age: number
  gender: string
  goal: string
  activityLevel: string
  restrictions: string
}

export default function DietPlanModule({ userId }: DietPlanModuleProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [mealCheck, setMealCheck] = useState<any>(null)
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile>({
    weight: 70,
    height: 170,
    age: 25,
    gender: "masculino",
    goal: "Perda de Gordura",
    activityLevel: "moderado",
    restrictions: ""
  })
  const [hydrationGoal] = useState(3000)
  const [currentHydration, setCurrentHydration] = useState(0)

  useEffect(() => {
    if (userId) {
      loadDietPlan()
      loadHydration()
    }
  }, [userId])

  const loadDietPlan = async () => {
    try {
      setLoading(true)
      setError(null)

      // Buscar dieta personalizada do usuário
      const { data: userDiet, error: dietError } = await supabase
        .from("user_diets")
        .select("*")
        .eq("user_id", userId)
        .single()

      if (dietError && dietError.code !== 'PGRST116') {
        throw dietError
      }

      if (userDiet && userDiet.diet_plan) {
        setDietPlan(userDiet.diet_plan as DietPlan)
      }
    } catch (error: any) {
      console.error("Erro ao carregar dieta:", error)
      setError("Erro ao carregar sua dieta. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const loadHydration = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data } = await supabase
        .from("hydration_logs")
        .select("amount")
        .eq("user_id", userId)
        .eq("date", today)

      if (data && data.length > 0) {
        const total = data.reduce((sum, log) => sum + log.amount, 0)
        setCurrentHydration(total)
      }
    } catch (error) {
      console.error("Erro ao carregar hidratação:", error)
    }
  }

  const generateDiet = async () => {
    try {
      setGenerating(true)
      setError(null)

      // Validar dados do perfil
      if (!userProfile.weight || !userProfile.height || !userProfile.age) {
        setError("Por favor, preencha todos os campos obrigatórios do perfil.")
        return
      }

      if (userProfile.weight < 30 || userProfile.weight > 300) {
        setError("Peso deve estar entre 30kg e 300kg.")
        return
      }

      if (userProfile.height < 100 || userProfile.height > 250) {
        setError("Altura deve estar entre 100cm e 250cm.")
        return
      }

      if (userProfile.age < 10 || userProfile.age > 120) {
        setError("Idade deve estar entre 10 e 120 anos.")
        return
      }

      // Buscar dados de progresso do usuário para personalizar ainda mais
      const { data: progressData } = await supabase
        .from("body_metrics")
        .select("weight_lost, muscle_gained")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single()

      console.log("🚀 Iniciando geração de dieta com IA...")

      const response = await fetch("/api/generate-diet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          userProfile: {
            ...userProfile,
            progressData: progressData || null
          }
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        console.error("❌ Erro na API:", result)
        
        // Tratamento específico de erros
        if (result.code === 'MISSING_API_KEY') {
          throw new Error("⚠️ A chave da API OpenAI não está configurada. Por favor, configure a variável OPENAI_API_KEY nas configurações do projeto.")
        }
        
        if (result.code === 'INVALID_API_KEY') {
          throw new Error("⚠️ A chave da API OpenAI é inválida. Verifique a configuração.")
        }
        
        if (result.code === 'QUOTA_EXCEEDED') {
          throw new Error("⚠️ Cota da API OpenAI excedida. Entre em contato com o suporte.")
        }
        
        throw new Error(result.error || "Erro ao gerar dieta")
      }

      const newDiet = result.diet

      if (!newDiet || !newDiet.meals || !Array.isArray(newDiet.meals)) {
        throw new Error("Formato de dieta inválido retornado pela IA")
      }

      console.log("✅ Dieta gerada com sucesso:", newDiet)

      // Primeiro, deletar qualquer dieta existente do usuário para evitar duplicatas
      console.log("🗑️ Removendo dietas antigas...")
      await supabase
        .from("user_diets")
        .delete()
        .eq("user_id", userId)

      // Agora inserir a nova dieta
      console.log("➕ Criando nova dieta...")
      const { error: insertError } = await supabase
        .from("user_diets")
        .insert({
          user_id: userId,
          diet_plan: newDiet,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (insertError) {
        console.error("❌ Erro ao salvar dieta:", insertError)
        throw new Error(`Erro ao salvar dieta: ${insertError.message || 'Erro desconhecido'}`)
      }

      setDietPlan(newDiet)
      setShowProfileDialog(false)

      // Atualizar também as metas do usuário
      console.log("📊 Atualizando metas do usuário...")
      
      // Deletar metas antigas
      await supabase
        .from("user_goals")
        .delete()
        .eq("user_id", userId)

      // Inserir nova meta
      await supabase
        .from("user_goals")
        .insert({
          user_id: userId,
          target_calories: newDiet.target_calories,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      console.log("✅ Dieta salva e metas atualizadas com sucesso!")

    } catch (error: any) {
      console.error("❌ Erro ao gerar dieta:", error)
      setError(error.message || "Erro ao gerar dieta. Tente novamente em alguns instantes.")
    } finally {
      setGenerating(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string)
        setAnalyzing(true)
        
        // Simular análise de IA
        setTimeout(() => {
          setAnalyzing(false)
          setMealCheck({
            compatible: true,
            foods: ["Frango grelhado", "Arroz integral", "Brócolis"],
            calories: 580,
            protein: 48,
            carbs: 62,
            fat: 12,
            feedback: "✅ Refeição perfeitamente alinhada com seu plano! Excelente escolha de proteína magra e carboidratos complexos.",
            adjustments: []
          })
        }, 2500)
      }
      reader.readAsDataURL(file)
    }
  }

  const addWater = async (amount: number) => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      await supabase
        .from("hydration_logs")
        .insert({
          user_id: userId,
          date: today,
          amount: amount
        })

      setCurrentHydration(prev => prev + amount)
    } catch (error) {
      console.error("Erro ao registrar água:", error)
    }
  }

  const hydrationPercentage = (currentHydration / hydrationGoal) * 100

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="bg-slate-200 dark:bg-slate-800 rounded-3xl h-64"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-200 dark:bg-slate-800 rounded-2xl h-96"></div>
          <div className="bg-slate-200 dark:bg-slate-800 rounded-2xl h-96"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Plano Alimentar IA</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Dieta personalizada e inteligente</p>
        </div>
        <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg">
              {dietPlan ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar Dieta
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Gerar Dieta IA
                </>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Configure seu Perfil</DialogTitle>
              <DialogDescription>
                Preencha seus dados para gerar uma dieta personalizada com IA
              </DialogDescription>
            </DialogHeader>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weight">Peso (kg) *</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="30"
                    max="300"
                    value={userProfile.weight}
                    onChange={(e) => setUserProfile({...userProfile, weight: parseFloat(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="height">Altura (cm) *</Label>
                  <Input
                    id="height"
                    type="number"
                    min="100"
                    max="250"
                    value={userProfile.height}
                    onChange={(e) => setUserProfile({...userProfile, height: parseFloat(e.target.value)})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age">Idade *</Label>
                  <Input
                    id="age"
                    type="number"
                    min="10"
                    max="120"
                    value={userProfile.age}
                    onChange={(e) => setUserProfile({...userProfile, age: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gênero *</Label>
                  <Select value={userProfile.gender} onValueChange={(value) => setUserProfile({...userProfile, gender: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="goal">Objetivo *</Label>
                <Select value={userProfile.goal} onValueChange={(value) => setUserProfile({...userProfile, goal: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Perda de Gordura">Perda de Gordura</SelectItem>
                    <SelectItem value="Ganho de Massa Muscular">Ganho de Massa Muscular</SelectItem>
                    <SelectItem value="Manutenção">Manutenção</SelectItem>
                    <SelectItem value="Definição Muscular">Definição Muscular</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="activity">Nível de Atividade *</Label>
                <Select value={userProfile.activityLevel} onValueChange={(value) => setUserProfile({...userProfile, activityLevel: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentario">Sedentário (pouco ou nenhum exercício)</SelectItem>
                    <SelectItem value="leve">Leve (1-3 dias/semana)</SelectItem>
                    <SelectItem value="moderado">Moderado (3-5 dias/semana)</SelectItem>
                    <SelectItem value="intenso">Intenso (6-7 dias/semana)</SelectItem>
                    <SelectItem value="muito_intenso">Muito Intenso (2x por dia)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="restrictions">Restrições Alimentares (opcional)</Label>
                <Input
                  id="restrictions"
                  placeholder="Ex: Intolerância à lactose, vegetariano..."
                  value={userProfile.restrictions}
                  onChange={(e) => setUserProfile({...userProfile, restrictions: e.target.value})}
                />
              </div>

              <Button 
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
                onClick={generateDiet}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Gerando Dieta Personalizada...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerar Dieta com IA
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && !showProfileDialog && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!dietPlan ? (
        <Card className="p-12 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800">
          <div className="text-center max-w-md mx-auto">
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-2xl">
              <UtensilsCrossed className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">
              Crie sua Dieta Personalizada
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Nossa IA criará um plano alimentar completo baseado no seu perfil, objetivos e progresso atual.
            </p>
            <Button 
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-xl"
              onClick={() => setShowProfileDialog(true)}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Começar Agora
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Diet Summary */}
          <Card className="p-6 bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0 shadow-2xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <Badge className="bg-white/20 text-white border-0 mb-3">Seu Plano Atual</Badge>
                <h3 className="text-2xl font-bold mb-2">{dietPlan.goal}</h3>
                <p className="text-purple-100">Plano otimizado pela IA para seus objetivos</p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <UtensilsCrossed className="w-8 h-8" />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-sm text-purple-100 mb-1">Calorias</p>
                <p className="text-2xl font-bold">{dietPlan.target_calories}</p>
                <p className="text-xs text-purple-200">kcal/dia</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-sm text-purple-100 mb-1">Proteínas</p>
                <p className="text-2xl font-bold">{dietPlan.target_protein}g</p>
                <p className="text-xs text-purple-200">por dia</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-sm text-purple-100 mb-1">Carboidratos</p>
                <p className="text-2xl font-bold">{dietPlan.target_carbs}g</p>
                <p className="text-xs text-purple-200">por dia</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-sm text-purple-100 mb-1">Gorduras</p>
                <p className="text-2xl font-bold">{dietPlan.target_fat}g</p>
                <p className="text-xs text-purple-200">por dia</p>
              </div>
            </div>
          </Card>

          {/* Meal Verification */}
          <Card className="p-8 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-xl">
                <Camera className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Verificar Compatibilidade</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">Envie foto da refeição e a IA verificará se está alinhada com seu plano</p>
              
              <label htmlFor="meal-check-upload" className="cursor-pointer">
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-400 to-cyan-500 hover:from-blue-500 hover:to-cyan-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <Camera className="w-5 h-5" />
                  Verificar Refeição
                </div>
                <input
                  id="meal-check-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            </div>

            {selectedImage && (
              <div className="mt-6 p-4 bg-white dark:bg-slate-900 rounded-2xl">
                <img src={selectedImage} alt="Meal Check" className="w-full max-w-md mx-auto rounded-xl shadow-lg" />
                
                {analyzing && (
                  <div className="mt-4 text-center">
                    <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <Sparkles className="w-5 h-5 animate-pulse" />
                      <span className="font-medium">IA verificando compatibilidade...</span>
                    </div>
                  </div>
                )}

                {mealCheck && !analyzing && (
                  <div className={`mt-6 p-6 rounded-xl border ${
                    mealCheck.compatible 
                      ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800'
                      : 'bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border-orange-200 dark:border-orange-800'
                  }`}>
                    <div className="flex items-start gap-3 mb-4">
                      {mealCheck.compatible ? (
                        <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-orange-500 flex-shrink-0" />
                      )}
                      <div>
                        <h4 className="font-semibold text-lg mb-2 text-slate-900 dark:text-white">
                          {mealCheck.compatible ? "Refeição Aprovada!" : "Atenção Necessária"}
                        </h4>
                        <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">{mealCheck.feedback}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Calorias</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{mealCheck.calories}</p>
                      </div>
                      <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Proteínas</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{mealCheck.protein}g</p>
                      </div>
                      <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Carboidratos</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{mealCheck.carbs}g</p>
                      </div>
                      <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Gorduras</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{mealCheck.fat}g</p>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Alimentos Identificados:</p>
                      <div className="flex flex-wrap gap-2">
                        {mealCheck.foods.map((food: string, i: number) => (
                          <Badge key={i} variant="secondary">{food}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Hydration Tracker */}
          <Card className="p-6 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 border-cyan-200 dark:border-cyan-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                  <Droplet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Meta de Hidratação</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{currentHydration}ml de {hydrationGoal}ml</p>
                </div>
              </div>
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-white"
                onClick={() => addWater(250)}
              >
                + 250ml
              </Button>
            </div>
            <div className="h-4 bg-white dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500"
                style={{ width: `${Math.min(hydrationPercentage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">{Math.round(hydrationPercentage)}% da meta diária</p>
          </Card>

          {/* Meal Plan */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Refeições do Dia</h3>
            {dietPlan.meals.map((meal, index) => {
              const icons = [Coffee, Apple, UtensilsCrossed, Apple, UtensilsCrossed]
              const Icon = icons[index] || UtensilsCrossed
              
              return (
                <Card key={index} className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-lg text-slate-900 dark:text-white">{meal.name}</h4>
                        <Badge variant="outline">{meal.time}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-4">
                        <span>{meal.calories} kcal</span>
                        <span>•</span>
                        <span>P: {meal.protein}g</span>
                        <span>•</span>
                        <span>C: {meal.carbs}g</span>
                        <span>•</span>
                        <span>G: {meal.fat}g</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">Alimentos:</p>
                    <ul className="space-y-2">
                      {meal.foods.map((food, i) => (
                        <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-600" />
                          {food}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* AI Suggestions */}
          <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">Acompanhamento Inteligente</h3>
                <p className="text-slate-700 dark:text-slate-300 mb-3">
                  Sua dieta será atualizada automaticamente conforme seu progresso. A IA monitora:
                </p>
                <ul className="space-y-2 text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Evolução de peso e composição corporal</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Aderência ao plano alimentar</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Ajustes baseados em resultados reais</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
