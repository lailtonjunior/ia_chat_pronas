'use client'

import { useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { FileText, UploadCloud, Loader2 } from 'lucide-react'
import { initializeApiClient } from '@/lib/api'

export default function PdfImportPanel() {
  const { data: session } = useSession()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isUploading, setUploading] = useState(false)

  const handlePdfUpload = async (file?: File | null) => {
    if (!file) return
    if (!session?.accessToken) {
      toast.error('Faça login para importar projetos.')
      return
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.error('Arquivo muito grande (limite de 100MB).')
      return
    }

    setUploading(true)
    let toastId: string | number | undefined

    try {
      const apiClient = initializeApiClient(session.accessToken)
      const uploadForm = new FormData()
      uploadForm.append('file', file)

      const uploadResponse = await apiClient.post(
        '/api/documents/upload',
        uploadForm,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      toastId = toast.loading('Analisando PDF com IA...')

      const analysisResponse = await apiClient.post(
        `/api/documents/${uploadResponse.data.id}/analyze`,
        { create_project: true }
      )

      toast.success('Projeto criado a partir do PDF!', { id: toastId })
      const projectId = analysisResponse.data.project_id
      router.push(`/dashboard/projects/${projectId}/editor`)
    } catch (error: any) {
      console.error('Erro ao importar PDF:', error)
      const message =
        error?.response?.status === 413
          ? 'Arquivo muito grande (limite de 100MB).'
          : error?.response?.data?.detail || 'Não foi possível processar o PDF.'
      if (toastId) {
        toast.error(message, { id: toastId })
      } else {
        toast.error(message)
      }
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
          <FileText className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
            Importação Inteligente
          </p>
          <h2 className="text-xl font-semibold text-gray-900">Importar projeto em PDF</h2>
          <p className="text-sm text-gray-600">
            Faça upload de um PDF já existente para que a IA extraia e organize todas as seções automaticamente.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50 px-4 py-6 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-60"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processando PDF...
            </>
          ) : (
            <>
              <UploadCloud className="h-5 w-5" />
              Selecionar arquivo PDF
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(event) => handlePdfUpload(event.target.files?.[0])}
        />
        <p className="mt-2 text-xs text-gray-500">
          Limite 100MB. Após a análise, o projeto será criado automaticamente e aberto para edição.
        </p>
      </div>
    </div>
  )
}
