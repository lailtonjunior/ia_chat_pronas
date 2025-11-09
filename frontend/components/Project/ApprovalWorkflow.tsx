'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { ProjectSummary, ProjectStatus } from '@/types/project'
import type { ApprovalStep, ProjectComment, WorkflowSummary } from '@/types/workflow'
import { Loader2, Send, UserCheck, UserX } from 'lucide-react'

interface ApprovalWorkflowProps {
  project: ProjectSummary
  onRefreshProject: () => Promise<void> | void
  currentUserId?: string
}

const statusLabels: Record<ProjectStatus, string> = {
  draft: 'Rascunho',
  in_analysis: 'Em Análise',
  reviewed: 'Revisado',
  in_review: 'Em Revisão',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  submitted: 'Submetido',
}

export function ApprovalWorkflow({ project, onRefreshProject, currentUserId }: ApprovalWorkflowProps) {
  const [workflow, setWorkflow] = useState<WorkflowSummary | null>(null)
  const [comments, setComments] = useState<ProjectComment[]>([])
  const [loading, setLoading] = useState(true)
  const [approverInput, setApproverInput] = useState('')
  const [message, setMessage] = useState('')
  const [commentText, setCommentText] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const [workflowRes, commentsRes] = await Promise.all([
        api.projects.getWorkflow(project.id),
        api.projects.listComments(project.id),
      ])
      setWorkflow(workflowRes.data)
      setComments(commentsRes.data)
    } catch (error) {
      console.error(error)
      toast.error('Não foi possível carregar o workflow.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData().catch(console.error)
  }, [project.id])

  const pendingStepForCurrentUser = useMemo(() => {
    if (!workflow || !currentUserId) return undefined
    return workflow.steps.find(
      (step) => step.status === 'pending' && step.approver_id === currentUserId
    )
  }, [workflow, currentUserId])

  const handleSubmitForReview = async () => {
    const ids = approverInput
      .split(/[\n,]/)
      .map((value) => value.trim())
      .filter(Boolean)
    if (ids.length === 0) {
      toast.error('Informe pelo menos um ID de aprovador (UUID).')
      return
    }

    try {
      setActionLoading(true)
      await api.projects.submitForReview(project.id, ids, message || undefined)
      toast.success('Projeto enviado para revisão.')
      await Promise.all([loadData(), onRefreshProject?.()])
      setApproverInput('')
      setMessage('')
    } catch (error) {
      console.error(error)
      toast.error('Erro ao enviar para revisão.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDecision = async (action: 'approve' | 'reject') => {
    if (!pendingStepForCurrentUser) {
      toast.error('Nenhuma etapa pendente para você.')
      return
    }
    try {
      setActionLoading(true)
      if (action === 'approve') {
        await api.projects.approve(project.id, commentText || undefined)
      } else {
        await api.projects.reject(project.id, commentText || undefined)
      }
      toast.success(`Projeto ${action === 'approve' ? 'aprovado' : 'rejeitado'}.`)
      await Promise.all([loadData(), onRefreshProject?.()])
      setCommentText('')
    } catch (error) {
      console.error(error)
      toast.error('Operação não foi concluída.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddComment = async () => {
    if (!commentText.trim()) return
    try {
      await api.projects.addComment(project.id, commentText.trim())
      setCommentText('')
      await loadData()
      toast.success('Comentário registrado.')
    } catch (error) {
      console.error(error)
      toast.error('Erro ao adicionar comentário.')
    }
  }

  if (loading || !workflow) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        Carregando workflow...
      </div>
    )
  }

  const canSubmit = project.status === 'draft' || project.status === 'reviewed'
  const canDecide = Boolean(pendingStepForCurrentUser)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-semibold text-gray-900">Workflow de Aprovação</h2>
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
          Status atual: {statusLabels[project.status] ?? project.status}
        </span>
      </div>

      {/* Ações principais */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="p-4 border rounded-lg bg-white shadow-sm">
          <h3 className="font-medium text-gray-900 mb-2">Enviar para revisão</h3>
          <p className="text-sm text-gray-600 mb-4">
            Informe os IDs (UUID) dos aprovadores, separados por vírgula ou quebra de linha.
          </p>
          <textarea
            value={approverInput}
            onChange={(e) => setApproverInput(e.target.value)}
            className="w-full border rounded-lg p-3 mb-3"
            placeholder="00000000-0000-0000-0000-000000000000"
            rows={3}
            disabled={!canSubmit || actionLoading}
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full border rounded-lg p-3 mb-3"
            placeholder="Mensagem opcional para os aprovadores"
            rows={2}
            disabled={!canSubmit || actionLoading}
          />
          <button
            type="button"
            onClick={handleSubmitForReview}
            disabled={!canSubmit || actionLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {actionLoading ? 'Processando...' : 'Enviar para revisão'}
          </button>
        </div>

        <div className="p-4 border rounded-lg bg-white shadow-sm">
          <h3 className="font-medium text-gray-900 mb-2">Decisão do aprovador</h3>
          <p className="text-sm text-gray-600 mb-3">
            Se você é o aprovador da etapa atual, registre sua decisão e um comentário opcional.
          </p>
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="w-full border rounded-lg p-3 mb-3"
            placeholder="Comentário (opcional)"
            rows={3}
            disabled={!canDecide || actionLoading}
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleDecision('approve')}
              disabled={!canDecide || actionLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4" />
              Aprovar
            </button>
            <button
              type="button"
              onClick={() => handleDecision('reject')}
              disabled={!canDecide || actionLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              <UserX className="w-4 h-4" />
              Rejeitar
            </button>
          </div>
        </div>
      </div>

      {/* Etapas */}
      <div className="p-4 border rounded-lg bg-white shadow-sm">
        <h3 className="font-medium text-gray-900 mb-4">Etapas de aprovação</h3>
        <div className="space-y-3">
          {workflow.steps.length === 0 && (
            <p className="text-sm text-gray-500">Nenhuma etapa registrada.</p>
          )}
          {workflow.steps.map((step) => (
            <div key={step.id} className="border rounded-lg p-3 flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900">{step.step_name}</p>
                <p className="text-sm text-gray-500">
                  Status: <span className="font-semibold capitalize">{step.status}</span>
                  {step.comment ? ` • ${step.comment}` : ''}
                </p>
                {step.decision_at && (
                  <p className="text-xs text-gray-500">
                    Decidido em {new Date(step.decision_at).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
              {step.approver_id && (
                <span className="text-xs text-gray-500">
                  Aprovador: {step.approver_id.slice(0, 8)}...
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Comentários */}
      <div className="p-4 border rounded-lg bg-white shadow-sm space-y-4">
        <h3 className="font-medium text-gray-900">Comentários</h3>
        <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
          {comments.length === 0 && <p className="text-sm text-gray-500">Nenhum comentário.</p>}
          {comments.map((comment) => (
            <div key={comment.id} className="border rounded-lg p-3">
              <p className="text-sm text-gray-700">{comment.content}</p>
              <p className="text-xs text-gray-500 mt-2">
                Usuário {comment.user_id.slice(0, 8)}... •{' '}
                {new Date(comment.created_at).toLocaleString('pt-BR')}
              </p>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="flex-1 border rounded-lg px-3 py-2"
            placeholder="Adicionar comentário..."
          />
          <button
            type="button"
            onClick={handleAddComment}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 disabled:opacity-50"
            disabled={!commentText.trim()}
          >
            Comentar
          </button>
        </div>
      </div>
    </div>
  )
}
