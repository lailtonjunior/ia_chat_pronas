export interface AIAnalysis {
  id: string
  project_id: string
  provider: 'openai' | 'gemini' | 'combined'
  analysis_type: 'full_project' | 'section' | 'suggestion' | 'validation'
  score: number
  result: any
  suggestions?: Suggestion[]
  critical_issues?: CriticalIssue[]
  warnings?: string[]
  created_at: string
}

export interface Suggestion {
  section: string
  original_text: string
  suggested_text: string
  reason: string
  priority: 'high' | 'medium' | 'low'
}

export interface CriticalIssue {
  section: string
  issue: string
  severity: 'critical' | 'high' | 'medium'
  solution: string
}
