export interface FeedbackData {
  content: string;
  sentiment: string;
  suggestions: string[];
}

export interface Feedback {
  persona: string;
  feedback: FeedbackData;
  selectedImageUrl: string;
}