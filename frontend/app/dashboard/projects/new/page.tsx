'use client'

import dynamic from 'next/dynamic'
import PdfImportPanel from '@/components/ProjectWizard/PdfImportPanel'

const ProjectWizard = dynamic(
  () => import('@/components/ProjectWizard/ProjectWizard'),
  { ssr: false }
)

export default function NewProjectPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Criar Novo Projeto
        </h1>
        <p className="text-gray-600 mb-8">
          Utilize o importador de PDF para começar com um documento existente ou avance pelo assistente para preencher tudo manualmente.
        </p>

        <div className="grid gap-8 lg:grid-cols-[350px,1fr]">
          <PdfImportPanel />
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:p-8">
            <ProjectWizard />
          </div>
        </div>
      </div>
    </div>
  )
}
