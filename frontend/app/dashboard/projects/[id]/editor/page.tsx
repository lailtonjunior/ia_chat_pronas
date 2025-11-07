'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { Editor as TipTapEditorInstance } from '@tiptap/react'
import { toast } from 'sonner'
import { Save, Loader, Sparkles } from 'lucide-react'
import { initializeApiClient } from '@/lib/api'
import AISuggestionsSidebar, {
  AISuggestion,
} from '@/components/Editor/AISuggestionsSidebar'

const TipTapEditor = dynamic(() => import('@/components/Editor/TipTapEditor'), {
  ssr: false,
})

interface Project {
  id: string
  title: string
  description: string
  content: any
  combined_score: number
  status: string
}

export default function EditorPage() {
  const params = useParams()
  const { data: session, status } = useSession()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [content, setContent] = useState('')
  const [aiSuggestions, setAISuggestions] = useState<AISuggestion[]>([])
  const [aiSidebarOpen, setAISidebarOpen] = useState(false)
  const [aiLoading, setAILoading] = useState(false)
  const editorRef = useRef<TipTapEditorInstance | null>(null)

  const accessToken = session?.accessToken

  useEffect(() => {
    return () => {
      editorRef.current = null
    }
  }, [])

  useEffect(() => {
    if (status === 'loading') {
      return
    }

    if (!accessToken || !projectId) {
      setLoading(false)
      return
    }

    const fetchProject = async () => {
      setLoading(true)
      try {
        const apiClient = initializeApiClient(accessToken)
        const response = await apiClient.get(`/api/projects/${projectId}`)
        setProject(response.data)
        setContent(response.data.content?.text || '')
      } catch (error) {
        console.error('Erro ao buscar projeto:', error)
        toast.error('Erro ao carregar projeto')
        setProject(null)
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [accessToken, projectId, status])

  const handleSave = useCallback(async () => {
    if (!project) return
    if (!accessToken) {
      toast.error('Token de acesso não encontrado')
      return
    }

    setSaving(true)
    try {
      const apiClient = initializeApiClient(accessToken)
      await apiClient.put(`/api/projects/${projectId}`, {
        content: { text: content },
      })
      toast.success('Projeto salvo com sucesso')
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar projeto')
    } finally {
      setSaving(false)
    }
  }, [project, content, projectId, accessToken])

  const handleAIButtonClick = useCallback(
    async ({
      text,
      section,
      range,
    }: {
      text: string
      section: string
      range: { from: number; to: number }
    }) => {
      if (!accessToken || !projectId) {
        toast.error('Faça login para usar a IA.')
        return
      }

      const selection = text.trim()
      if (!selection) {
        toast.error('Selecione um trecho do texto para receber sugestões.')
        return
      }

      setAISidebarOpen(true)
      setAILoading(true)

      try {
        const apiClient = initializeApiClient(accessToken)
        const { data } = await apiClient.post('/api/ai/suggestions', {
          project_id: projectId,
          section,
          selected_text: selection,
          improvement_type: 'general',
        })

        const suggestion: AISuggestion = {
          id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
          section: data.section,
          originalText: selection,
          suggestedText: data.suggested_text,
          improvementType: data.improvement_type,
          range,
        }

        setAISuggestions((prev) => [suggestion, ...prev].slice(0, 5))
      } catch (error) {
        console.error('Erro ao buscar sugestão da IA:', error)
        toast.error('Não foi possível gerar a sugestão.')
      } finally {
        setAILoading(false)
      }
    },
    [accessToken, projectId]
  )

  const applySuggestion = useCallback((suggestion: AISuggestion) => {
    const editor = editorRef.current
    if (editor && suggestion.range) {
      editor
        .chain()
        .focus()
        .insertContentAt(
          { from: suggestion.range.from, to: suggestion.range.to },
          suggestion.suggestedText
        )
        .run()
      toast.success('Sugestão aplicada ao editor.')
    } else {
      setContent((current) =>
        current.replace(suggestion.originalText, suggestion.suggestedText)
      )
      toast.success('Sugestão aplicada.')
    }

    setAISuggestions((prev) => prev.filter((item) => item.id !== suggestion.id))
  }, [])

  const dismissSuggestion = useCallback((id: string) => {
    setAISuggestions((prev) => prev.filter((item) => item.id !== id))
    toast.info('Sugestão descartada.')
  }, [])

  const handleEditorReady = useCallback((instance: TipTapEditorInstance) => {
    editorRef.current = instance
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Projeto não encontrado</p>
      </div>
    )
  }

  const sidebarVisible = aiSidebarOpen || aiSuggestions.length > 0 || aiLoading

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
          <p className="text-sm text-gray-600">Score: {project.combined_score}%</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAISidebarOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"
            disabled={aiLoading}
          >
            {aiLoading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Sugestões IA
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor + Sidebar */}
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row">
          <div className="flex-1 min-w-0">
            <TipTapEditor
              initialContent={content}
              onChange={setContent}
              onAIRequest={handleAIButtonClick}
              aiDisabled={aiLoading}
              onEditorReady={handleEditorReady}
            />
          </div>

          <div className="lg:w-80">
            <AISuggestionsSidebar
              isOpen={sidebarVisible}
              loading={aiLoading}
              suggestions={aiSuggestions}
              onApply={applySuggestion}
              onDismiss={dismissSuggestion}
              onClose={() => setAISidebarOpen(false)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
