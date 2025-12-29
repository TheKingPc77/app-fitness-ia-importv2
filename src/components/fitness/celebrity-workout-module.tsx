"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Star, 
  Dumbbell, 
  Clock, 
  Flame, 
  TrendingUp,
  Play,
  CheckCircle2,
  Trophy,
  Sparkles
} from "lucide-react"

interface CelebrityWorkoutModuleProps {
  userId: string
}

interface Celebrity {
  id: string
  name: string
  category: string
  image: string
  description: string
  difficulty: "Iniciante" | "Intermediário" | "Avançado"
  duration: string
  calories: number
  focus: string[]
}

interface Exercise {
  name: string
  sets: string
  reps: string
  rest: string
  tips: string
}

interface WorkoutPlan {
  celebrity: Celebrity
  exercises: Exercise[]
}

const celebrities: Celebrity[] = [
  {
    id: "chris-hemsworth",
    name: "Chris Hemsworth",
    category: "Thor - Marvel",
    image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&h=600&fit=crop",
    description: "Treino intenso focado em força e hipertrofia para corpo de super-herói",
    difficulty: "Avançado",
    duration: "90 min",
    calories: 650,
    focus: ["Peito", "Costas", "Ombros", "Braços"]
  },
  {
    id: "zac-efron",
    name: "Zac Efron",
    category: "Baywatch",
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=600&fit=crop",
    description: "Treino de definição muscular e abdômen trincado",
    difficulty: "Intermediário",
    duration: "60 min",
    calories: 500,
    focus: ["Abdômen", "Peito", "Braços"]
  },
  {
    id: "dwayne-johnson",
    name: "Dwayne 'The Rock' Johnson",
    category: "Fast & Furious",
    image: "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?w=400&h=600&fit=crop",
    description: "Treino de alta intensidade para massa muscular extrema",
    difficulty: "Avançado",
    duration: "120 min",
    calories: 800,
    focus: ["Corpo Todo", "Força", "Resistência"]
  },
  {
    id: "gal-gadot",
    name: "Gal Gadot",
    category: "Mulher Maravilha",
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=600&fit=crop",
    description: "Treino funcional com foco em força, agilidade e flexibilidade",
    difficulty: "Intermediário",
    duration: "75 min",
    calories: 550,
    focus: ["Funcional", "Core", "Pernas"]
  },
  {
    id: "michael-b-jordan",
    name: "Michael B. Jordan",
    category: "Creed",
    image: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&h=600&fit=crop",
    description: "Treino de boxe combinado com musculação para corpo de lutador",
    difficulty: "Avançado",
    duration: "90 min",
    calories: 700,
    focus: ["Cardio", "Força", "Explosão"]
  },
  {
    id: "scarlett-johansson",
    name: "Scarlett Johansson",
    category: "Viúva Negra",
    image: "https://images.unsplash.com/photo-1550259979-ed79b48d2a30?w=400&h=600&fit=crop",
    description: "Treino de artes marciais e condicionamento físico",
    difficulty: "Intermediário",
    duration: "60 min",
    calories: 480,
    focus: ["Funcional", "Flexibilidade", "Core"]
  }
]

