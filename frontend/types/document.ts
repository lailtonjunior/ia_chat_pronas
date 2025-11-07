export interface Document {
  id: string
  user_id: string
  project_id?: string
  filename: string
  original_filename: string
  file_type: string
  file_size: number
  is_processed: boolean
  created_at: string
}

export interface UploadResponse {
  id: string
  filename: string
  original_filename: string
  file_type: string
  file_size: number
  created_at: string
  message: string
}
