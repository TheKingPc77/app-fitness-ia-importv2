import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const { userId, targetWeight, targetCalories, weeklyWorkoutGoal } = await request.json()

    if (!userId || !targetWeight) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // Verificar se já existe registro de metas
    const { data: existingGoals } = await supabaseAdmin
      .from('user_goals')
      .select('id')
      .eq('user_id', userId)
      .single()

    let result

    if (existingGoals) {
      // Atualizar meta existente
      const { data, error } = await supabaseAdmin
        .from('user_goals')
        .update({ 
          target_weight: parseFloat(targetWeight),
          ...(targetCalories && { target_calories: targetCalories }),
          ...(weeklyWorkoutGoal && { weekly_workout_goal: weeklyWorkoutGoal })
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar meta:', error)
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }

      result = data
    } else {
      // Criar nova meta
      const { data, error } = await supabaseAdmin
        .from('user_goals')
        .insert({
          user_id: userId,
          target_weight: parseFloat(targetWeight),
          target_calories: targetCalories || 2000,
          weekly_workout_goal: weeklyWorkoutGoal || 5
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar meta:', error)
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        )
      }

      result = data
    }

    return NextResponse.json({ data: result }, { status: 200 })
  } catch (error) {
    console.error('Erro no servidor:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
