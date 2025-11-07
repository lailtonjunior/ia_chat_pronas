'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Plus, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { initializeApiClient } from '@/lib/api'

interface ProjectCreateProps {
  onSuccess?: (projectId: string) => void
}

export default function ProjectCreate({ onSuccess }: ProjectCreateProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [method, setMethod] = useState<'manual' | 'pdf'>('manual')
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    institution_name: '',
    institution_cnpj: '',
  })

  const handleManualCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.accessToken) {
      toast.error('Token de acesso não encontrado')
      return
    }

    setLoading(true)

    try {
      const apiClient = initializeApiClient(session.accessToken)
      const response = await apiClient.post('/api/projects/', formData)

      toast.success('Projeto criado com sucesso')
      onSuccess?.(response.data.id)
      router.push(`/dashboard/projects/${response.data.id}`)
    } catch (error) {
      console.error('Erro ao criar projeto:', error)
      toast.error('Erro ao criar projeto')
    } finally {
      setLoading(false)
    }
  }

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!session?.accessToken) {
      toast.error('Token de acesso não encontrado')
      return
    }

    setLoading(true)

    let analysisToastId: string | number | undefined
    try {
      const apiClient = initializeApiClient(session.accessToken)
      // Upload do PDF
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)

      const uploadResponse = await apiClient.post('/api/documents/upload', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      analysisToastId = toast.loading('Analisando PDF...')

      // Análise do PDF
      const analysisResponse = await apiClient.post(
        `/api/documents/${uploadResponse.data.id}/analyze`,
        { create_project: true }
      )

      toast.success('Projeto criado a partir do PDF', { id: analysisToastId })
      onSuccess?.(analysisResponse.data.project_id)
      router.push(`/dashboard/projects/${analysisResponse.data.project_id}`)
    } catch (error) {
      console.error('Erro ao processar PDF:', error)
      const message =
        (error as any)?.response?.status === 413
          ? 'Arquivo muito grande (limite de 100MB).'
          : (error as any)?.response?.data?.detail || 'Erro ao processar PDF'
      if (analysisToastId) {
        toast.error(message, { id: analysisToastId })
      } else {
        toast.error(message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Criar Novo Projeto
      </h1>

      {/* Method Selection */}
      <div className="flex gap-4 mb-8">
        {[
          {
            id: 'manual',
            title: 'Criar Manualmente',
            icon: Plus,
            description: 'Preencher dados manualmente',
          },
          {
            id: 'pdf',
            title: 'Importar PDF',
            icon: Upload,
            description: 'Enviar um PDF existente',
          },
        ].map(({ id, title, icon: Icon, description }) => (
          <button
            key={id}
            onClick={() => setMethod(id as 'manual' | 'pdf')}
            className={`flex-1 p-6 border-2 rounded-lg transition-colors ${
              method === id
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <Icon className="w-8 h-8 mb-2" />
            <p className="font-semibold text-gray-900">{title}</p>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </button>
        ))}
      </div>

      {/* Manual Form */}
      {method === 'manual' && (
        <form onSubmit={handleManualCreate} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Título do Projeto *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Ex: Centro de Reabilitação APAE"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Descreva brevemente seu projeto"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Instituição Proponente
            </label>
            <input
              type="text"
              value={formData.institution_name}
              onChange={(e) =>
                setFormData({ ...formData, institution_name: e.target.value })
              }
              placeholder="Ex: APAE de Colmeia"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              CNPJ
            </label>
            <input
              type="text"
              value={formData.institution_cnpj}
              onChange={(e) =>
                setFormData({ ...formData, institution_cnpj: e.target.value })
              }
              placeholder="XX.XXX.XXX/XXXX-XX"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-semibold"
          >
            {loading ? 'Criando...' : 'Criar Projeto'}
          </button>
        </form>
      )}

      {/* PDF Upload */}
      {method === 'pdf' && (
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-4">
            Selecione um arquivo PDF
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={handlePdfUpload}
            disabled={loading}
            className="block w-full text-sm text-gray-600 cursor-pointer"
          />
          <p className="text-sm text-gray-500 mt-2">
            Máximo 50MB. O arquivo será analisado automaticamente.
          </p>
        </div>
      )}
    </div>
  )
}
