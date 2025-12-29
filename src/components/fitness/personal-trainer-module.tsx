"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  UserPlus, 
  Users, 
  UtensilsCrossed, 
  Dumbbell, 
  Search,
  Calendar,
  TrendingUp,
  Plus,
  Edit,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
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

interface Student {
  id: string
  name: string
  email: string
  phone?: string
  goal?: string
  personal_trainer_id: string
  created_at: string
}

interface StudentMeal {
  id: string
  student_id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  created_at: string
}

interface WorkoutExercise {
  id: string
  name: string
  sets: number
  reps: string
  rest: string
  instructions?: string
}

interface StudentWorkout {
  id: string
  student_id: string
  workout_name: string
  day_of_week: string
  exercises: WorkoutExercise[]
  created_at: string
}

interface PersonalTrainerModuleProps {
  userId: string
}

export default function PersonalTrainerModule({ userId }: PersonalTrainerModuleProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [studentMeals, setStudentMeals] = useState<StudentMeal[]>([])
  const [studentWorkouts, setStudentWorkouts] = useState<StudentWorkout[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddingStudent, setIsAddingStudent] = useState(false)
  const [isEditingWorkout, setIsEditingWorkout] = useState(false)
  const [editingWorkoutDay, setEditingWorkoutDay] = useState<string>("")
  const [isSavingStudent, setIsSavingStudent] = useState(false)
  
  // Form states
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    phone: "",
    goal: ""
  })

  const [workoutForm, setWorkoutForm] = useState({
    workout_name: "",
    day_of_week: "monday",
    exercises: [
      { name: "", sets: 3, reps: "12", rest: "60s", instructions: "" }
    ]
  })

  useEffect(() => {
    loadStudents()
  }, [userId])

  useEffect(() => {
    if (selectedStudent) {
      loadStudentMeals(selectedStudent.id)
      loadStudentWorkouts(selectedStudent.id)
    }
  }, [selectedStudent])

  const loadStudents = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('personal_trainer_students')
        .select('*')
        .eq('personal_trainer_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro detalhado ao carregar alunos:', error)
        throw error
      }
      
      console.log('Alunos carregados:', data)
      setStudents(data || [])
    } catch (error: any) {
      console.error('Erro ao carregar alunos:', error)
      
      // Verificar se é erro de tabela não existente
      if (error?.message?.includes('relation') || error?.code === '42P01') {
        toast.error('⚠️ Tabelas não configuradas! Siga as instruções no arquivo INSTRUCOES-SUPABASE.md', {
          duration: 8000
        })
      } else {
        toast.error('Erro ao carregar alunos. Verifique a conexão com o Supabase.')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadStudentMeals = async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('student_meals')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setStudentMeals(data || [])
    } catch (error) {
      console.error('Erro ao carregar refeições:', error)
      toast.error('Erro ao carregar refeições do aluno')
    }
  }

  const loadStudentWorkouts = async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('student_workouts')
        .select('*')
        .eq('student_id', studentId)
        .order('day_of_week', { ascending: true })

      if (error) throw error
      setStudentWorkouts(data || [])
    } catch (error) {
      console.error('Erro ao carregar treinos:', error)
      toast.error('Erro ao carregar treinos do aluno')
    }
  }

  const handleAddStudent = async () => {
    // Validação dos campos obrigatórios
    if (!newStudent.name.trim()) {
      toast.error('❌ Nome é obrigatório')
      return
    }

    if (!newStudent.email.trim()) {
      toast.error('❌ Email é obrigatório')
      return
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newStudent.email)) {
      toast.error('❌ Email inválido')
      return
    }

    try {
      setIsSavingStudent(true)
      
      console.log('Tentando cadastrar aluno:', {
        name: newStudent.name,
        email: newStudent.email,
        phone: newStudent.phone || null,
        goal: newStudent.goal || null,
        personal_trainer_id: userId
      })

      const { data, error } = await supabase
        .from('personal_trainer_students')
        .insert([
          {
            name: newStudent.name.trim(),
            email: newStudent.email.trim(),
            phone: newStudent.phone.trim() || null,
            goal: newStudent.goal.trim() || null,
            personal_trainer_id: userId
          }
        ])
        .select()
        .single()

      if (error) {
        console.error('Erro detalhado ao cadastrar:', error)
        throw error
      }

      console.log('Aluno cadastrado com sucesso:', data)

      toast.success(`✅ Aluno ${newStudent.name} cadastrado com sucesso!`, {
        duration: 4000
      })
      
      // Atualizar lista de alunos
      setStudents([data, ...students])
      
      // Limpar formulário
      setNewStudent({ name: "", email: "", phone: "", goal: "" })
      
      // Fechar modal
      setIsAddingStudent(false)
      
      // Selecionar o aluno recém-cadastrado
      setSelectedStudent(data)
      
    } catch (error: any) {
      console.error('Erro ao cadastrar aluno:', error)
      
      // Mensagens de erro específicas
      if (error?.message?.includes('relation') || error?.code === '42P01') {
        toast.error('⚠️ Tabela não existe! Execute o SQL no arquivo INSTRUCOES-SUPABASE.md', {
          duration: 8000
        })
      } else if (error?.code === '23505') {
        toast.error('❌ Este email já está cadastrado')
      } else if (error?.message?.includes('JWT')) {
        toast.error('❌ Erro de autenticação. Verifique suas credenciais do Supabase')
      } else {
        toast.error(`❌ Erro ao cadastrar aluno: ${error?.message || 'Erro desconhecido'}`)
      }
    } finally {
      setIsSavingStudent(false)
    }
  }

  const handleSaveWorkout = async () => {
    if (!selectedStudent) return
    
    if (!workoutForm.workout_name || workoutForm.exercises.length === 0) {
      toast.error('Preencha o nome do treino e adicione pelo menos um exercício')
      return
    }

    try {
      // Verificar se já existe treino para este dia
      const { data: existingWorkout } = await supabase
        .from('student_workouts')
        .select('id')
        .eq('student_id', selectedStudent.id)
        .eq('day_of_week', workoutForm.day_of_week)
        .single()

      if (existingWorkout) {
        // Atualizar treino existente
        const { error } = await supabase
          .from('student_workouts')
          .update({
            workout_name: workoutForm.workout_name,
            exercises: workoutForm.exercises
          })
          .eq('id', existingWorkout.id)

        if (error) throw error
        toast.success('Treino atualizado com sucesso!')
      } else {
        // Criar novo treino
        const { error } = await supabase
          .from('student_workouts')
          .insert([
            {
              student_id: selectedStudent.id,
              workout_name: workoutForm.workout_name,
              day_of_week: workoutForm.day_of_week,
              exercises: workoutForm.exercises
            }
          ])

        if (error) throw error
        toast.success('Treino criado com sucesso!')
      }

      loadStudentWorkouts(selectedStudent.id)
      setIsEditingWorkout(false)
      setWorkoutForm({
        workout_name: "",
        day_of_week: "monday",
        exercises: [{ name: "", sets: 3, reps: "12", rest: "60s", instructions: "" }]
      })
    } catch (error) {
      console.error('Erro ao salvar treino:', error)
      toast.error('Erro ao salvar treino')
    }
  }

  const handleEditWorkout = (workout: StudentWorkout) => {
    setWorkoutForm({
      workout_name: workout.workout_name,
      day_of_week: workout.day_of_week,
      exercises: workout.exercises
    })
    setEditingWorkoutDay(workout.day_of_week)
    setIsEditingWorkout(true)
  }

  const addExercise = () => {
    setWorkoutForm({
      ...workoutForm,
      exercises: [
        ...workoutForm.exercises,
        { name: "", sets: 3, reps: "12", rest: "60s", instructions: "" }
      ]
    })
  }

  const removeExercise = (index: number) => {
    setWorkoutForm({
      ...workoutForm,
      exercises: workoutForm.exercises.filter((_, i) => i !== index)
    })
  }

  const updateExercise = (index: number, field: string, value: any) => {
    const updatedExercises = [...workoutForm.exercises]
    updatedExercises[index] = { ...updatedExercises[index], [field]: value }
    setWorkoutForm({ ...workoutForm, exercises: updatedExercises })
  }

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getDayName = (day: string) => {
    const days: { [key: string]: string } = {
      monday: "Segunda-feira",
      tuesday: "Terça-feira",
      wednesday: "Quarta-feira",
      thursday: "Quinta-feira",
      friday: "Sexta-feira",
      saturday: "Sábado",
      sunday: "Domingo"
    }
    return days[day] || day
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-purple-500" />
          <p className="text-slate-600 dark:text-slate-400">Carregando alunos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
            Personal Trainer
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Gerencie seus alunos, treinos e acompanhe o progresso
          </p>
        </div>
        
        <Dialog open={isAddingStudent} onOpenChange={setIsAddingStudent}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg">
              <UserPlus className="w-4 h-4 mr-2" />
              Cadastrar Aluno
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Aluno</DialogTitle>
              <DialogDescription>
                Preencha os dados do aluno para começar o acompanhamento
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  placeholder="Ex: João Silva"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  disabled={isSavingStudent}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="joao@email.com"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  disabled={isSavingStudent}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  placeholder="(11) 99999-9999"
                  value={newStudent.phone}
                  onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                  disabled={isSavingStudent}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal">Objetivo</Label>
                <Textarea
                  id="goal"
                  placeholder="Ex: Perder peso, ganhar massa muscular..."
                  value={newStudent.goal}
                  onChange={(e) => setNewStudent({ ...newStudent, goal: e.target.value })}
                  rows={3}
                  disabled={isSavingStudent}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsAddingStudent(false)}
                disabled={isSavingStudent}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleAddStudent} 
                className="bg-gradient-to-r from-purple-600 to-pink-600"
                disabled={isSavingStudent}
              >
                {isSavingStudent ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Cadastrar
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2 border-purple-200 dark:border-purple-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total de Alunos</p>
                <p className="text-3xl font-bold text-purple-600">{students.length}</p>
              </div>
              <Users className="w-12 h-12 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-pink-200 dark:border-pink-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Treinos Criados</p>
                <p className="text-3xl font-bold text-pink-600">{studentWorkouts.length}</p>
              </div>
              <Dumbbell className="w-12 h-12 text-pink-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-orange-200 dark:border-orange-900">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Refeições Registradas</p>
                <p className="text-3xl font-bold text-orange-600">{studentMeals.length}</p>
              </div>
              <UtensilsCrossed className="w-12 h-12 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Students List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Meus Alunos
            </CardTitle>
            <CardDescription>
              Selecione um aluno para ver detalhes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar aluno..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredStudents.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-slate-500 text-sm">
                      {searchTerm ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}
                    </p>
                    {!searchTerm && (
                      <Button
                        onClick={() => setIsAddingStudent(true)}
                        variant="outline"
                        className="mt-4"
                        size="sm"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Cadastrar Primeiro Aluno
                      </Button>
                    )}
                  </div>
                ) : (
                  filteredStudents.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => setSelectedStudent(student)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
                        selectedStudent?.id === student.id
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                            {student.name}
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {student.email}
                          </p>
                          {student.goal && (
                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2 line-clamp-2">
                              {student.goal}
                            </p>
                          )}
                        </div>
                        {selectedStudent?.id === student.id && (
                          <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student Details */}
        <div className="lg:col-span-2">
          {!selectedStudent ? (
            <Card className="h-full flex items-center justify-center min-h-[400px]">
              <CardContent className="text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Selecione um Aluno
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  Escolha um aluno da lista para visualizar e gerenciar seus dados
                </p>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="meals" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="meals">
                  <UtensilsCrossed className="w-4 h-4 mr-2" />
                  Refeições
                </TabsTrigger>
                <TabsTrigger value="workouts">
                  <Dumbbell className="w-4 h-4 mr-2" />
                  Treinos
                </TabsTrigger>
              </TabsList>

              {/* Meals Tab */}
              <TabsContent value="meals" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Refeições de {selectedStudent.name}</CardTitle>
                    <CardDescription>
                      Histórico de refeições cadastradas pelo aluno
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {studentMeals.length === 0 ? (
                      <div className="text-center py-12">
                        <UtensilsCrossed className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                        <p className="text-slate-500">
                          Nenhuma refeição cadastrada ainda
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[500px] overflow-y-auto">
                        {studentMeals.map((meal) => (
                          <div
                            key={meal.id}
                            className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-700 transition-all"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                                  {meal.name}
                                </h4>
                                <p className="text-xs text-slate-500 mt-1">
                                  {new Date(meal.created_at).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                              <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                                {meal.calories} kcal
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="text-center p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                <p className="text-xs text-slate-600 dark:text-slate-400">Proteína</p>
                                <p className="font-semibold text-blue-600">{meal.protein}g</p>
                              </div>
                              <div className="text-center p-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                                <p className="text-xs text-slate-600 dark:text-slate-400">Carboidratos</p>
                                <p className="font-semibold text-green-600">{meal.carbs}g</p>
                              </div>
                              <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                                <p className="text-xs text-slate-600 dark:text-slate-400">Gordura</p>
                                <p className="font-semibold text-yellow-600">{meal.fat}g</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Workouts Tab */}
              <TabsContent value="workouts" className="mt-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Treinos de {selectedStudent.name}</CardTitle>
                        <CardDescription>
                          Personalize os treinos do aluno
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => {
                          setIsEditingWorkout(true)
                          setEditingWorkoutDay("")
                          setWorkoutForm({
                            workout_name: "",
                            day_of_week: "monday",
                            exercises: [{ name: "", sets: 3, reps: "12", rest: "60s", instructions: "" }]
                          })
                        }}
                        className="bg-gradient-to-r from-purple-600 to-pink-600"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Treino
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isEditingWorkout ? (
                      <div className="space-y-4 p-4 border-2 border-purple-200 dark:border-purple-800 rounded-xl">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-lg">
                            {editingWorkoutDay ? 'Editar Treino' : 'Novo Treino'}
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditingWorkout(false)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Nome do Treino</Label>
                            <Input
                              placeholder="Ex: Treino A - Peito e Tríceps"
                              value={workoutForm.workout_name}
                              onChange={(e) => setWorkoutForm({ ...workoutForm, workout_name: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Dia da Semana</Label>
                            <Select
                              value={workoutForm.day_of_week}
                              onValueChange={(value) => setWorkoutForm({ ...workoutForm, day_of_week: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="monday">Segunda-feira</SelectItem>
                                <SelectItem value="tuesday">Terça-feira</SelectItem>
                                <SelectItem value="wednesday">Quarta-feira</SelectItem>
                                <SelectItem value="thursday">Quinta-feira</SelectItem>
                                <SelectItem value="friday">Sexta-feira</SelectItem>
                                <SelectItem value="saturday">Sábado</SelectItem>
                                <SelectItem value="sunday">Domingo</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Exercícios</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={addExercise}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Adicionar Exercício
                            </Button>
                          </div>

                          {workoutForm.exercises.map((exercise, index) => (
                            <div key={index} className="p-4 border rounded-lg space-y-3 bg-slate-50 dark:bg-slate-900">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold">Exercício {index + 1}</Label>
                                {workoutForm.exercises.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeExercise(index)}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                              
                              <Input
                                placeholder="Nome do exercício"
                                value={exercise.name}
                                onChange={(e) => updateExercise(index, 'name', e.target.value)}
                              />
                              
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <Label className="text-xs">Séries</Label>
                                  <Input
                                    type="number"
                                    value={exercise.sets}
                                    onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value))}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Repetições</Label>
                                  <Input
                                    value={exercise.reps}
                                    onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Descanso</Label>
                                  <Input
                                    value={exercise.rest}
                                    onChange={(e) => updateExercise(index, 'rest', e.target.value)}
                                  />
                                </div>
                              </div>
                              
                              <Textarea
                                placeholder="Instruções (opcional)"
                                value={exercise.instructions}
                                onChange={(e) => updateExercise(index, 'instructions', e.target.value)}
                                rows={2}
                              />
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                          <Button
                            variant="outline"
                            onClick={() => setIsEditingWorkout(false)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            onClick={handleSaveWorkout}
                            className="bg-gradient-to-r from-purple-600 to-pink-600"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Salvar Treino
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {studentWorkouts.length === 0 ? (
                          <div className="text-center py-12">
                            <Dumbbell className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                            <p className="text-slate-500 mb-4">
                              Nenhum treino criado ainda
                            </p>
                            <Button
                              onClick={() => setIsEditingWorkout(true)}
                              className="bg-gradient-to-r from-purple-600 to-pink-600"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Criar Primeiro Treino
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-[500px] overflow-y-auto">
                            {studentWorkouts.map((workout) => (
                              <div
                                key={workout.id}
                                className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 transition-all"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                                      {workout.workout_name}
                                    </h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                      {getDayName(workout.day_of_week)}
                                    </p>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditWorkout(workout)}
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Editar
                                  </Button>
                                </div>
                                <div className="space-y-2">
                                  {workout.exercises.map((exercise, idx) => (
                                    <div
                                      key={idx}
                                      className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg"
                                    >
                                      <p className="font-medium text-sm">{exercise.name}</p>
                                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                        {exercise.sets} séries × {exercise.reps} reps • Descanso: {exercise.rest}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  )
}
