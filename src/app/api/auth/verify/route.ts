import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    // Verificar se as variáveis de ambiente do Supabase estão configuradas
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase environment variables not configured')
      return NextResponse.json(
        { error: 'Serviço temporariamente indisponível' },
        { status: 503 }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email e código são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar formato do código (4 dígitos)
    if (!/^\d{4}$/.test(code)) {
      return NextResponse.json(
        { error: 'Código inválido. Deve conter 4 dígitos.' },
        { status: 400 }
      )
    }

    // Buscar código no banco
    const { data: verification, error: fetchError } = await supabaseAdmin
      .from('user_verifications')
      .select('*')
      .eq('email', email)
      .eq('otp_code', code)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (fetchError || !verification) {
      console.error('Código não encontrado:', fetchError)
      return NextResponse.json(
        { error: 'Código inválido ou já utilizado' },
        { status: 400 }
      )
    }

    // Verificar se código expirou
    const now = new Date()
    const expiresAt = new Date(verification.expires_at)

    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'Código expirado. Solicite um novo código.' },
        { status: 400 }
      )
    }

    // Marcar código como verificado
    const { error: updateError } = await supabaseAdmin
      .from('user_verifications')
      .update({ verified: true })
      .eq('id', verification.id)

    if (updateError) {
      console.error('Erro ao atualizar verificação:', updateError)
      return NextResponse.json(
        { error: 'Erro ao processar verificação' },
        { status: 500 }
      )
    }

    // Confirmar email do usuário no Supabase Auth
    const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
      verification.user_id,
      { email_confirm: true }
    )

    if (confirmError) {
      console.error('Erro ao confirmar email:', confirmError)
      return NextResponse.json(
        { error: 'Erro ao confirmar email' },
        { status: 500 }
      )
    }

    // Criar perfil do usuário se não existir
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', verification.user_id)
      .single()

    if (!existingProfile) {
      await supabaseAdmin
        .from('profiles')
        .insert({
          id: verification.user_id,
          email: email,
          full_name: null,
          avatar_url: null
        })
    }

    console.log('✅ Email confirmado com sucesso:', email)

    return NextResponse.json({
      success: true,
      message: 'Email confirmado com sucesso!',
      userId: verification.user_id
    })

  } catch (error) {
    console.error('Erro na verificação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}