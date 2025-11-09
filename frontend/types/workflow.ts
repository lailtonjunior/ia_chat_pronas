export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface ApprovalStep {
  id: string
  project_id: string
  step_name: string
  status: ApprovalStatus
  order: number
  comment?: string | null
  decision_at?: string | null
  approver_id?: string | null
}

export interface ProjectComment {
  id: string
  project_id: string
  user_id: string
  content: string
  created_at: string
}

export interface WorkflowSummary {
  project_id: string
  status: string
  steps: ApprovalStep[]
  comments: ProjectComment[]
}
