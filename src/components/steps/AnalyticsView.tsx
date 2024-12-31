import FeedbackAnalytics from "@/components/FeedbackAnalytics";

interface AnalyticsViewProps {
  feedbacks: Array<{
    persona: string;
    feedback: string;
    selectedImageUrl: string;
  }>;
}

const AnalyticsView = ({ feedbacks }: AnalyticsViewProps) => {
  return (
    <div className="backdrop-blur-md bg-white/30 border border-white/20 shadow-xl rounded-lg">
      <FeedbackAnalytics feedbacks={feedbacks} />
    </div>
  );
};

export default AnalyticsView;