'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'
import AnnexEditor from '@/components/ProjectForms/AnnexEditor'
import DocumentUpload from '@/components/ProjectForms/DocumentUpload'

const annexes = [
  { number: 3, title: 'Formulário Principal do Projeto', description: 'Dados completos do projeto' },
  { number: 4, title: 'Declaração de Responsabilidade', description: 'Assinatura do responsável legal' },
  { number: 5, title: 'Capacidade Técnico-Operativa', description: 'Comprovação de capacidade técnica' },
  { number: 6, title: 'Orçamento Detalhado', description: 'Planilha orçamentária completa' },
  { number: 7, title: 'Informações Complementares', description: 'Documentos adicionais' },
]

export default function AttachmentsPage() {
  const params = useParams()
  const projectId = params.id as string
  const [selectedAnnex, setSelectedAnnex] = useState<number | null>(null)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/dashboard/projects/${projectId}`}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Projeto
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gerenciar Anexos
        </h1>
        <p className="text-gray-600">
          Preencha todos os anexos obrigatórios do PRONAS/PCD
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar - Lista de Anexos */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Anexos PRONAS/PCD</h2>
            <div className="space-y-2">
              {annexes.map((annex) => (
                <button
                  key={annex.number}
                  onClick={() => setSelectedAnnex(annex.number)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    selectedAnnex === annex.number
                      ? 'bg-blue-100 text-blue-900 border-2 border-blue-600'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5" />
                    <div>
                      <p className="font-medium">Anexo {annex.number}</p>
                      <p className="text-xs text-gray-600">{annex.title}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Upload adicional */}
            <div className="mt-6 pt-6 border-t">
              <DocumentUpload projectId={projectId} />
            </div>
          </div>
        </div>

        {/* Main Content - Editor do Anexo */}
        <div className="lg:col-span-2">
          {selectedAnnex ? (
            <AnnexEditor
              projectId={projectId}
              annexNumber={selectedAnnex as 3 | 4 | 5 | 6 | 7}
              title={annexes.find((a) => a.number === selectedAnnex)?.title || ''}
              description={annexes.find((a) => a.number === selectedAnnex)?.description || ''}
            />
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Selecione um anexo para editar</p>
              <p className="text-sm text-gray-500">
                Todos os anexos são obrigatórios para submissão ao Ministério da Saúde
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
