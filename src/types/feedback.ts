export interface FeedbackData {
  firstImpression: string;
  appealPoints: string[];
  improvements: string[];
  summary: string;
}

export interface Feedback {
  persona: string;
  feedback: FeedbackData;
  selectedImageUrl?: string | null;
}

export interface ExecutionHistoryItem {
  id: string;
  target_gender: string;
  target_age: string;
  target_income: string;
  service_description: string;
  usage_scene: string;
  personas: string[];
  feedbacks: any[]; // Geminiからの返答をそのまま保存
  created_at: string;
  user_id: string | null;
}

// Supabaseのデータ型定義
export interface SupabaseExecutionHistory {
  id: string;
  target_gender: string;
  target_age: string;
  target_income: string;
  service_description: string;
  usage_scene: string;
  personas: string[];
  feedbacks: any[]; // Geminiからの返答をそのまま保存
  created_at: string;
  user_id: string | null;
}