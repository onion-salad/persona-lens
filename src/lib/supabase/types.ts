export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      personas: {
        Row: {
          id: string
          created_at: string
          user_id: string
          name: string
          age: number
          gender: string
          occupation: string
          interests: string[]
          personality: string
          background: string
          goals: string[]
          pain_points: string[]
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          name: string
          age: number
          gender: string
          occupation: string
          interests: string[]
          personality: string
          background: string
          goals: string[]
          pain_points: string[]
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          name?: string
          age?: number
          gender?: string
          occupation?: string
          interests?: string[]
          personality?: string
          background?: string
          goals?: string[]
          pain_points?: string[]
        }
      }
      feedback: {
        Row: {
          id: string
          created_at: string
          persona_id: string
          service_rating: number
          feedback_text: string
          improvement_suggestions: string[]
        }
        Insert: {
          id?: string
          created_at?: string
          persona_id: string
          service_rating: number
          feedback_text: string
          improvement_suggestions: string[]
        }
        Update: {
          id?: string
          created_at?: string
          persona_id?: string
          service_rating?: number
          feedback_text?: string
          improvement_suggestions?: string[]
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 