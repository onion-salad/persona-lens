export interface FeedbackData {
  firstImpression: string;
  appealPoints: string[];
  improvements: string[];
  summary: string;
}

export interface Feedback {
  persona: string;
  feedback: FeedbackData;
  selectedImageUrl?: string;
}

export interface ExecutionHistoryItem {
  id: string;
  target_gender: string;
  target_age: string;
  target_income: string;
  service_description: string;
  usage_scene: string;
  personas: string[];
  feedbacks: Feedback[];
  created_at: string;
  user_id: string | null;
}

// Supabaseのデータ型定義
export interface SupabaseFeedback {
  persona: string;
  feedback: {
    firstImpression: string;
    appealPoints: string[];
    improvements: string[];
    summary: string;
  };
  selectedImageUrl?: string;
}

export interface SupabaseExecutionHistory {
  id: string;
  target_gender: string;
  target_age: string;
  target_income: string;
  service_description: string;
  usage_scene: string;
  personas: string[];
  feedbacks: SupabaseFeedback[];
  created_at: string;
  user_id: string | null;
}