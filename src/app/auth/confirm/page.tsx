"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

// Componente que usa useSearchParams
function ConfirmContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // Pegar o token da URL
        const token = searchParams.get("token")
        const type = searchParams.get("type")

        if (!token) {
          setStatus("error")
          setMessage("Token de confirmação não encontrado.")
          return
        }

        // Verificar o tipo de confirmação
        if (type === "email") {
          // Confirmar email usando o token
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: "email",
          })

          if (error) {
            setStatus("error")
            setMessage("Erro ao confirmar email. O link pode ter expirado.")
            console.error("Erro na confirmação:", error)
            return
          }

          setStatus("success")
          setMessage("Email confirmado com sucesso! Redirecionando...")
          
          // Redirecionar para login após 2 segundos
          setTimeout(() => {
            router.push("/login")
          }, 2000)
        } else {
          setStatus("error")
          setMessage("Tipo de confirmação inválido.")
        }
      } catch (error) {
        setStatus("error")
        setMessage("Erro ao processar confirmação.")
        console.error("Erro:", error)
      }
    }

    confirmEmail()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-slate-200 dark:border-slate-800 p-8">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Ícone de Status */}
            {status === "loading" && (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-100 to-purple-100 dark:from-orange-950/30 dark:to-purple-950/30 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-orange-600 dark:text-orange-400 animate-spin" />
              </div>
            )}
            
            {status === "success" && (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-950/30 dark:to-emerald-950/30 flex items-center justify-center animate-bounce">
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
            )}
            
            {status === "error" && (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-950/30 dark:to-pink-950/30 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>
            )}

            {/* Título */}
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {status === "loading" && "Confirmando seu email..."}
                {status === "success" && "Email Confirmado!"}
                {status === "error" && "Erro na Confirmação"}
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                {message}
              </p>
            </div>

            {/* Botão de Ação (apenas para erro) */}
            {status === "error" && (
              <button
                onClick={() => router.push("/login")}
                className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold hover:scale-105 transition-all duration-300 shadow-lg"
              >
                Voltar para Login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente de Loading para o Suspense fallback
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-slate-200 dark:border-slate-800 p-8">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-100 to-purple-100 dark:from-orange-950/30 dark:to-purple-950/30 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-orange-600 dark:text-orange-400 animate-spin" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Carregando...
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Aguarde um momento
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Página principal com Suspense boundary
export default function ConfirmPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ConfirmContent />
    </Suspense>
  )
}
