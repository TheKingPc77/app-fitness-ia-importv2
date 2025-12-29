import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce' // Usar PKCE flow para melhor segurança
  }
})

// Types para o banco de dados
export type Profile = {
  id: string
  email: string
  full_name: string | null
  avatar_url?: string | null
  created_at: string
}

export type ProgressPhoto = {
  id: string
  user_id: string
  photo_url: string
  weight?: number
  notes?: string
  created_at: string
}

export type Meal = {
  id: string
  user_id: string
  photo_url?: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  notes?: string
  created_at: string
}

export type Workout = {
  id: string
  user_id: string
  name: string
  description?: string
  exercises: Exercise[]
  created_at: string
}

export type Exercise = {
  id: string
  name: string
  sets: number
  reps: string
  rest: string
  video_url?: string
  instructions?: string
}

export type WorkoutLog = {
  id: string
  user_id: string
  workout_id: string
  completed_at: string
  duration_minutes?: number
  notes?: string
}

export type DietPlan = {
  id: string
  user_id: string
  name: string
  daily_calories: number
  daily_protein: number
  daily_carbs: number
  daily_fat: number
  meals: string[]
  created_at: string
}

// Helper para criar perfil de usuário após signup
export async function createUserProfile(userId: string, email: string, fullName?: string) {
  const { data, error } = await supabase
    .from('profiles')
    .insert([
      {
        id: userId,
        email: email,
        full_name: fullName || null,
        avatar_url: null
      }
    ])
    .select()
    .single()

  if (error) {
    console.error('Erro ao criar perfil:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

// Helper para obter perfil do usuário
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Erro ao buscar perfil:', error)
    return { data: null, error }
  }

  return { data, error: null }
}
