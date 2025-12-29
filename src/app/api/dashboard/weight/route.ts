import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const { userId, weight, date } = await request.json()

    if (!userId || !weight || !date) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // Usar supabaseAdmin para bypassar RLS
    const { data, error } = await supabaseAdmin
      .from('weight_records')
      .insert({
        user_id: userId,
        weight: parseFloat(weight),
        date: date
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao inserir peso:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    console.error('Erro no servidor:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
