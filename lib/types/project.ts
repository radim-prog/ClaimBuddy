export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'review' | 'completed' | 'cancelled'
export type PhaseStatus = 'pending' | 'active' | 'completed'

export interface Project {
  id: string
  title: string
  description: string | null
  outcome: string | null
  status: ProjectStatus
  company_id: string | null
  owner_id: string | null
  due_date: string | null
  estimated_hours: number | null
  actual_hours: number
  progress_percentage: number
  tags: string[]
  created_at: string
  updated_at: string
  completed_at: string | null
}

export interface ProjectPhase {
  id: string
  project_id: string
  title: string
  description: string | null
  position: number
  status: PhaseStatus
  due_date: string | null
  created_at: string
}

export interface CreateProjectInput {
  title: string
  description?: string
  outcome?: string
  company_id?: string
  owner_id?: string
  due_date?: string
  estimated_hours?: number
  tags?: string[]
  phases?: CreatePhaseInput[]
}

export interface UpdateProjectInput {
  title?: string
  description?: string
  outcome?: string
  status?: ProjectStatus
  company_id?: string
  owner_id?: string
  due_date?: string
  estimated_hours?: number
  actual_hours?: number
  progress_percentage?: number
  tags?: string[]
  completed_at?: string
}

export interface CreatePhaseInput {
  title: string
  description?: string
  position?: number
}
