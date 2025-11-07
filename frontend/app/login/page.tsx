'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      await signIn('google', { callbackUrl: '/dashboard' })
    } catch (error) {
      console.error('Error logging in:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col lg:flex-row">
      <section className="relative hidden lg:flex lg:w-1/2 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/80 via-indigo-500/70 to-slate-900" />
        <div className="absolute -top-32 -left-20 h-72 w-72 bg-blue-300/40 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 bg-indigo-600/40 blur-3xl" />

        <div className="relative z-10 w-full max-w-xl px-12 py-20 flex flex-col gap-12">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium tracking-wide uppercase">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              Inteligência Artificial PRONAS
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-tight text-white">
              Análise estratégica e geração inteligente de projetos PRONAS/PCD
            </h1>
            <p className="mt-4 text-base text-blue-50/90 leading-relaxed">
              Automatize documentos, mantenha compliance e tome decisões baseadas em dados com o apoio de modelos avançados de IA.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 text-sm text-blue-50">
            <div className="flex items-start gap-3 rounded-xl bg-white/10 p-4 backdrop-blur">
              <span className="mt-1 h-8 w-8 shrink-0 rounded-full bg-emerald-400/20 flex items-center justify-center text-emerald-300 font-bold">
                1
              </span>
              <div>
                <p className="font-semibold">Documentos conectados</p>
                <p className="text-blue-50/80">
                  Controle de propostas, orçamentos, anexos e relatórios em um hub colaborativo.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-white/10 p-4 backdrop-blur">
              <span className="mt-1 h-8 w-8 shrink-0 rounded-full bg-sky-400/20 flex items-center justify-center text-sky-200 font-bold">
                2
              </span>
              <div>
                <p className="font-semibold">Insights em tempo real</p>
                <p className="text-blue-50/80">
                  Painel inteligente com avaliação automática e sugestões para cada etapa.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-white/10 p-4 backdrop-blur">
              <span className="mt-1 h-8 w-8 shrink-0 rounded-full bg-violet-400/20 flex items-center justify-center text-violet-200 font-bold">
                3
              </span>
              <div>
                <p className="font-semibold">Segurança comprovada</p>
                <p className="text-blue-50/80">
                  Autenticação via Google, criptografia JWT e infraestrutura monitorada 24/7.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl sm:p-10">
          <div className="mb-8 text-center lg:text-left">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg lg:mx-0">
              <svg
                className="h-7 w-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.6}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
              Bem-vindo de volta
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              Acesse o painel para gerenciar projetos, documentos e analisar resultados com o suporte da IA integrada ao PRONAS/PCD.
            </p>
          </div>

          <div className="space-y-6">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 font-semibold text-gray-900 shadow-sm transition-all hover:border-blue-400 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <div className="h-5 w-5 rounded-full border-2 border-gray-300 border-t-blue-600 animate-spin" />
                  Entrando...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 533.5 544.3">
                    <path
                      fill="#4285F4"
                      d="M533.5 278.4c0-17.4-1.6-34.1-4.7-50.2H272v95h147.5c-6.4 34-25.8 63-55 82.2v68h88.7c51.8-47.7 80.3-118 80.3-195z"
                    />
                    <path
                      fill="#34A853"
                      d="M272 544.3c74.7 0 137.3-24.7 183.1-66.9l-88.7-68c-24.6 16.5-56.1 26-94.4 26-72.6 0-134.1-49-156.1-115.1H23.6v72.3C69.1 483.7 164.2 544.3 272 544.3z"
                    />
                    <path
                      fill="#FBBC04"
                      d="M115.9 320.3c-5.6-16.5-8.8-34.1-8.8-52.3s3.2-35.8 8.8-52.3V143.4H23.6C8.4 181.9 0 223.7 0 268s8.4 86.1 23.6 124.6l92.3-72.3z"
                    />
                    <path
                      fill="#EA4335"
                      d="M272 107.7c40.6 0 76.9 14 105.5 41.4l79-79C409.3 24.6 346.7 0 272 0 164.2 0 69.1 60.6 23.6 143.4l92.3 72.3C137.9 156.7 199.4 107.7 272 107.7z"
                    />
                  </svg>
                  Entrar com Google
                </>
              )}
            </button>

            <div className="space-y-3 rounded-xl bg-slate-50 p-5">
              <p className="text-sm font-semibold text-gray-800">Por que autenticar com o Google?</p>
              <ul className="space-y-2 text-xs text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Aprovação mais rápida para equipes autorizadas e auditoria centralizada.
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  Integração segura com os dados do PRONAS/PCD e relatórios gerenciais.
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-purple-500" />
                  Monitoramento em tempo real de acesso e proteção reforçada por MFA.
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-gray-200 pt-6 text-center text-xs text-gray-500">
            <p>
              Sistema PRONAS/PCD • Plataforma inteligente desenvolvida com OpenAI &amp; Gemini
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