const workoutPlans: { [key: string]: Exercise[] } = {
  "chris-hemsworth": [
    {
      name: "Supino Reto com Barra",
      sets: "5 séries",
      reps: "6-8 repetições",
      rest: "2-3 min",
      tips: "Foco em carga pesada e controle do movimento"
    },
    {
      name: "Desenvolvimento com Halteres",
      sets: "4 séries",
      reps: "8-10 repetições",
      rest: "90 seg",
      tips: "Mantenha o core contraído durante todo o movimento"
    },
    {
      name: "Remada Curvada",
      sets: "4 séries",
      reps: "8-10 repetições",
      rest: "90 seg",
      tips: "Puxe com os cotovelos, não com as mãos"
    },
    {
      name: "Rosca Direta com Barra",
      sets: "4 séries",
      reps: "10-12 repetições",
      rest: "60 seg",
      tips: "Evite balançar o corpo, isole o bíceps"
    },
    {
      name: "Tríceps Testa",
      sets: "4 séries",
      reps: "10-12 repetições",
      rest: "60 seg",
      tips: "Mantenha os cotovelos fixos"
    }
  ],
  "zac-efron": [
    {
      name: "Flexão de Braço (variações)",
      sets: "4 séries",
      reps: "15-20 repetições",
      rest: "45 seg",
      tips: "Alterne entre flexão normal, diamante e declinada"
    },
    {
      name: "Abdominal Prancha",
      sets: "4 séries",
      reps: "60 segundos",
      rest: "30 seg",
      tips: "Mantenha o corpo alinhado como uma prancha"
    },
    {
      name: "Mountain Climbers",
      sets: "4 séries",
      reps: "30 segundos",
      rest: "30 seg",
      tips: "Movimento rápido e controlado"
    },
    {
      name: "Burpees",
      sets: "4 séries",
      reps: "15 repetições",
      rest: "60 seg",
      tips: "Explosão no salto, controle na descida"
    },
    {
      name: "Abdominal Bicicleta",
      sets: "4 séries",
      reps: "20 repetições cada lado",
      rest: "45 seg",
      tips: "Toque o cotovelo no joelho oposto"
    }
  ],
  "dwayne-johnson": [
    {
      name: "Agachamento Livre",
      sets: "5 séries",
      reps: "5-8 repetições",
      rest: "3 min",
      tips: "Carga máxima, desça até paralelo ao chão"
    },
    {
      name: "Levantamento Terra",
      sets: "5 séries",
      reps: "5-8 repetições",
      rest: "3 min",
      tips: "Mantenha as costas retas durante todo o movimento"
    },
    {
      name: "Supino Inclinado",
      sets: "4 séries",
      reps: "8-10 repetições",
      rest: "2 min",
      tips: "Foco na parte superior do peito"
    },
    {
      name: "Barra Fixa",
      sets: "4 séries",
      reps: "Máximo de repetições",
      rest: "2 min",
      tips: "Use peso adicional se conseguir mais de 12 reps"
    },
    {
      name: "Leg Press",
      sets: "4 séries",
      reps: "12-15 repetições",
      rest: "90 seg",
      tips: "Amplitude completa do movimento"
    }
  ],
  "gal-gadot": [
    {
      name: "Agachamento Sumô",
      sets: "4 séries",
      reps: "15 repetições",
      rest: "60 seg",
      tips: "Pés afastados, joelhos alinhados com os pés"
    },
    {
      name: "Prancha Lateral",
      sets: "3 séries",
      reps: "45 segundos cada lado",
      rest: "30 seg",
      tips: "Mantenha o quadril elevado"
    },
    {
      name: "Afundo Alternado",
      sets: "4 séries",
      reps: "12 repetições cada perna",
      rest: "60 seg",
      tips: "Joelho não deve ultrapassar a ponta do pé"
    },
    {
      name: "Ponte de Glúteo",
      sets: "4 séries",
      reps: "20 repetições",
      rest: "45 seg",
      tips: "Aperte os glúteos no topo do movimento"
    },
    {
      name: "Russian Twist",
      sets: "4 séries",
      reps: "20 repetições cada lado",
      rest: "45 seg",
      tips: "Use peso adicional para mais intensidade"
    }
  ],
  "michael-b-jordan": [
    {
      name: "Soco no Saco (Shadow Boxing)",
      sets: "5 rounds",
      reps: "3 minutos",
      rest: "1 min",
      tips: "Mantenha ritmo constante e técnica correta"
    },
    {
      name: "Supino com Halteres",
      sets: "4 séries",
      reps: "10-12 repetições",
      rest: "90 seg",
      tips: "Movimento explosivo na subida"
    },
    {
      name: "Pular Corda",
      sets: "5 rounds",
      reps: "2 minutos",
      rest: "30 seg",
      tips: "Trabalha cardio e coordenação"
    },
    {
      name: "Desenvolvimento Arnold",
      sets: "4 séries",
      reps: "10 repetições",
      rest: "60 seg",
      tips: "Rotação completa dos halteres"
    },
    {
      name: "Abdominal com Peso",
      sets: "4 séries",
      reps: "15 repetições",
      rest: "45 seg",
      tips: "Segure anilha no peito"
    }
  ],
  "scarlett-johansson": [
    {
      name: "Kettlebell Swing",
      sets: "4 séries",
      reps: "20 repetições",
      rest: "60 seg",
      tips: "Explosão com o quadril, não com os braços"
    },
    {
      name: "Prancha com Toque no Ombro",
      sets: "4 séries",
      reps: "20 toques",
      rest: "45 seg",
      tips: "Mantenha o quadril estável"
    },
    {
      name: "Agachamento Pistol (assistido)",
      sets: "3 séries",
      reps: "8 repetições cada perna",
      rest: "90 seg",
      tips: "Use apoio se necessário"
    },
    {
      name: "Flexão Pike",
      sets: "4 séries",
      reps: "12 repetições",
      rest: "60 seg",
      tips: "Foco nos ombros"
    },
    {
      name: "Dead Bug",
      sets: "4 séries",
      reps: "15 repetições cada lado",
      rest: "45 seg",
      tips: "Mantenha lombar colada no chão"
    }
  ]
}

