import FeedbackAnalytics from "@/components/FeedbackAnalytics";
import { Feedback } from "@/types/feedback";

interface AnalyticsViewProps {
  feedbacks: Array<{
    persona: string;
    feedback: string;
    selectedImageUrl: string;
  }>;
}

const AnalyticsView = ({ feedbacks }: AnalyticsViewProps) => {
  // フィードバックデータを必要な形式に変換
  const formattedFeedbacks = feedbacks.map(feedback => ({
    persona: feedback.persona,
    feedback: typeof feedback.feedback === 'string' 
      ? feedback.feedback 
      : JSON.stringify(feedback.feedback),
    selectedImageUrl: feedback.selectedImageUrl || ''
  }));

  return (
    <div className="backdrop-blur-md bg-white/30 border border-white/20 shadow-xl rounded-lg">
      <FeedbackAnalytics feedbacks={formattedFeedbacks} />
    </div>
  );
};

export default AnalyticsView;