import FeedbackAnalytics from "@/components/FeedbackAnalytics";
import { Feedback } from "@/types/feedback";

interface AnalyticsViewProps {
  feedbacks: Feedback[];
}

const AnalyticsView = ({ feedbacks }: AnalyticsViewProps) => {
  return (
    <div className="backdrop-blur-md bg-white/30 border border-white/20 shadow-xl rounded-lg">
      <FeedbackAnalytics feedbacks={feedbacks} />
    </div>
  );
};

export default AnalyticsView;