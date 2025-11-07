'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Save, Loader, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { initializeApiClient } from '@/lib/api'

interface AnnexEditorProps {
  projectId: string
  annexNumber: 3 | 4 | 5 | 6 | 7
  title: string
  description: string
}

const annexDescriptions: Record<number, string> = {
  3: 'Formulário Principal do Projeto',
  4: 'Declaração de Responsabilidade',
  5: 'Declaração de Capacidade Técnico-Operativa',
  6: 'Orçamento Detalhado',
  7: 'Informações Complementares',
}

export default function AnnexEditor({
  projectId,
  annexNumber,
  title,
  description,
}: AnnexEditorProps) {
  const { data: session, status } = useSession()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const accessToken = session?.accessToken

  useEffect(() => {
    if (status === 'loading') {
      return
    }

    if (!accessToken || !projectId) {
      setContent('')
      setLoading(false)
      return
    }

    const loadAnnex = async () => {
      setLoading(true)
      try {
        const apiClient = initializeApiClient(accessToken)
        const response = await apiClient.get(`/api/projects/${projectId}`)

        const annexKey = `annex_${annexNumber}`
        const annexData = response.data[annexKey]
        setContent(annexData?.content || '')
      } catch (error) {
        console.error('Erro ao carregar anexo:', error)
        toast.error('Erro ao carregar anexo')
        setContent('')
      } finally {
        setLoading(false)
      }
    }

    loadAnnex()
  }, [accessToken, projectId, annexNumber, status])

  const handleSave = async () => {
    if (!accessToken) {
      toast.error('Token de acesso não encontrado')
      return
    }

    setSaving(true)
    try {
      const annexKey = `annex_${annexNumber}`
      const apiClient = initializeApiClient(accessToken)
      await apiClient.put(`/api/projects/${projectId}`, {
        [annexKey]: { content },
      })
      toast.success('Anexo salvo com sucesso')
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar anexo')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          Anexo {annexNumber}
        </h2>
        <p className="text-gray-600">
          {title || annexDescriptions[annexNumber] || 'Conteúdo do anexo'}
        </p>
      </div>

      {/* Description */}
      {description && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">{description}</p>
        </div>
      )}

      {/* Editor */}
      <div className="mb-6">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Digite o conteúdo do anexo aqui..."
          className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Salvar Anexo
            </>
          )}
        </button>
      </div>

      {/* Help */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Dicas</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Mantenha o texto claro e objetivo</li>
              <li>• Use quebras de linha para melhor legibilidade</li>
              <li>• Verifique a ortografia antes de salvar</li>
              <li>• A IA pode sugerir melhorias automaticamente</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
