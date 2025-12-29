"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, RotateCcw, Dumbbell, Clock, Flame, Target, ChevronRight, ChevronDown, Sparkles, Zap, TrendingUp, Award, CheckCircle2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

// Treinos Personalizados
// Princípios: Sobrecarga Progressiva, Periodização, Recuperação Adequada, Técnica Perfeita

interface WorkoutModuleProps {
  userId: string
  onWorkoutComplete?: () => void
}

// Plano Semanal Completo
// Divisão ABCDEF com foco em hipertrofia e recuperação otimizada
const weeklyPlanTemplate = [
  { 
    day: "Segunda", 
    focus: "Treino A - Peito e Tríceps", 
    duration: "50 min",
    calories: 420,
    difficulty: "Intermediário",
    methodology: "Volume Progressivo",
    exercises: [
      {
        id: 101,
        name: "Supino Reto com Barra",
        sets: 4,
        reps: "8-10",
        rest: "90s",
        load: "Progressiva",
        videoUrl: "https://www.youtube.com/embed/rT7DgCr-3pg",
        tips: [
          "Pegada na largura dos ombros",
          "Desça controlado até o peito (3 segundos)",
          "Explosão na subida (1 segundo)",
          "Mantenha escápulas retraídas"
        ],
        technique: "Tempo sob tensão: 3-0-1-0"
      },
      {
        id: 102,
        name: "Supino Inclinado com Halteres",
        sets: 3,
        reps: "10-12",
        rest: "75s",
        load: "Moderada",
        videoUrl: "https://www.youtube.com/embed/8iPEnn-ltC8",
        tips: [
          "Inclinação de 30-45 graus",
          "Amplitude completa de movimento",
          "Rotação leve dos punhos no topo",
          "Foco na parte superior do peito"
        ],
        technique: "Contração de pico no topo"
      },
      {
        id: 103,
        name: "Crucifixo Inclinado",
        sets: 3,
        reps: "12-15",
        rest: "60s",
        load: "Leve-Moderada",
        videoUrl: "https://www.youtube.com/embed/eozdVDA78K0",
        tips: [
          "Cotovelos levemente flexionados (15-20°)",
          "Alongamento máximo na descida",
          "Contração intensa no centro",
          "Movimento em arco controlado"
        ],
        technique: "Ênfase na fase excêntrica"
      },
      {
        id: 104,
        name: "Tríceps Testa com Barra W",
        sets: 4,
        reps: "10-12",
        rest: "60s",
        load: "Moderada",
        videoUrl: "https://www.youtube.com/embed/d_KZxkY_0cM",
        tips: [
          "Cotovelos fixos e apontando para cima",
          "Movimento apenas do antebraço",
          "Desça até a testa/topo da cabeça",
          "Extensão completa no topo"
        ],
        technique: "Isometria de 1s no topo"
      },
      {
        id: 105,
        name: "Tríceps Corda na Polia Alta",
        sets: 3,
        reps: "15-20",
        rest: "45s",
        load: "Moderada-Alta",
        videoUrl: "https://www.youtube.com/embed/2-LAMcpzODU",
        tips: [
          "Abra a corda no final do movimento",
          "Cotovelos colados ao corpo",
          "Contração máxima por 2 segundos",
          "Controle total na volta"
        ],
        technique: "Drop set na última série"
      }
    ]
  },
  { 
    day: "Terça", 
    focus: "Treino B - Costas e Bíceps", 
    duration: "55 min",
    calories: 450,
    difficulty: "Intermediário",
    methodology: "Intensidade Controlada",
    exercises: [
      {
        id: 201,
        name: "Barra Fixa Pegada Pronada",
        sets: 4,
        reps: "6-10",
        rest: "120s",
        load: "Peso Corporal + Adicional",
        videoUrl: "https://www.youtube.com/embed/eGo4IYlbE5g",
        tips: [
          "Pegada na largura dos ombros",
          "Desça até extensão completa",
          "Puxe até o queixo passar a barra",
          "Escápulas em depressão"
        ],
        technique: "Negativa de 3 segundos"
      },
      {
        id: 202,
        name: "Remada Curvada com Barra",
        sets: 4,
        reps: "8-10",
        rest: "90s",
        load: "Progressiva",
        videoUrl: "https://www.youtube.com/embed/FWJR5Ve8bnQ",
        tips: [
          "Costas paralelas ao chão",
          "Puxe a barra até o abdômen",
          "Cotovelos próximos ao corpo",
          "Contração das escápulas"
        ],
        technique: "Pausa de 1s no topo"
      },
      {
        id: 203,
        name: "Rosca Direta com Barra",
        sets: 4,
        reps: "8-10",
        rest: "60s",
        load: "Moderada-Alta",
        videoUrl: "https://www.youtube.com/embed/kwG2ipFRgfo",
        tips: [
          "Cotovelos fixos ao lado do corpo",
          "Movimento controlado",
          "Contração máxima no topo",
          "Sem balanço do corpo"
        ],
        technique: "Supinação progressiva"
      },
      {
        id: 204,
        name: "Rosca Martelo Alternada",
        sets: 3,
        reps: "10-12",
        rest: "60s",
        load: "Moderada",
        videoUrl: "https://www.youtube.com/embed/zC3nLlEvin4",
        tips: [
          "Pegada neutra (martelo)",
          "Alterna os braços",
          "Cotovelos estáveis",
          "Foco no braquial"
        ],
        technique: "Contração isométrica"
      }
    ]
  },
  { 
    day: "Quarta", 
    focus: "Treino C - Pernas Completo", 
    duration: "60 min",
    calories: 520,
    difficulty: "Avançado",
    methodology: "Alta Intensidade",
    exercises: [
      {
        id: 301,
        name: "Agachamento Livre com Barra",
        sets: 5,
        reps: "6-8",
        rest: "150s",
        load: "Progressiva Pesada",
        videoUrl: "https://www.youtube.com/embed/ultWZbUMPL8",
        tips: [
          "Desça até paralelo ou abaixo",
          "Joelhos alinhados com os pés",
          "Costas retas durante todo movimento",
          "Olhar para frente"
        ],
        technique: "Tempo: 3-0-1-0"
      },
      {
        id: 302,
        name: "Leg Press 45°",
        sets: 4,
        reps: "10-12",
        rest: "90s",
        load: "Alta",
        videoUrl: "https://www.youtube.com/embed/IZxyjW7MPJQ",
        tips: [
          "Pés na largura dos ombros",
          "Desça controlado até 90°",
          "Não trave os joelhos",
          "Pressione com o calcanhar"
        ],
        technique: "1 e 1/4 de repetição"
      },
      {
        id: 303,
        name: "Stiff com Barra",
        sets: 4,
        reps: "10-12",
        rest: "90s",
        load: "Moderada-Alta",
        videoUrl: "https://www.youtube.com/embed/1uDiW5--rAE",
        tips: [
          "Joelhos levemente flexionados",
          "Desça até sentir alongamento",
          "Costas retas sempre",
          "Foco nos posteriores"
        ],
        technique: "Pausa no alongamento"
      },
      {
        id: 304,
        name: "Cadeira Extensora",
        sets: 3,
        reps: "12-15",
        rest: "60s",
        load: "Moderada",
        videoUrl: "https://www.youtube.com/embed/YyvSfVjQeL0",
        tips: [
          "Movimento controlado",
          "Contração de 2s no topo",
          "Não balance o corpo",
          "Foco no quadríceps"
        ],
        technique: "Drop set final"
      }
    ]
  },
  { 
    day: "Quinta", 
    focus: "Treino D - Ombros e Abdômen", 
    duration: "45 min",
    calories: 380,
    difficulty: "Intermediário",
    methodology: "Volume Moderado",
    exercises: [
      {
        id: 401,
        name: "Desenvolvimento com Barra",
        sets: 4,
        reps: "8-10",
        rest: "90s",
        load: "Progressiva",
        videoUrl: "https://www.youtube.com/embed/2yjwXTZQDDI",
        tips: [
          "Barra na altura do queixo",
          "Suba até extensão completa",
          "Não arqueie as costas",
          "Core ativado"
        ],
        technique: "Pausa de 1s no topo"
      },
      {
        id: 402,
        name: "Elevação Lateral com Halteres",
        sets: 4,
        reps: "12-15",
        rest: "60s",
        load: "Leve-Moderada",
        videoUrl: "https://www.youtube.com/embed/3VcKaXpzqRo",
        tips: [
          "Cotovelos levemente flexionados",
          "Suba até altura dos ombros",
          "Controle na descida (3s)",
          "Sem balanço"
        ],
        technique: "Negativa lenta"
      },
      {
        id: 403,
        name: "Elevação Frontal Alternada",
        sets: 3,
        reps: "10-12",
        rest: "60s",
        load: "Moderada",
        videoUrl: "https://www.youtube.com/embed/qzz2essGHsM",
        tips: [
          "Alterna os braços",
          "Suba até altura dos olhos",
          "Movimento controlado",
          "Foco no deltoide anterior"
        ],
        technique: "Isometria alternada"
      },
      {
        id: 404,
        name: "Abdominal Supra",
        sets: 4,
        reps: "20-25",
        rest: "45s",
        load: "Peso Corporal",
        videoUrl: "https://www.youtube.com/embed/Xyd_fa5zoEU",
        tips: [
          "Contraia o abdômen",
          "Não puxe o pescoço",
          "Movimento curto e intenso",
          "Expire na contração"
        ],
        technique: "Contração de 2s"
      }
    ]
  },
  { 
    day: "Sexta", 
    focus: "Treino E - Braços Completo", 
    duration: "45 min",
    calories: 360,
    difficulty: "Intermediário",
    methodology: "Pump e Congestão",
    exercises: [
      {
        id: 501,
        name: "Rosca Direta com Barra",
        sets: 4,
        reps: "10-12",
        rest: "60s",
        load: "Moderada",
        videoUrl: "https://www.youtube.com/embed/kwG2ipFRgfo",
        tips: [
          "Cotovelos fixos",
          "Movimento completo",
          "Contração no topo",
          "Sem balanço"
        ],
        technique: "21s (7+7+7)"
      },
      {
        id: 502,
        name: "Tríceps Testa",
        sets: 4,
        reps: "10-12",
        rest: "60s",
        load: "Moderada",
        videoUrl: "https://www.youtube.com/embed/d_KZxkY_0cM",
        tips: [
          "Cotovelos fixos",
          "Extensão completa",
          "Controle total",
          "Isometria no topo"
        ],
        technique: "Pausa de 1s"
      },
      {
        id: 503,
        name: "Rosca Martelo",
        sets: 3,
        reps: "12-15",
        rest: "45s",
        load: "Moderada",
        videoUrl: "https://www.youtube.com/embed/zC3nLlEvin4",
        tips: [
          "Pegada neutra",
          "Movimento simultâneo",
          "Foco no braquial",
          "Contração intensa"
        ],
        technique: "Super set com tríceps"
      },
      {
        id: 504,
        name: "Tríceps Corda",
        sets: 3,
        reps: "15-20",
        rest: "45s",
        load: "Moderada-Alta",
        videoUrl: "https://www.youtube.com/embed/2-LAMcpzODU",
        tips: [
          "Abra a corda no final",
          "Cotovelos fixos",
          "Contração de 2s",
          "Controle na volta"
        ],
        technique: "Drop set final"
      }
    ]
  },
  { 
    day: "Sábado", 
    focus: "Treino F - HIIT Metabólico", 
    duration: "35 min",
    calories: 380,
    difficulty: "Avançado",
    methodology: "Condicionamento",
    exercises: [
      {
        id: 601,
        name: "Burpees",
        sets: 5,
        reps: "15-20",
        rest: "60s",
        load: "Peso Corporal",
        videoUrl: "https://www.youtube.com/embed/TU8QYVW0gDU",
        tips: [
          "Movimento explosivo",
          "Mantenha o ritmo",
          "Respire corretamente",
          "Aterrisse suave"
        ],
        technique: "Máxima intensidade"
      },
      {
        id: 602,
        name: "Mountain Climbers",
        sets: 5,
        reps: "40s",
        rest: "45s",
        load: "Peso Corporal",
        videoUrl: "https://www.youtube.com/embed/nmwgirgXLYM",
        tips: [
          "Core ativado",
          "Movimento rápido",
          "Quadril alinhado",
          "Respiração ritmada"
        ],
        technique: "Alta velocidade"
      },
      {
        id: 603,
        name: "Jump Squats",
        sets: 4,
        reps: "15-20",
        rest: "60s",
        load: "Peso Corporal",
        videoUrl: "https://www.youtube.com/embed/CVaEhXotL7M",
        tips: [
          "Agachamento completo",
          "Salto explosivo",
          "Aterrisse suave",
          "Joelhos alinhados"
        ],
        technique: "Potência máxima"
      }
    ]
  },
  { 
    day: "Domingo", 
    focus: "Recuperação Ativa", 
    duration: "40 min",
    calories: 180,
    difficulty: "Leve",
    methodology: "Regeneração",
    exercises: [
      {
        id: 701,
        name: "Caminhada Leve",
        sets: 1,
        reps: "30 min",
        rest: "0s",
        load: "Baixa Intensidade",
        videoUrl: "https://www.youtube.com/embed/FHy0delMC8I",
        tips: [
          "Ritmo confortável (60-70% FC máx)",
          "Aproveite o ar livre",
          "Mantenha-se hidratado",
          "Foco na recuperação"
        ],
        technique: "Zona aeróbica leve"
      },
      {
        id: 702,
        name: "Alongamento Completo",
        sets: 1,
        reps: "15 min",
        rest: "0s",
        load: "Mobilidade",
        videoUrl: "https://www.youtube.com/embed/g_tea8ZNk5A",
        tips: [
          "Movimentos suaves",
          "Respire profundamente",
          "Não force além do conforto",
          "Foco em grupos trabalhados"
        ],
        technique: "Alongamento estático"
      },
      {
        id: 703,
        name: "Yoga Restaurativo",
        sets: 1,
        reps: "20 min",
        rest: "0s",
        load: "Relaxamento",
        videoUrl: "https://www.youtube.com/embed/sTANio_2E0Q",
        tips: [
          "Posturas de descanso",
          "Respiração consciente",
          "Relaxamento muscular",
          "Meditação leve"
        ],
        technique: "Recuperação mental"
      }
    ]
  },
]

