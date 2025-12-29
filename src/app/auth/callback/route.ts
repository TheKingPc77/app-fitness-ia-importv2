import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/'

  console.log('🔗 Callback recebido:', { code, hasCode: !!code })

  if (code) {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              console.error('❌ Erro ao definir cookie:', error)
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              console.error('❌ Erro ao remover cookie:', error)
            }
          },
        },
      }
    )
    
    try {
      // Trocar o código por uma sessão
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('❌ Erro ao trocar código por sessão:', error)
        return NextResponse.redirect(new URL('/login?error=confirmation_failed', requestUrl.origin))
      }
      
      console.log('✅ Email confirmado e sessão criada com sucesso!')
      console.log('✅ Usuário:', data.user?.email)
      
      // Sucesso - redirecionar para a página inicial
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    } catch (error) {
      console.error('❌ Erro no callback:', error)
      return NextResponse.redirect(new URL('/login?error=confirmation_failed', requestUrl.origin))
    }
  }

  // Se não houver código, redirecionar para login
  console.log('⚠️ Callback sem código - redirecionando para login')
  return NextResponse.redirect(new URL('/login', requestUrl.origin))
}
