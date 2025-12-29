"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Camera, Upload, TrendingUp, Calendar, Download, Sparkles, ChevronLeft, ChevronRight } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts"
import { supabase } from "@/lib/supabase"

interface ProgressModuleProps {
  userId: string
}

interface BodyMetrics {
  weight_lost: number
  body_fat_reduced: number
  muscle_gained: number
  arms: number
  chest: number
  back: number
  abdomen: number
  legs: number
}

interface ProgressData {
  month: string
  weight: number
  bodyFat: number
}

interface MonthPhoto {
  month: number
  year: number
  photo_url: string | null
}

export default function ProgressModule({ userId }: ProgressModuleProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [monthPhotos, setMonthPhotos] = useState<MonthPhoto[]>([])
  const [selectedMonthPhoto, setSelectedMonthPhoto] = useState<string | null>(null)
  const [progressData, setProgressData] = useState<ProgressData[]>([])
  const [bodyMetrics, setBodyMetrics] = useState<BodyMetrics>({
    weight_lost: 0,
    body_fat_reduced: 0,
    muscle_gained: 0,
    arms: 0,
    chest: 0,
    back: 0,
    abdomen: 0,
    legs: 0
  })
  const [motivationalFeedback, setMotivationalFeedback] = useState("")
  const [loading, setLoading] = useState(true)
  const [totalPhotosUploaded, setTotalPhotosUploaded] = useState(0)

  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

  useEffect(() => {
    if (userId) {
      fetchProgressData()
    }
  }, [userId, currentMonth, currentYear])

  const fetchProgressData = async () => {
    try {
      setLoading(true)

      // Buscar fotos dos últimos 12 meses
      const photos: MonthPhoto[] = []
      const today = new Date()
      let photoCount = 0
      
      for (let i = 0; i < 12; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
        const month = date.getMonth() + 1
        const year = date.getFullYear()

        const { data } = await supabase
          .from("progress_photos")
          .select("photo_url")
          .eq("user_id", userId)
          .eq("month", month)
          .eq("year", year)
          .single()

        photos.push({
          month,
          year,
          photo_url: data?.photo_url || null
        })

        if (data?.photo_url) {
          photoCount++
        }
      }

      setMonthPhotos(photos)
      setTotalPhotosUploaded(photoCount)

      // Buscar métricas corporais do mês atual
      const { data: metrics } = await supabase
        .from("body_metrics")
        .select("*")
        .eq("user_id", userId)
        .eq("month", currentMonth)
        .eq("year", currentYear)
        .single()

      if (metrics) {
        setBodyMetrics({
          weight_lost: parseFloat(metrics.weight_lost) || 0,
          body_fat_reduced: parseFloat(metrics.body_fat_reduced) || 0,
          muscle_gained: parseFloat(metrics.muscle_gained) || 0,
          arms: parseFloat(metrics.arms) || 0,
          chest: parseFloat(metrics.chest) || 0,
          back: parseFloat(metrics.back) || 0,
          abdomen: parseFloat(metrics.abdomen) || 0,
          legs: parseFloat(metrics.legs) || 0
        })
      }

      // Buscar dados de peso dos últimos 6 meses para o gráfico
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      const { data: weightRecords } = await supabase
        .from("weight_records")
        .select("weight, date")
        .eq("user_id", userId)
        .gte("date", sixMonthsAgo.toISOString().split('T')[0])
        .order("date", { ascending: true })

      if (weightRecords && weightRecords.length > 0) {
        // Agrupar por mês
        const monthlyData: { [key: string]: { weight: number, count: number } } = {}
        
        weightRecords.forEach((record) => {
          const date = new Date(record.date)
          const monthKey = `${monthNames[date.getMonth()]}`
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { weight: 0, count: 0 }
          }
          
          monthlyData[monthKey].weight += parseFloat(record.weight)
          monthlyData[monthKey].count += 1
        })

        const formattedData = Object.entries(monthlyData).map(([month, data]) => ({
          month,
          weight: parseFloat((data.weight / data.count).toFixed(1)),
          bodyFat: 20 - (data.weight / data.count - 80) * 0.5 // Estimativa baseada no peso
        }))

        setProgressData(formattedData)
      }

      // Gerar feedback motivacional baseado nos dados e número de fotos
      generateMotivationalFeedback(metrics, photoCount)

    } catch (error) {
      console.error("Erro ao buscar dados de progresso:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateMotivationalFeedback = (metrics: any, photoCount: number) => {
    // Feedbacks baseados no número de fotos enviadas
    const feedbacksByPhotoCount = [
      // 0 fotos
      "📸 Comece sua jornada! Envie sua primeira foto de progresso para acompanhar sua evolução física.",
      // 1 foto
      "🎯 Ótimo começo! Você deu o primeiro passo. Continue enviando fotos mensalmente para ver sua transformação!",
      // 2 fotos
      "💪 Parabéns pela consistência! Duas fotos já mostram seu comprometimento. Continue assim!",
      // 3 fotos
      "🔥 Você está no caminho certo! Três meses de registro mostram sua dedicação. A transformação está acontecendo!",
      // 4 fotos
      "⭐ Incrível! Quatro meses de progresso registrado. Sua disciplina é inspiradora!",
      // 5 fotos
      "🚀 Cinco meses de evolução! Você está construindo um histórico sólido. Continue focado!",
      // 6 fotos
      "🎊 Meio ano de progresso documentado! Sua transformação está cada vez mais visível!",
      // 7 fotos
      "💎 Sete meses de dedicação! Você está provando que consistência traz resultados!",
      // 8 fotos
      "🌟 Oito meses de jornada! Sua evolução é notável. Continue registrando cada conquista!",
      // 9 fotos
      "🏆 Nove meses de transformação! Você está quase completando um ano de progresso!",
      // 10 fotos
      "✨ Dez meses de evolução! Sua dedicação é exemplar. Continue assim!",
      // 11 fotos
      "🎯 Onze meses de progresso! Você está a um passo de completar um ano inteiro de transformação!",
      // 12+ fotos
      "👑 Um ano completo de evolução! Você é um exemplo de disciplina e dedicação. Sua transformação é inspiradora!"
    ]

    // Se não há métricas, usar feedback baseado apenas em fotos
    if (!metrics) {
      const feedbackIndex = Math.min(photoCount, feedbacksByPhotoCount.length - 1)
      setMotivationalFeedback(feedbacksByPhotoCount[feedbackIndex])
      return
    }

    const weightLost = parseFloat(metrics.weight_lost) || 0
    const fatReduced = parseFloat(metrics.body_fat_reduced) || 0
    const muscleGained = parseFloat(metrics.muscle_gained) || 0

    // Feedbacks personalizados baseados em métricas E número de fotos
    const personalizedFeedbacks = [
      `🎉 Incrível! Você perdeu ${Math.abs(weightLost).toFixed(1)}kg e reduziu ${Math.abs(fatReduced).toFixed(1)}% de gordura. Com ${photoCount} ${photoCount === 1 ? 'foto' : 'fotos'} registradas, sua dedicação está dando resultados!`,
      `💪 Parabéns! Você ganhou ${muscleGained.toFixed(1)}kg de massa muscular. Suas ${photoCount} ${photoCount === 1 ? 'foto' : 'fotos'} mostram a evolução. Continue com o treino de força!`,
      `🔥 Excelente progresso! Com ${photoCount} ${photoCount === 1 ? 'mês' : 'meses'} de registro, você está ${Math.abs(weightLost).toFixed(1)}kg mais leve e mais forte!`,
      `⭐ Fantástico! Você reduziu ${Math.abs(fatReduced).toFixed(1)}% de gordura corporal. Suas ${photoCount} ${photoCount === 1 ? 'foto' : 'fotos'} mostram sua definição muscular aumentando!`,
      `🚀 Você está arrasando! ${Math.abs(weightLost).toFixed(1)}kg perdidos, ${muscleGained.toFixed(1)}kg de músculo ganho e ${photoCount} ${photoCount === 1 ? 'foto' : 'fotos'} de progresso!`,
      `🎯 Meta atingida! Com ${photoCount} ${photoCount === 1 ? 'registro' : 'registros'}, sua evolução este mês foi excepcional. Continue assim!`,
      `💎 Transformação incrível! Seus números e suas ${photoCount} ${photoCount === 1 ? 'foto' : 'fotos'} mostram dedicação e consistência!`,
      `🌟 Progresso consistente! Você perdeu ${Math.abs(weightLost).toFixed(1)}kg mantendo a massa muscular. ${photoCount} ${photoCount === 1 ? 'foto' : 'fotos'} de evolução!`,
      `🏆 Resultados impressionantes! Sua gordura caiu ${Math.abs(fatReduced).toFixed(1)}% e você ganhou ${muscleGained.toFixed(1)}kg de músculo em ${photoCount} ${photoCount === 1 ? 'mês' : 'meses'}!`,
      `✨ Evolução notável! Com ${photoCount} ${photoCount === 1 ? 'foto' : 'fotos'} registradas, você está ${Math.abs(weightLost).toFixed(1)}kg mais leve e sua definição melhorou muito!`,
      `🎊 Parabéns pela consistência! ${photoCount} ${photoCount === 1 ? 'mês' : 'meses'} de progresso mostram que você está no caminho certo!`,
      `💯 Excelente trabalho! Você reduziu ${Math.abs(fatReduced).toFixed(1)}% de gordura e ganhou força. ${photoCount} ${photoCount === 1 ? 'foto' : 'fotos'} de evolução!`
    ]

    // Se tem poucas fotos, priorizar feedback de incentivo para continuar registrando
    if (photoCount < 3) {
      const feedbackIndex = Math.min(photoCount, feedbacksByPhotoCount.length - 1)
      setMotivationalFeedback(feedbacksByPhotoCount[feedbackIndex])
    } else {
      // Com mais fotos, usar feedbacks personalizados com métricas
      const feedbackIndex = (currentMonth + currentYear + photoCount) % personalizedFeedbacks.length
      setMotivationalFeedback(personalizedFeedbacks[feedbackIndex])
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const imageUrl = event.target?.result as string
      setSelectedImage(imageUrl)
      setAnalyzing(true)

      // Simular análise da IA
      setTimeout(async () => {
        setAnalyzing(false)
        
        // Salvar foto no Supabase (automaticamente no histórico do mês atual)
        try {
          const today = new Date()
          const uploadMonth = today.getMonth() + 1
          const uploadYear = today.getFullYear()

          const { error } = await supabase
            .from("progress_photos")
            .upsert({
              user_id: userId,
              photo_url: imageUrl,
              month: uploadMonth,
              year: uploadYear,
              created_at: new Date().toISOString()
            }, {
              onConflict: "user_id,month,year"
            })

          if (!error) {
            // Atualizar lista de fotos e feedback
            await fetchProgressData()
            
            // Mostrar mensagem de sucesso
            console.log("✅ Foto salva automaticamente no histórico!")
          }
        } catch (error) {
          console.error("Erro ao salvar foto:", error)
        }
      }, 2000)
    }
    reader.readAsDataURL(file)
  }

  const handleMetricUpdate = async (field: keyof BodyMetrics, value: number) => {
    const updatedMetrics = { ...bodyMetrics, [field]: value }
    setBodyMetrics(updatedMetrics)

    try {
      await supabase
        .from("body_metrics")
        .upsert({
          user_id: userId,
          month: currentMonth,
          year: currentYear,
          ...updatedMetrics,
          updated_at: new Date().toISOString()
        }, {
          onConflict: "user_id,month,year"
        })

      // Atualizar gráficos e feedback
      fetchProgressData()
    } catch (error) {
      console.error("Erro ao atualizar métricas:", error)
    }
  }

  const openMonthPhoto = (photo: MonthPhoto) => {
    if (photo.photo_url) {
      setSelectedMonthPhoto(photo.photo_url)
    }
  }

  const radarData = [
    { metric: "Braços", value: bodyMetrics.arms, fullMark: 100 },
    { metric: "Peito", value: bodyMetrics.chest, fullMark: 100 },
    { metric: "Costas", value: bodyMetrics.back, fullMark: 100 },
    { metric: "Abdômen", value: bodyMetrics.abdomen, fullMark: 100 },
    { metric: "Pernas", value: bodyMetrics.legs, fullMark: 100 },
  ]

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
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Análise de Progresso</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Acompanhe sua evolução física com IA</p>
        </div>
        <Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg">
          <Download className="w-4 h-4 mr-2" />
          Relatório
        </Button>
      </div>

      {/* Upload Section */}
      <Card className="p-8 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-xl">
            <Camera className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Envie sua Foto de Progresso</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">A IA analisará sua evolução física e gerará insights personalizados</p>
          
          <label htmlFor="photo-upload" className="cursor-pointer">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <Upload className="w-5 h-5" />
              Fazer Upload de Foto
            </div>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </label>

          {totalPhotosUploaded > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-slate-900/50 rounded-full">
              <Camera className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {totalPhotosUploaded} {totalPhotosUploaded === 1 ? 'foto enviada' : 'fotos enviadas'}
              </span>
            </div>
          )}
        </div>

        {selectedImage && (
          <div className="mt-6 p-4 bg-white dark:bg-slate-900 rounded-2xl">
            <img src={selectedImage} alt="Progress" className="w-full max-w-md mx-auto rounded-xl shadow-lg" />
            {analyzing && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                  <span className="font-medium">IA analisando sua foto...</span>
                </div>
              </div>
            )}
            {!analyzing && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 text-green-600 dark:text-green-400">
                  <Sparkles className="w-5 h-5" />
                  <span className="font-medium">✅ Foto salva automaticamente no histórico!</span>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* AI Feedback - Atualizado dinamicamente */}
      <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white">Feedback</h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              {motivationalFeedback || "Continue registrando seus dados para receber feedback personalizado!"}
            </p>
          </div>
        </div>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weight & Body Fat Progress */}
        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            Evolução de Peso e Gordura
          </h3>
          {progressData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" />
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
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  name="Peso (kg)"
                  dot={{ fill: '#8b5cf6', r: 5 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="bodyFat" 
                  stroke="#ec4899" 
                  strokeWidth={3}
                  name="Gordura (%)"
                  dot={{ fill: '#ec4899', r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-400">
              <p>Registre seus dados para ver a evolução</p>
            </div>
          )}
        </Card>

        {/* Body Metrics Radar */}
        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-pink-500" />
            Análise Corporal por Região
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="metric" stroke="#94a3b8" />
              <PolarRadiusAxis stroke="#94a3b8" />
              <Radar 
                name="Desenvolvimento" 
                dataKey="value" 
                stroke="#8b5cf6" 
                fill="#8b5cf6" 
                fillOpacity={0.6} 
              />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Timeline - 12 meses */}
      <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-semibold mb-6 text-slate-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-500" />
          Histórico de Fotos (12 Meses)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {monthPhotos.map((photo, index) => (
            <div 
              key={index} 
              className="relative group cursor-pointer"
              onClick={() => openMonthPhoto(photo)}
            >
              <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-2xl overflow-hidden">
                {photo.photo_url ? (
                  <img 
                    src={photo.photo_url} 
                    alt={`${monthNames[photo.month - 1]} ${photo.year}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Camera className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {monthNames[photo.month - 1]}/{photo.year}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Modal para foto ampliada */}
      {selectedMonthPhoto && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedMonthPhoto(null)}
        >
          <div className="relative max-w-4xl w-full">
            <img 
              src={selectedMonthPhoto} 
              alt="Foto ampliada"
              className="w-full h-auto rounded-2xl shadow-2xl"
            />
            <Button
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm"
              onClick={() => setSelectedMonthPhoto(null)}
            >
              Fechar
            </Button>
          </div>
        </div>
      )}

      {/* Stats Summary - Editáveis */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Peso Perdido</p>
          <input
            type="number"
            step="0.1"
            value={bodyMetrics.weight_lost}
            onChange={(e) => handleMetricUpdate('weight_lost', parseFloat(e.target.value) || 0)}
            className="text-3xl font-bold text-slate-900 dark:text-white mb-2 bg-transparent border-b border-slate-300 dark:border-slate-700 focus:outline-none focus:border-purple-500 w-full"
          />
          <Progress value={Math.min(100, Math.abs(bodyMetrics.weight_lost) * 20)} className="h-2" />
          <p className="text-xs text-slate-400 mt-2">kg</p>
        </Card>

        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Gordura Reduzida</p>
          <input
            type="number"
            step="0.1"
            value={bodyMetrics.body_fat_reduced}
            onChange={(e) => handleMetricUpdate('body_fat_reduced', parseFloat(e.target.value) || 0)}
            className="text-3xl font-bold text-slate-900 dark:text-white mb-2 bg-transparent border-b border-slate-300 dark:border-slate-700 focus:outline-none focus:border-purple-500 w-full"
          />
          <Progress value={Math.min(100, Math.abs(bodyMetrics.body_fat_reduced) * 25)} className="h-2" />
          <p className="text-xs text-slate-400 mt-2">%</p>
        </Card>

        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Massa Muscular</p>
          <input
            type="number"
            step="0.1"
            value={bodyMetrics.muscle_gained}
            onChange={(e) => handleMetricUpdate('muscle_gained', parseFloat(e.target.value) || 0)}
            className="text-3xl font-bold text-slate-900 dark:text-white mb-2 bg-transparent border-b border-slate-300 dark:border-slate-700 focus:outline-none focus:border-purple-500 w-full"
          />
          <Progress value={Math.min(100, bodyMetrics.muscle_gained * 33)} className="h-2" />
          <p className="text-xs text-slate-400 mt-2">kg</p>
        </Card>
      </div>

      {/* Métricas por região - Editáveis */}
      <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Desenvolvimento por Região (%)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { key: 'arms', label: 'Braços' },
            { key: 'chest', label: 'Peito' },
            { key: 'back', label: 'Costas' },
            { key: 'abdomen', label: 'Abdômen' },
            { key: 'legs', label: 'Pernas' }
          ].map((region) => (
            <div key={region.key}>
              <label className="text-sm text-slate-500 dark:text-slate-400 mb-2 block">
                {region.label}
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={bodyMetrics[region.key as keyof BodyMetrics]}
                onChange={(e) => handleMetricUpdate(region.key as keyof BodyMetrics, parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-purple-500 text-slate-900 dark:text-white"
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
