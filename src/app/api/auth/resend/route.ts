import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendResendCodeEmail, isResendConfigured } from '@/lib/resend'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

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

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar usuário pelo email
    const { data: users } = await supabaseAdmin.auth.admin.listUsers()
    const user = users?.users.find(u => u.email === email)

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se já existe código não expirado
    const { data: existingCode } = await supabaseAdmin
      .from('user_verifications')
      .select('*')
      .eq('email', email)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (existingCode) {
      const expiresAt = new Date(existingCode.expires_at)
      const now = new Date()
      
      // Se código ainda é válido (menos de 10 minutos), não permitir reenvio
      if (now < expiresAt) {
        const minutesLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / 60000)
        return NextResponse.json(
          { error: `Código ainda válido. Aguarde ${minutesLeft} minuto(s) para solicitar novo código.` },
          { status: 429 }
        )
      }
    }

    // Gerar novo código
    const otpCode = generateOTP()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutos

    // Salvar novo código
    const { error: dbError } = await supabaseAdmin
      .from('user_verifications')
      .insert({
        user_id: user.id,
        email: email,
        otp_code: otpCode,
        expires_at: expiresAt.toISOString(),
        verified: false
      })

    if (dbError) {
      console.error('Erro ao salvar código:', dbError)
      return NextResponse.json(
        { error: 'Erro ao gerar novo código' },
        { status: 500 }
      )
    }

    // Enviar email usando o helper do Resend
    if (!isResendConfigured()) {
      console.warn('⚠️ Resend API key não configurada - email não enviado')
      return NextResponse.json({
        success: true,
        warning: 'Código gerado, mas email não enviado',
        message: 'Configure RESEND_API_KEY para enviar emails',
        otpCode: otpCode // Temporário para testes
      })
    }

    const emailResult = await sendResendCodeEmail(email, otpCode)

    if (!emailResult.success) {
      console.error('❌ Erro ao enviar email:', emailResult.error)
      return NextResponse.json({
        success: true,
        warning: 'Código gerado, mas houve problema ao enviar email',
        otpCode: otpCode // Temporário para testes
      })
    }

    console.log('✅ Novo código enviado para:', email)

    return NextResponse.json({
      success: true,
      message: 'Novo código enviado com sucesso!'
    })

  } catch (error) {
    console.error('Erro ao reenviar código:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
