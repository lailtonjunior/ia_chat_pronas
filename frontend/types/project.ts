export type ProjectStatus =
  | 'draft'
  | 'in_analysis'
  | 'reviewed'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'submitted'

export interface ProjectSummary {
  id: string
  title: string
  description?: string
  status: ProjectStatus
  combined_score: number
  institution_name?: string
  institution_cnpj?: string
  created_at?: string
  updated_at?: string
}

export interface GeneratedReport {
  id: string
  format: 'pdf' | 'docx'
  status: 'pending' | 'processing' | 'ready' | 'failed'
  file_url?: string | null
  created_at: string
}