export default function WorkoutModule({ userId, onWorkoutComplete }: WorkoutModuleProps) {
  const [activeExercise, setActiveExercise] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [timer, setTimer] = useState(0)
  const [expandedDay, setExpandedDay] = useState<number | null>(null)
  const [weeklyPlan, setWeeklyPlan] = useState(weeklyPlanTemplate)
  const [completedWorkouts, setCompletedWorkouts] = useState<Set<string>>(new Set())
  const [todayCompleted, setTodayCompleted] = useState(false)
  const [todayWorkout, setTodayWorkout] = useState(weeklyPlanTemplate[0])

  // Função para obter o treino do dia atual
  const getTodayWorkout = () => {
    const dayIndex = new Date().getDay() // 0 = Domingo, 1 = Segunda, etc.
    const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]
    const currentDayName = dayNames[dayIndex]
    
    const workout = weeklyPlanTemplate.find(w => w.day === currentDayName)
    return workout || weeklyPlanTemplate[0] // Fallback para Segunda se não encontrar
  }

  // Atualizar treino do dia ao montar o componente
  useEffect(() => {
    const workout = getTodayWorkout()
    setTodayWorkout(workout)
  }, [])

  // Carregar status dos treinos do Supabase
  useEffect(() => {
    if (userId) {
      loadWorkoutStatus()
    }
  }, [userId])

  const loadWorkoutStatus = async () => {
    try {
      const startOfWeek = new Date()
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
      
      const { data: workoutLogs } = await supabase
        .from("workout_logs")
        .select("workout_day, date")
        .eq("user_id", userId)
        .gte("date", startOfWeek.toISOString().split('T')[0])

      if (workoutLogs && workoutLogs.length > 0) {
        const completed = new Set(workoutLogs.map(log => log.workout_day))
        setCompletedWorkouts(completed)
        
        // Verificar se o treino de hoje já foi concluído
        const currentDay = getCurrentDayName()
        setTodayCompleted(completed.has(currentDay))
        
        // Atualizar status visual do plano semanal
        setWeeklyPlan(prev => prev.map(day => ({
          ...day,
          status: completed.has(day.day) ? 'completed' : 
                  day.day === currentDay ? 'today' : 'pending'
        })))
      }
    } catch (error) {
      console.error("Erro ao carregar status dos treinos:", error)
    }
  }

  const getCurrentDayName = () => {
    const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]
    return days[new Date().getDay()]
  }

  const handleCompleteWorkout = async (dayName?: string) => {
    try {
      const workoutDay = dayName || getCurrentDayName()
      const today = new Date().toISOString().split('T')[0]
      
      // Verificar se já existe registro para hoje
      const { data: existingLog } = await supabase
        .from("workout_logs")
        .select("id")
        .eq("user_id", userId)
        .eq("workout_day", workoutDay)
        .eq("date", today)
        .single()

      if (!existingLog) {
        // Inserir novo log de treino
        const { error } = await supabase
          .from("workout_logs")
          .insert({
            user_id: userId,
            workout_day: workoutDay,
            date: today,
            completed: true
          })

        if (error) throw error

        // Atualizar estado local
        setCompletedWorkouts(prev => new Set([...prev, workoutDay]))
        
        // Se for o treino de hoje, marcar como concluído
        if (workoutDay === getCurrentDayName()) {
          setTodayCompleted(true)
        }
        
        // Atualizar visual
        setWeeklyPlan(prev => prev.map(day => ({
          ...day,
          status: day.day === workoutDay ? 'completed' : day.status
        })))

        // Notificar componente pai (Dashboard) para atualizar
        if (onWorkoutComplete) {
          onWorkoutComplete()
        }

        alert(`✅ Treino de ${workoutDay} concluído com sucesso!`)
      } else {
        alert("Você já completou este treino hoje!")
      }
    } catch (error) {
      console.error("Erro ao completar treino:", error)
      alert("Erro ao salvar treino. Tente novamente.")
    }
  }

  // Timer funcional com useEffect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isPlaying && activeExercise !== null) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1)
      }, 1000)
    } else if (!isPlaying && interval) {
      clearInterval(interval)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isPlaying, activeExercise])

  const startWorkout = (exerciseId: number) => {
    if (activeExercise === exerciseId) {
      // Se já está ativo, apenas pausa/resume
      setIsPlaying(!isPlaying)
    } else {
      // Inicia novo exercício
      setActiveExercise(exerciseId)
      setIsPlaying(true)
      setTimer(0)
    }
  }

  const resetTimer = () => {
    setTimer(0)
    setIsPlaying(false)
  }

  const toggleDay = (index: number) => {
    setExpandedDay(expandedDay === index ? null : index)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 bg-clip-text text-transparent">
            Treinos Personalizados
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Seu plano de treino completo</p>
          <Badge className="mt-2 bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0">
            <Award className="w-3 h-3 mr-1" />
            Hipertrofia & Performance
          </Badge>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 flex items-center justify-center shadow-2xl animate-pulse">
          <TrendingUp className="w-7 h-7 text-white" />
        </div>
      </div>

      {/* Today's Workout Card - Design Moderno com Atualização Diária */}
      <Card className="p-6 bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 text-white border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-[1.02]">
        <div className="flex items-start justify-between mb-4">
          <div>
            <Badge className="bg-white/30 backdrop-blur-sm text-white border-0 mb-3 shadow-lg">
              🔥 Treino de Hoje - {getCurrentDayName()}
            </Badge>
            <h3 className="text-2xl font-bold mb-2">{todayWorkout.focus}</h3>
            <p className="text-sm text-white/80 mb-3">{todayWorkout.methodology}</p>
            <div className="flex items-center gap-3 text-sm flex-wrap">
              <span className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                <Clock className="w-4 h-4" />
                {todayWorkout.duration}
              </span>
              <span className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                <Flame className="w-4 h-4" />
                {todayWorkout.calories} kcal
              </span>
              <span className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                <Target className="w-4 h-4" />
                {todayWorkout.difficulty}
              </span>
            </div>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
            <Dumbbell className="w-8 h-8" />
          </div>
        </div>
        
        {/* Botões de Ação */}
        <div className="space-y-3">
          <Button 
            className="w-full bg-white text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 hover:bg-white/90 font-bold shadow-2xl text-lg py-6 hover:scale-105 transition-all duration-300"
            size="lg"
            onClick={() => startWorkout(todayWorkout.exercises[0].id)}
            disabled={todayCompleted}
          >
            <Play className="w-6 h-6 mr-2 text-orange-500" />
            <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 bg-clip-text text-transparent font-bold">
              {todayCompleted ? "Treino Concluído Hoje" : "Iniciar Treino Agora"}
            </span>
          </Button>
          
          {!todayCompleted && (
            <Button 
              className="w-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 font-semibold shadow-lg hover:scale-105 transition-all duration-300 border-2 border-white/30"
              size="lg"
              onClick={() => handleCompleteWorkout()}
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Marcar Treino como Concluído
            </Button>
          )}
          
          {todayCompleted && (
            <div className="flex items-center justify-center gap-2 text-white/90 text-sm bg-white/20 backdrop-blur-sm rounded-lg py-3">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-semibold">Parabéns! Você já treinou hoje 🎉</span>
            </div>
          )}
        </div>
      </Card>

      {/* Weekly Plan */}
      <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-500" />
            Plano Semanal - Divisão ABCDEF
          </h3>
          <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
            Periodização Inteligente
          </Badge>
        </div>
        <div className="space-y-2">
          {weeklyPlan.map((day, index) => (
            <div key={index}>
              <div 
                className={`flex items-center justify-between p-4 rounded-xl transition-all cursor-pointer hover:scale-[1.02] ${
                  day.day === getCurrentDayName()
                    ? 'bg-gradient-to-r from-orange-50 via-pink-50 to-purple-50 dark:from-orange-950/30 dark:via-pink-950/30 dark:to-purple-950/30 border-2 border-orange-300 dark:border-orange-700 shadow-lg' 
                    : completedWorkouts.has(day.day)
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-300 dark:border-green-700'
                    : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-700'
                }`}
                onClick={() => toggleDay(index)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                    day.day === getCurrentDayName()
                      ? 'bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600'
                      : completedWorkouts.has(day.day)
                      ? 'bg-gradient-to-br from-green-400 to-emerald-500'
                      : 'bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700'
                  }`}>
                    {completedWorkouts.has(day.day) ? (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : (
                      <Dumbbell className={`w-5 h-5 ${day.day === getCurrentDayName() ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`} />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{day.day}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{day.focus}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">{day.methodology}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {day.day === getCurrentDayName() && (
                    <Badge className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white border-0 shadow-lg">
                      🎯 Hoje
                    </Badge>
                  )}
                  {completedWorkouts.has(day.day) && (
                    <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white border-0 shadow-lg">
                      ✓ Concluído
                    </Badge>
                  )}
                  {expandedDay === index ? (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Exercícios do Dia Expandido */}
              {expandedDay === index && (
                <div className="mt-2 ml-4 space-y-3 animate-in fade-in duration-300">
                  {/* Info do Treino */}
                  <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-3 ml-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {day.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Flame className="w-4 h-4" />
                      {day.calories} kcal
                    </span>
                  </div>

                  {/* Lista de Exercícios */}
                  {day.exercises.map((exercise, exerciseIndex) => (
                    <Card 
                      key={exercise.id}
                      className={`overflow-hidden transition-all duration-300 hover:shadow-2xl ${
                        activeExercise === exercise.id 
                          ? 'ring-2 ring-orange-500 shadow-2xl scale-[1.02]' 
                          : 'border-slate-200 dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-700'
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0 text-white font-bold shadow-lg text-sm">
                              {exerciseIndex + 1}
                            </div>
                            <div>
                              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">{exercise.name}</h4>
                              <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 flex-wrap">
                                <span className="bg-orange-100 dark:bg-orange-950/30 px-2 py-1 rounded-lg">{exercise.sets} séries</span>
                                <span>•</span>
                                <span className="bg-pink-100 dark:bg-pink-950/30 px-2 py-1 rounded-lg">{exercise.reps} reps</span>
                                <span>•</span>
                                <span className="bg-purple-100 dark:bg-purple-950/30 px-2 py-1 rounded-lg">{exercise.rest}</span>
                                <span>•</span>
                                <span className="bg-blue-100 dark:bg-blue-950/30 px-2 py-1 rounded-lg">{exercise.load}</span>
                              </div>
                              {exercise.technique && (
                                <p className="text-xs text-slate-500 dark:text-slate-500 mt-2 italic">
                                  💡 {exercise.technique}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant={activeExercise === exercise.id ? "default" : "outline"}
                            className={`${
                              activeExercise === exercise.id 
                                ? "bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white shadow-lg hover:shadow-xl" 
                                : "hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:border-orange-300"
                            } transition-all duration-300`}
                            onClick={() => startWorkout(exercise.id)}
                          >
                            {activeExercise === exercise.id && isPlaying ? (
                              <>
                                <Pause className="w-4 h-4 mr-2" />
                                Pausar
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                Iniciar
                              </>
                            )}
                          </Button>
                        </div>

                        {activeExercise === exercise.id && (
                          <div className="mt-4 space-y-4 animate-in fade-in duration-300">
                            {/* Video Player */}
                            <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden shadow-2xl ring-2 ring-orange-500/50">
                              <iframe
                                width="100%"
                                height="100%"
                                src={exercise.videoUrl}
                                title={exercise.name}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="w-full h-full"
                              />
                            </div>

                            {/* Timer - Funcional */}
                            <div className="flex items-center justify-center gap-4 p-6 bg-gradient-to-r from-orange-50 via-pink-50 to-purple-50 dark:from-orange-950/30 dark:via-pink-950/30 dark:to-purple-950/30 rounded-xl border-2 border-orange-200 dark:border-orange-800 shadow-lg">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={resetTimer}
                                className="hover:bg-white dark:hover:bg-slate-800 hover:border-orange-300"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                              <div className="text-center">
                                <p className="text-4xl font-bold bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                                  {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">Tempo de treino</p>
                              </div>
                              <Button 
                                size="sm" 
                                className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300"
                                onClick={() => setIsPlaying(!isPlaying)}
                              >
                                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                              </Button>
                            </div>

                            {/* Tips */}
                            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl border-2 border-green-300 dark:border-green-700 shadow-lg">
                              <h5 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-green-500" />
                                Dicas de Execução
                              </h5>
                              <ul className="space-y-2">
                                {exercise.tips.map((tip, i) => (
                                  <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                                    <span className="text-green-500 mt-0.5 font-bold">✓</span>
                                    {tip}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}

                  {/* Botão para Concluir Treino do Dia */}
                  {!completedWorkouts.has(day.day) && (
                    <Button
                      className="w-full bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 mt-4"
                      onClick={() => handleCompleteWorkout(day.day)}
                    >
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Marcar Treino como Concluído
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Exercise List - Treino de Hoje Detalhado */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-orange-500" />
          Exercícios do Treino de Hoje
        </h3>
        {todayWorkout.exercises.map((exercise, index) => (
          <Card 
            key={exercise.id}
            className={`overflow-hidden transition-all duration-300 hover:shadow-2xl ${
              activeExercise === exercise.id 
                ? 'ring-2 ring-orange-500 shadow-2xl scale-[1.02]' 
                : 'border-slate-200 dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-700'
            }`}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0 text-white font-bold shadow-lg">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">{exercise.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 flex-wrap">
                      <span className="bg-orange-100 dark:bg-orange-950/30 px-2 py-1 rounded-lg">{exercise.sets} séries</span>
                      <span>•</span>
                      <span className="bg-pink-100 dark:bg-pink-950/30 px-2 py-1 rounded-lg">{exercise.reps} reps</span>
                      <span>•</span>
                      <span className="bg-purple-100 dark:bg-purple-950/30 px-2 py-1 rounded-lg">Descanso: {exercise.rest}</span>
                      <span>•</span>
                      <span className="bg-blue-100 dark:bg-blue-950/30 px-2 py-1 rounded-lg">{exercise.load}</span>
                    </div>
                    {exercise.technique && (
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-2 italic">
                        💡 Técnica: {exercise.technique}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={activeExercise === exercise.id ? "default" : "outline"}
                  className={`${
                    activeExercise === exercise.id 
                      ? "bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white shadow-lg hover:shadow-xl" 
                      : "hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:border-orange-300"
                  } transition-all duration-300`}
                  onClick={() => startWorkout(exercise.id)}
                >
                  {activeExercise === exercise.id && isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Pausar
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Iniciar
                    </>
                  )}
                </Button>
              </div>

              {activeExercise === exercise.id && (
                <div className="mt-4 space-y-4 animate-in fade-in duration-300">
                  {/* Video Player */}
                  <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden shadow-2xl ring-2 ring-orange-500/50">
                    <iframe
                      width="100%"
                      height="100%"
                      src={exercise.videoUrl}
                      title={exercise.name}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    />
                  </div>

                  {/* Timer - Funcional */}
                  <div className="flex items-center justify-center gap-4 p-6 bg-gradient-to-r from-orange-50 via-pink-50 to-purple-50 dark:from-orange-950/30 dark:via-pink-950/30 dark:to-purple-950/30 rounded-xl border-2 border-orange-200 dark:border-orange-800 shadow-lg">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={resetTimer}
                      className="hover:bg-white dark:hover:bg-slate-800 hover:border-orange-300"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <div className="text-center">
                      <p className="text-4xl font-bold bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                        {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">Tempo de treino</p>
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                  </div>

                  {/* Tips */}
                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl border-2 border-green-300 dark:border-green-700 shadow-lg">
                    <h5 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-green-500" />
                      Dicas de Execução
                    </h5>
                    <ul className="space-y-2">
                      {exercise.tips.map((tip, i) => (
                        <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                          <span className="text-green-500 mt-0.5 font-bold">✓</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Metodologia Card */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 dark:from-blue-950/30 dark:via-cyan-950/30 dark:to-teal-950/30 border-2 border-blue-300 dark:border-blue-700 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 via-cyan-500 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-lg">
            <Award className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 text-slate-900 dark:text-white flex items-center gap-2">
              📚 Princípios de Treinamento
            </h3>
            <div className="space-y-2 text-slate-700 dark:text-slate-300 text-sm">
              <p className="leading-relaxed">
                <strong>Sobrecarga Progressiva:</strong> Aumento gradual de carga, volume ou intensidade a cada semana para estimular adaptações contínuas.
              </p>
              <p className="leading-relaxed">
                <strong>Periodização Inteligente:</strong> Divisão ABCDEF com foco específico em cada grupo muscular, permitindo recuperação adequada.
              </p>
              <p className="leading-relaxed">
                <strong>Tempo Sob Tensão:</strong> Controle da velocidade de execução (ex: 3-0-1-0) para maximizar estímulo muscular.
              </p>
              <p className="leading-relaxed">
                <strong>Técnicas Avançadas:</strong> Drop sets, super sets, pausas isométricas e negativas lentas para intensificar o treino.
              </p>
              <p className="leading-relaxed">
                <strong>Recuperação Ativa:</strong> Domingo dedicado à regeneração com caminhada, alongamento e yoga para otimizar resultados.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
