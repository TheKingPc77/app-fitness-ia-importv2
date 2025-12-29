"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Camera, Plus, Sparkles, Apple, Coffee, UtensilsCrossed, Check } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { supabase } from "@/lib/supabase"

interface NutritionModuleProps {
  userId: string
  onMealAdded?: () => void
}

interface DailyNutrition {
  calories: number
  protein: number
  carbs: number
  fat: number
  calorieGoal: number
  proteinGoal: number
  carbsGoal: number
  fatGoal: number
}

interface MealLog {
  id: string
  meal_name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  created_at: string
}

interface DietMeal {
  name: string
  time: string
  foods: string[]
  calories: number
  protein: number
  carbs: number
  fat: number
}

export default function NutritionModule({ userId, onMealAdded }: NutritionModuleProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [addingToDiary, setAddingToDiary] = useState(false)
  const [mealAdded, setMealAdded] = useState(false)
  const [dailyNutrition, setDailyNutrition] = useState<DailyNutrition>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    calorieGoal: 2000,
    proteinGoal: 150,
    carbsGoal: 200,
    fatGoal: 60,
  })
  const [mealLogs, setMealLogs] = useState<MealLog[]>([])
  const [weeklyCalories, setWeeklyCalories] = useState<any[]>([])
  const [macrosData, setMacrosData] = useState<any[]>([])
  const [suggestedMeals, setSuggestedMeals] = useState<DietMeal[]>([])

  useEffect(() => {
    if (userId) {
      fetchNutritionData()
    }
  }, [userId])

  const fetchNutritionData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]

      // 1. Buscar dieta personalizada do usuário
      const { data: userDiet } = await supabase
        .from("user_diets")
        .select("*")
        .eq("user_id", userId)
        .single()

      let calorieGoal = 2000
      let proteinGoal = 150
      let carbsGoal = 200
      let fatGoal = 60

      if (userDiet) {
        calorieGoal = userDiet.target_calories
        proteinGoal = userDiet.target_protein
        carbsGoal = userDiet.target_carbs
        fatGoal = userDiet.target_fat
        setSuggestedMeals(userDiet.meals || [])
      }

      // 2. Buscar refeições do dia
      const { data: todayMeals } = await supabase
        .from("meal_logs")
        .select("*")
        .eq("user_id", userId)
        .eq("date", today)
        .order("created_at", { ascending: false })

      if (todayMeals) {
        setMealLogs(todayMeals)

        // Calcular totais do dia
        const totals = todayMeals.reduce(
          (acc, meal) => ({
            calories: acc.calories + (meal.calories || 0),
            protein: acc.protein + (meal.protein || 0),
            carbs: acc.carbs + (meal.carbs || 0),
            fat: acc.fat + (meal.fat || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        )

        setDailyNutrition({
          ...totals,
          calorieGoal,
          proteinGoal,
          carbsGoal,
          fatGoal,
        })

        // Atualizar dados do gráfico de pizza
        setMacrosData([
          { name: "Proteínas", value: totals.protein, color: "#8b5cf6" },
          { name: "Carboidratos", value: totals.carbs, color: "#ec4899" },
          { name: "Gorduras", value: totals.fat, color: "#f97316" },
        ])
      } else {
        setDailyNutrition({
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          calorieGoal,
          proteinGoal,
          carbsGoal,
          fatGoal,
        })
      }

      // 3. Buscar calorias da semana para o gráfico
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      
      const { data: weeklyData } = await supabase
        .from("daily_calories")
        .select("consumed, date")
        .eq("user_id", userId)
        .gte("date", oneWeekAgo.toISOString().split('T')[0])
        .order("date", { ascending: true })

      if (weeklyData && weeklyData.length > 0) {
        const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
        const formattedWeeklyData = weeklyData.map((record) => {
          const date = new Date(record.date)
          return {
            day: daysOfWeek[date.getDay()],
            calories: record.consumed
          }
        })
        setWeeklyCalories(formattedWeeklyData)
      } else {
        // Dados padrão se não houver registros
        setWeeklyCalories([
          { day: "Seg", calories: 0 },
          { day: "Ter", calories: 0 },
          { day: "Qua", calories: 0 },
          { day: "Qui", calories: 0 },
          { day: "Sex", calories: 0 },
          { day: "Sáb", calories: 0 },
          { day: "Dom", calories: 0 },
        ])
      }

    } catch (error) {
      console.error("Erro ao buscar dados nutricionais:", error)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const imageData = event.target?.result as string
        setSelectedImage(imageData)
        setAnalyzing(true)
        setMealAdded(false)
        
        try {
          // Análise REAL usando OpenAI Vision API
          const response = await fetch('/api/analyze-food', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: imageData }),
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.details || result.error || 'Erro ao analisar imagem')
          }
          
          setAnalyzing(false)
          setAnalysisResult({
            food: result.food,
            calories: Math.round(result.calories),
            protein: Math.round(result.protein),
            carbs: Math.round(result.carbs),
            fat: Math.round(result.fat),
            observations: result.observations
          })
        } catch (error: any) {
          console.error('Erro na análise:', error)
          setAnalyzing(false)
          
          // Mensagem de erro mais específica
          const errorMessage = error.message || 'Não foi possível analisar a imagem'
          
          setAnalysisResult({
            food: "Erro ao analisar imagem",
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            observations: errorMessage.includes('OPENAI_API_KEY') 
              ? "Configure a variável OPENAI_API_KEY para usar a análise de alimentos com IA."
              : `${errorMessage}. Tente novamente com uma foto mais clara do prato.`
          })
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddToDiary = async () => {
    if (!analysisResult || !userId) return

    try {
      setAddingToDiary(true)
      const today = new Date().toISOString().split('T')[0]

      // 1. Buscar ou criar registro de calorias do dia
      const { data: existingCalories, error: fetchError } = await supabase
        .from("daily_calories")
        .select("*")
        .eq("user_id", userId)
        .eq("date", today)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      if (existingCalories) {
        // Atualizar registro existente
        const newConsumed = existingCalories.consumed + analysisResult.calories
        
        await supabase
          .from("daily_calories")
          .update({ 
            consumed: newConsumed,
            updated_at: new Date().toISOString()
          })
          .eq("id", existingCalories.id)
      } else {
        // Criar novo registro
        await supabase
          .from("daily_calories")
          .insert({
            user_id: userId,
            date: today,
            consumed: analysisResult.calories,
            target: dailyNutrition.calorieGoal
          })
      }

      // 2. Registrar a refeição no histórico
      await supabase
        .from("meal_logs")
        .insert({
          user_id: userId,
          date: today,
          meal_name: analysisResult.food,
          calories: analysisResult.calories,
          protein: analysisResult.protein,
          carbs: analysisResult.carbs,
          fat: analysisResult.fat,
          image_url: selectedImage
        })

      setMealAdded(true)
      
      // Atualizar dados localmente
      await fetchNutritionData()
      
      // Notificar o componente pai para atualizar o dashboard
      if (onMealAdded) {
        onMealAdded()
      }

      // Limpar após 2 segundos
      setTimeout(() => {
        setSelectedImage(null)
        setAnalysisResult(null)
        setMealAdded(false)
      }, 2000)

    } catch (error) {
      console.error("Erro ao adicionar refeição:", error)
      alert("Erro ao adicionar refeição ao diário. Tente novamente.")
    } finally {
      setAddingToDiary(false)
    }
  }

  const calorieProgress = dailyNutrition.calorieGoal > 0 
    ? (dailyNutrition.calories / dailyNutrition.calorieGoal) * 100 
    : 0
  
  const proteinProgress = dailyNutrition.proteinGoal > 0 
    ? (dailyNutrition.protein / dailyNutrition.proteinGoal) * 100 
    : 0
  
  const carbsProgress = dailyNutrition.carbsGoal > 0 
    ? (dailyNutrition.carbs / dailyNutrition.carbsGoal) * 100 
    : 0
  
  const fatProgress = dailyNutrition.fatGoal > 0 
    ? (dailyNutrition.fat / dailyNutrition.fatGoal) * 100 
    : 0

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">FitCal - Análise Nutricional</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Identifique alimentos e conte calorias com IA</p>
      </div>

      {/* Daily Summary - Dados Reais sincronizados com a dieta */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border-orange-200 dark:border-orange-800">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Calorias Hoje</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{Math.round(dailyNutrition.calories)}</p>
          <p className="text-xs text-slate-500 mt-1">Meta: {dailyNutrition.calorieGoal} kcal</p>
          <div className="mt-3 h-2 bg-white dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-500"
              style={{ width: `${Math.min(calorieProgress, 100)}%` }}
            />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Proteínas</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{Math.round(dailyNutrition.protein)}g</p>
          <p className="text-xs text-slate-500 mt-1">Meta: {dailyNutrition.proteinGoal}g</p>
          <div className="mt-3 h-2 bg-white dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-400 to-pink-500 transition-all duration-500" 
              style={{ width: `${Math.min(proteinProgress, 100)}%` }}
            />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Carboidratos</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{Math.round(dailyNutrition.carbs)}g</p>
          <p className="text-xs text-slate-500 mt-1">Meta: {dailyNutrition.carbsGoal}g</p>
          <div className="mt-3 h-2 bg-white dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-400 to-cyan-500 transition-all duration-500" 
              style={{ width: `${Math.min(carbsProgress, 100)}%` }}
            />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Gorduras</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{Math.round(dailyNutrition.fat)}g</p>
          <p className="text-xs text-slate-500 mt-1">Meta: {dailyNutrition.fatGoal}g</p>
          <div className="mt-3 h-2 bg-white dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500" 
              style={{ width: `${Math.min(fatProgress, 100)}%` }}
            />
          </div>
        </Card>
      </div>

      {/* Food Analysis Upload */}
      <Card className="p-8 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-xl">
            <Camera className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Analise sua Refeição</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">Tire uma foto e a IA identificará os alimentos e nutrientes</p>
          
          <label htmlFor="food-upload" className="cursor-pointer">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <Camera className="w-5 h-5" />
              Fotografar Refeição
            </div>
            <input
              id="food-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </label>
        </div>

        {selectedImage && (
          <div className="mt-6 p-4 bg-white dark:bg-slate-900 rounded-2xl">
            <img src={selectedImage} alt="Food" className="w-full max-w-md mx-auto rounded-xl shadow-lg" />
            
            {analyzing && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                  <span className="font-medium">IA analisando sua refeição...</span>
                </div>
              </div>
            )}

            {analysisResult && !analyzing && (
              <div className="mt-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl border border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-lg mb-3 text-slate-900 dark:text-white">{analysisResult.food}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Calorias</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">{analysisResult.calories}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Proteínas</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">{analysisResult.protein}g</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Carboidratos</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">{analysisResult.carbs}g</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Gorduras</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">{analysisResult.fat}g</p>
                  </div>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  {analysisResult.observations}
                </p>
                <Button 
                  className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
                  onClick={handleAddToDiary}
                  disabled={addingToDiary || mealAdded}
                >
                  {mealAdded ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Adicionado com Sucesso!
                    </>
                  ) : addingToDiary ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                      Adicionando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar ao Diário
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Suggested Meals from Diet Plan */}
      {suggestedMeals.length > 0 && (
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Refeições Sugeridas pela sua Dieta</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Baseado no seu plano alimentar personalizado</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {suggestedMeals.slice(0, 3).map((meal, index) => (
              <div key={index} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <UtensilsCrossed className="w-4 h-4 text-blue-500" />
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white">{meal.name}</h4>
                </div>
                <p className="text-xs text-slate-500 mb-2">{meal.time}</p>
                <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                  <span>{meal.calories} kcal</span>
                  <span>P: {meal.protein}g</span>
                  <span>C: {meal.carbs}g</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Calories */}
        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Calorias Semanais</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyCalories}>
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
              <Bar dataKey="calories" fill="url(#colorBar)" radius={[8, 8, 0, 0]} />
              <defs>
                <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Macros Distribution */}
        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Distribuição de Macros</h3>
          {macrosData.some(m => m.value > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={macrosData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {macrosData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-slate-400">
              <p>Adicione refeições para ver a distribuição</p>
            </div>
          )}
        </Card>
      </div>

      {/* Meals Log */}
      <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Diário Alimentar</h3>
        </div>
        <div className="space-y-4">
          {mealLogs.length > 0 ? (
            mealLogs.map((meal) => (
              <div key={meal.id} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                  <UtensilsCrossed className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-slate-900 dark:text-white">{meal.meal_name}</h4>
                    <span className="text-sm text-slate-500">
                      {new Date(meal.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                    <span>{meal.calories} kcal</span>
                    <span>P: {meal.protein}g</span>
                    <span>C: {meal.carbs}g</span>
                    <span>G: {meal.fat}g</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-400">
              <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma refeição registrada hoje</p>
              <p className="text-sm mt-1">Adicione sua primeira refeição acima</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
