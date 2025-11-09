'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Download, FileText } from 'lucide-react'
import { api } from '@/lib/api'
import type { GeneratedReport } from '@/types/project'

interface ReportPanelProps {
  projectId: string
}

export function ReportPanel({ projectId }: ReportPanelProps) {
  const [reports, setReports] = useState<GeneratedReport[]>([])
  const [loading, setLoading] = useState(false)

  const loadReports = async () => {
    try {
      setLoading(true)
      const response = await api.projects.listReports(projectId)
      setReports(response.data)
    } catch (error) {
      console.error(error)
      toast.error('Não foi possível carregar os relatórios.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReports().catch(console.error)
  }, [projectId])

  const requestExport = async (format: 'pdf' | 'docx') => {
    try {
      toast.loading(`Gerando ${format.toUpperCase()}...`, { id: 'export' })
      await api.projects.requestExport(projectId, format)
      toast.success('Relatório em processamento. Você será notificado quando estiver pronto.', {
        id: 'export',
      })
      await loadReports()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao solicitar exportação.', { id: 'export' })
    }
  }

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Relatórios e Exportações</h3>
        <div className="flex gap-2">
          <button
            onClick={() => requestExport('pdf')}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>
          <button
            onClick={() => requestExport('docx')}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <FileText className="w-4 h-4" />
            DOCX
          </button>
        </div>
      </div>

      {loading && <p className="text-sm text-gray-500">Carregando relatórios...</p>}

      {reports.length === 0 && !loading && (
        <p className="text-sm text-gray-500">Nenhum relatório disponível.</p>
      )}

      <ul className="divide-y divide-gray-100">
        {reports.map((report) => (
          <li key={report.id} className="py-3 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Relatório {report.format.toUpperCase()}</p>
              <p className="text-sm text-gray-500 capitalize">Status: {report.status}</p>
              <p className="text-xs text-gray-400">
                Gerado em {new Date(report.created_at).toLocaleString('pt-BR')}
              </p>
            </div>
            {report.status === 'ready' && report.file_url && (
              <a
                href={report.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm text-gray-700 hover:bg-gray-50"
              >
                <Download className="w-4 h-4" />
                Baixar
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
