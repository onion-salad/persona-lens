export interface FeedbackData {
  firstImpression: string;
  appealPoints: string[];
  improvements: string[];
  summary: string;
}

export interface Feedback {
  persona: string;
  feedback: FeedbackData;
  selectedImageUrl: string;
}