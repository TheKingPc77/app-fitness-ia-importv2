"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Zap, Sparkles, CheckCircle2, AlertCircle, Mail, Eye, EyeOff, Loader2 } from "lucide-react"

type ViewMode = 'sign-in' | 'sign-up' | 'email-sent'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('sign-in')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null)
  
  // Form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    // Verificar parâmetros de URL (confirmação de email)
    const confirmed = searchParams.get('confirmed')
    const error = searchParams.get('error')

    if (confirmed === 'true') {
      setMessage({ 
        type: 'success', 
        text: '✅ Email confirmado com sucesso! Faça login para continuar.' 
      })
    } else if (error === 'confirmation_failed') {
      setMessage({ 
        type: 'error', 
        text: '❌ Erro ao confirmar email. Tente novamente ou solicite um novo link.' 
      })
    }

    // Verificar se usuário já está logado
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push("/")
      }
      setLoading(false)
    })

    // Listener para mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth event:', event)
      
      if (event === 'SIGNED_IN' && session) {
        router.push("/")
      }
    })

    return () => subscription.unsubscribe()
  }, [router, searchParams])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          setMessage({ 
            type: 'info', 
            text: '📧 Email não confirmado. Verifique sua caixa de entrada e clique no link de confirmação.' 
          })
        } else if (error.message.includes('Invalid login credentials')) {
          setMessage({ type: 'error', text: 'Email ou senha incorretos.' })
        } else {
          setMessage({ type: 'error', text: error.message })
        }
      } else if (data.user) {
        setMessage({ type: 'success', text: '✅ Login realizado com sucesso!' })
        router.push("/")
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Erro ao fazer login. Tente novamente.' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)

    // Validações básicas
    if (password.length < 6) {
      setMessage({ type: 'error', text: 'A senha deve ter no mínimo 6 caracteres.' })
      setSubmitting(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      })

      if (error) {
        if (error.message.includes('already registered')) {
          setMessage({ type: 'error', text: 'Este email já está cadastrado.' })
        } else {
          setMessage({ type: 'error', text: error.message })
        }
      } else if (data.user) {
        setViewMode('email-sent')
        setMessage({ 
          type: 'success', 
          text: '✅ Conta criada! Verifique seu email para confirmar o cadastro.' 
        })
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Erro ao criar conta. Tente novamente.' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleResendEmail = async () => {
    setSubmitting(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      })

      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else {
        setMessage({ type: 'success', text: '✅ Email de confirmação reenviado!' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao reenviar email.' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="animate-pulse">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 flex items-center justify-center shadow-2xl">
            <Zap className="w-10 h-10 text-white" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <div className="w-full max-w-md">
        {/* Logo e Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 flex items-center justify-center shadow-2xl animate-pulse">
                <Zap className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full border-4 border-white dark:border-slate-950 animate-ping"></div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full border-4 border-white dark:border-slate-950"></div>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 bg-clip-text text-transparent mb-2">
            FitAI Pro
          </h1>
          <p className="text-slate-600 dark:text-slate-400 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            Seu personal trainer inteligente
          </p>
        </div>

        {/* Mensagem de Feedback */}
        {message && (
          <div className={`mb-6 p-4 rounded-2xl border-2 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-500 ${
            message.type === 'success' 
              ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200' 
              : message.type === 'error'
              ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
              : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : message.type === 'error' ? (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <Mail className="w-5 h-5 flex-shrink-0" />
            )}
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        {/* Card de Login/Cadastro */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-slate-200 dark:border-slate-800 p-8">
          {viewMode === 'email-sent' ? (
            // Tela de Email Enviado
            <>
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Verifique seu email
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Enviamos um link de confirmação para<br />
                  <span className="font-semibold text-slate-900 dark:text-white">{email}</span>
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    📧 Clique no link do email para confirmar sua conta e fazer login.
                  </p>
                </div>

                <button
                  onClick={handleResendEmail}
                  disabled={submitting}
                  className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Reenviando...
                    </>
                  ) : (
                    'Reenviar email'
                  )}
                </button>

                <button
                  onClick={() => {
                    setViewMode('sign-in')
                    setMessage(null)
                  }}
                  className="w-full text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Voltar para o login
                </button>
              </div>
            </>
          ) : (
            // Tela de Login/Cadastro
            <>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center">
                {viewMode === 'sign-in' ? 'Bem-vindo de volta!' : 'Criar sua conta'}
              </h2>

              <form onSubmit={viewMode === 'sign-in' ? handleSignIn : handleSignUp} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={viewMode === 'sign-in' ? 'Sua senha' : 'Crie uma senha forte (mín. 6 caracteres)'}
                      required
                      minLength={6}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {viewMode === 'sign-in' ? 'Entrando...' : 'Criando conta...'}
                    </>
                  ) : (
                    viewMode === 'sign-in' ? 'Entrar' : 'Criar conta'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    setViewMode(viewMode === 'sign-in' ? 'sign-up' : 'sign-in')
                    setMessage(null)
                    setEmail('')
                    setPassword('')
                  }}
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  {viewMode === 'sign-in' 
                    ? 'Não tem uma conta? Cadastre-se' 
                    : 'Já tem uma conta? Entre'
                  }
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade
        </p>
      </div>
    </div>
  )
}
