'use client'

import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Upload, Loader, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { initializeApiClient } from '@/lib/api'

interface DocumentUploadProps {
  projectId?: string
  onUploadComplete?: (data: any) => void
}

export default function DocumentUpload({
  projectId,
  onUploadComplete,
}: DocumentUploadProps) {
  const { data: session } = useSession()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    for (const file of Array.from(files)) {
      await uploadFile(file)
    }
  }

  const uploadFile = async (file: File) => {
    // ✅ VALIDAÇÃO ADICIONADA
    if (!session?.accessToken) {
      toast.error('Você precisa estar autenticado')
      return
    }

    const apiClient = initializeApiClient(session.accessToken)

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)
      if (projectId) {
        formData.append('project_id', projectId)
      }

      const response = await apiClient.post(
        '/api/documents/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              )
              setUploadProgress(progress)
            }
          },
        }
      )

      setUploadedFiles((prev) => [...prev, response.data])
      toast.success(`${file.name} enviado com sucesso`)

      if (response.data.id) {
        handleAnalyzeDocument(response.data.id)
      }

      onUploadComplete?.(response.data)
    } catch (error: any) {
      console.error('Erro ao enviar arquivo:', error)
      if (error.response?.status === 413) {
        toast.error('Arquivo muito grande. Limite máximo: 100MB.')
      } else {
        toast.error(error.response?.data?.detail || `Erro ao enviar ${file.name}`)
      }
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleAnalyzeDocument = async (documentId: string) => {
    if (!session?.accessToken) return

    const apiClient = initializeApiClient(session.accessToken)

    try {
      toast.loading('Analisando documento...', { id: 'analyzing' })

      const response = await apiClient.post(
        `/api/documents/${documentId}/analyze`,
        { create_project: false }
      )

      toast.success('Análise concluída!', { id: 'analyzing' })
      console.log('Análise:', response.data)
    } catch (error: any) {
      console.error('Erro na análise:', error)
      toast.error(error.response?.data?.detail || 'Erro ao analisar documento', { id: 'analyzing' })
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Enviar Documentos
      </h3>

      {/* Upload Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.xlsx,.jpg,.png"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="hidden"
        />

        {isUploading ? (
          <>
            <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Enviando arquivo...</p>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mx-auto max-w-xs">
              <div
                className="h-full bg-blue-600 transition-all"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">{uploadProgress}%</p>
          </>
        ) : (
          <>
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-900 font-semibold mb-1">
              Arraste arquivos aqui ou clique para selecionar
            </p>
            <p className="text-sm text-gray-600">
              PDF, DOCX, XLSX, JPG, PNG - Máximo 100MB
            </p>
          </>
        )}
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <h4 className="font-semibold text-gray-900 mb-3">Arquivos Enviados</h4>
          <div className="space-y-2">
            {uploadedFiles.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{file.original_filename}</p>
                  <p className="text-sm text-gray-600">
                    {(file.file_size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Dica:</p>
            <p>
              Envie seu projeto em PDF para análise automática com IA. O sistema
              irá extrair conteúdo e analisar conformidade com PRONAS/PCD.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