export default function CelebrityWorkoutModule({ userId }: CelebrityWorkoutModuleProps) {
  const [selectedCelebrity, setSelectedCelebrity] = useState<Celebrity | null>(null)
  const [workoutStarted, setWorkoutStarted] = useState(false)
  const [completedExercises, setCompletedExercises] = useState<number[]>([])

  const handleSelectCelebrity = (celebrity: Celebrity) => {
    setSelectedCelebrity(celebrity)
    setWorkoutStarted(false)
    setCompletedExercises([])
  }

  const handleStartWorkout = () => {
    setWorkoutStarted(true)
  }

  const handleCompleteExercise = (index: number) => {
    if (completedExercises.includes(index)) {
      setCompletedExercises(completedExercises.filter(i => i !== index))
    } else {
      setCompletedExercises([...completedExercises, index])
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Iniciante":
        return "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400"
      case "Intermediário":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400"
      case "Avançado":
        return "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400"
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
    }
  }

  if (!selectedCelebrity) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Star className="w-8 h-8 text-yellow-500" />
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Treino de Famoso</h2>
            <Star className="w-8 h-8 text-yellow-500" />
          </div>
          <p className="text-slate-500 dark:text-slate-400">
            Treine como as maiores estrelas de Hollywood e conquiste o corpo dos seus sonhos
          </p>
        </div>

        {/* Celebrity Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {celebrities.map((celebrity) => (
            <Card
              key={celebrity.id}
              className="group overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 hover:border-yellow-400 dark:hover:border-yellow-600"
              onClick={() => handleSelectCelebrity(celebrity)}
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  src={celebrity.image}
                  alt={celebrity.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                <div className="absolute top-4 right-4">
                  <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-bold text-white mb-1">{celebrity.name}</h3>
                  <p className="text-sm text-yellow-400 font-medium">{celebrity.category}</p>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                  {celebrity.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {celebrity.focus.map((focus, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {focus}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                      <Clock className="w-4 h-4" />
                      <span>{celebrity.duration}</span>
                    </div>
                    <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                      <Flame className="w-4 h-4" />
                      <span>{celebrity.calories} kcal</span>
                    </div>
                  </div>
                  <Badge className={getDifficultyColor(celebrity.difficulty)}>
                    {celebrity.difficulty}
                  </Badge>
                </div>

                <Button className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-semibold shadow-lg">
                  Ver Treino
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const exercises = workoutPlans[selectedCelebrity.id] || []
  const progress = exercises.length > 0 ? (completedExercises.length / exercises.length) * 100 : 0

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Back Button */}
      <Button
        variant="outline"
        onClick={() => setSelectedCelebrity(null)}
        className="mb-4"
      >
        ← Voltar para lista
      </Button>

      {/* Celebrity Header */}
      <Card className="overflow-hidden border-2 border-yellow-400 dark:border-yellow-600">
        <div className="relative h-48 md:h-64">
          <img
            src={selectedCelebrity.image}
            alt={selectedCelebrity.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
              <Badge className="bg-yellow-400 text-black font-semibold">
                {selectedCelebrity.category}
              </Badge>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">{selectedCelebrity.name}</h2>
            <p className="text-white/90">{selectedCelebrity.description}</p>
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Clock className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {selectedCelebrity.duration}
                </p>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Duração</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {selectedCelebrity.calories}
                </p>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Calorias</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Dumbbell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {exercises.length}
                </p>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Exercícios</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <Badge className={getDifficultyColor(selectedCelebrity.difficulty)}>
                  {selectedCelebrity.difficulty}
                </Badge>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Nível</p>
            </div>
          </div>

          {!workoutStarted ? (
            <Button
              size="lg"
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold text-lg shadow-xl"
              onClick={handleStartWorkout}
            >
              <Play className="w-6 h-6 mr-2" />
              Iniciar Treino
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Progresso do Treino
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {completedExercises.length} / {exercises.length}
                </span>
              </div>
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Focus Areas */}
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
        <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          Áreas de Foco
        </h3>
        <div className="flex flex-wrap gap-2">
          {selectedCelebrity.focus.map((focus, index) => (
            <Badge
              key={index}
              className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0 px-4 py-2 text-sm"
            >
              {focus}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Exercises List */}
      {workoutStarted && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Exercícios</h3>
          {exercises.map((exercise, index) => (
            <Card
              key={index}
              className={`p-6 transition-all duration-300 ${
                completedExercises.includes(index)
                  ? "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-400 dark:border-green-600"
                  : "bg-white dark:bg-slate-900 hover:shadow-lg"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
                      completedExercises.includes(index)
                        ? "bg-gradient-to-br from-green-400 to-emerald-500 text-white"
                        : "bg-gradient-to-br from-yellow-400 to-orange-500 text-white"
                    }`}
                  >
                    {completedExercises.includes(index) ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      index + 1
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <h4 className="text-lg font-semibold mb-3 text-slate-900 dark:text-white">
                    {exercise.name}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Séries</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{exercise.sets}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Repetições</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{exercise.reps}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Descanso</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{exercise.rest}</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-900 dark:text-blue-300">
                      <span className="font-semibold">💡 Dica:</span> {exercise.tips}
                    </p>
                  </div>

                  <Button
                    onClick={() => handleCompleteExercise(index)}
                    className={
                      completedExercises.includes(index)
                        ? "bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white"
                        : "bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white"
                    }
                  >
                    {completedExercises.includes(index) ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Concluído
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Marcar como Concluído
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Completion Card */}
      {workoutStarted && completedExercises.length === exercises.length && (
        <Card className="p-8 bg-gradient-to-br from-yellow-400 to-orange-500 text-white border-0 shadow-2xl text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">Parabéns! 🎉</h3>
          <p className="text-lg mb-4">
            Você completou o treino do {selectedCelebrity.name}!
          </p>
          <p className="text-white/90 mb-6">
            Continue assim e você estará cada vez mais perto do seu objetivo!
          </p>
          <Button
            size="lg"
            className="bg-white text-orange-600 hover:bg-slate-100 font-bold"
            onClick={() => setSelectedCelebrity(null)}
          >
            Escolher Outro Treino
          </Button>
        </Card>
      )}
    </div>
  )
}
