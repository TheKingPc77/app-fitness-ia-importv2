export interface UserProfile {
  id: string
  email: string
  name: string
  age: number
  gender: 'male' | 'female' | 'other'
  height: number // cm
  weight: number // kg
  goal: 'weight_loss' | 'muscle_gain' | 'maintenance'
  experience_level: 'beginner' | 'intermediate' | 'advanced'
  activity_level: 'sedentary' | 'light' | 'moderate' | 'very_active' | 'extra_active'
  weekly_availability: number // days per week
  limitations?: string[]
  created_at: Date
  updated_at: Date
}

export interface ProgressPhoto {
  id: string
  user_id: string
  photo_url: string
  weight: number
  body_fat_percentage?: number
  measurements?: {
    chest?: number
    waist?: number
    hips?: number
    arms?: number
    legs?: number
  }
  ai_analysis?: {
    muscle_definition: number // 0-100
    posture_score: number // 0-100
    feedback: string
    detected_changes?: string[]
  }
  created_at: Date
}

export interface Meal {
  id: string
  user_id: string
  name: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  photo_url?: string
  foods: Array<{
    name: string
    quantity: string
  }>
  nutrition: {
    calories: number
    protein: number // grams
    carbs: number // grams
    fat: number // grams
    fiber?: number // grams
  }
  ai_analysis?: {
    identified_foods: string[]
    confidence_score: number // 0-100
    compatibility_score?: number // 0-100 (with diet plan)
    suggestions?: string[]
  }
  created_at: Date
}

export interface Exercise {
  id: string
  name: string
  type: 'strength' | 'cardio' | 'flexibility' | 'hiit'
  muscle_groups: string[]
  equipment: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  sets?: number
  reps?: string
  duration?: number // seconds
  rest?: string
  video_url?: string
  instructions: string[]
  tips: string[]
}

export interface Workout {
  id: string
  user_id: string
  name: string
  type: 'strength' | 'cardio' | 'flexibility' | 'hiit' | 'full_body'
  duration: number // minutes
  calories_burned?: number
  exercises: Exercise[]
  completed: boolean
  completed_at?: Date
  notes?: string
  created_at: Date
}

export interface DietPlan {
  id: string
  user_id: string
  name: string
  goal: string
  daily_calories: number
  macros: {
    protein: number // grams
    carbs: number // grams
    fat: number // grams
  }
  meals: Array<{
    id: string
    name: string
    time: string
    foods: string[]
    nutrition: {
      calories: number
      protein: number
      carbs: number
      fat: number
    }
  }>
  hydration_goal: number // ml
  active: boolean
  created_at: Date
  updated_at: Date
}

export interface DailyStats {
  date: Date
  calories_consumed: number
  calories_burned: number
  protein: number
  carbs: number
  fat: number
  water_intake: number // ml
  steps: number
  sleep_hours: number
  workouts_completed: number
  weight?: number
}

export interface AIAnalysisRequest {
  type: 'progress_photo' | 'food_photo' | 'workout_generation' | 'diet_generation'
  image_url?: string
  user_profile?: UserProfile
  additional_context?: Record<string, any>
}

export interface AIAnalysisResponse {
  success: boolean
  data: any
  confidence?: number
  processing_time?: number
  error?: string
}

export interface WorkoutGenerationParams {
  user_profile: UserProfile
  focus_areas?: string[]
  available_equipment?: string[]
  duration?: number // minutes
  intensity?: 'low' | 'medium' | 'high'
}

export interface DietGenerationParams {
  user_profile: UserProfile
  dietary_restrictions?: string[]
  preferred_foods?: string[]
  meals_per_day?: number
  budget?: 'low' | 'medium' | 'high'
}

export interface Notification {
  id: string
  user_id: string
  type: 'workout_reminder' | 'meal_reminder' | 'hydration_reminder' | 'progress_update' | 'achievement'
  title: string
  message: string
  read: boolean
  action_url?: string
  created_at: Date
}

export interface Achievement {
  id: string
  user_id: string
  type: 'workout_streak' | 'weight_goal' | 'consistency' | 'milestone'
  name: string
  description: string
  icon: string
  unlocked_at: Date
}

export interface WeeklyReport {
  user_id: string
  week_start: Date
  week_end: Date
  summary: {
    workouts_completed: number
    total_calories_burned: number
    average_daily_calories: number
    weight_change: number
    consistency_score: number // 0-100
  }
  highlights: string[]
  areas_for_improvement: string[]
  ai_recommendations: string[]
}
