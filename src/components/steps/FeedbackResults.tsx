import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FeedbackResultsProps {
  feedbacks: Array<{
    persona: string;
    feedback: string;
    selectedImageUrl: string;
  }>;
  onNext: () => void;
}

const FeedbackResults = ({ feedbacks, onNext }: FeedbackResultsProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-black mb-6">フィードバック結果</h2>
      <div className="grid grid-cols-1 gap-6">
        {feedbacks.map((feedback, index) => (
          <Card key={index} className="p-6 backdrop-blur-md bg-white/30 border border-white/20 shadow-xl">
            <div className="mb-4">
              <h3 className="font-semibold text-black mb-2">ペルソナ {index + 1}</h3>
              <p className="text-sm text-gray-600">{feedback.persona}</p>
            </div>
            {feedback.selectedImageUrl && (
              <div className="mb-4">
                <img
                  src={feedback.selectedImageUrl}
                  alt={`選択された画像 ${index + 1}`}
                  className="w-full rounded-lg shadow-md"
                />
              </div>
            )}
            <p className="text-gray-800 whitespace-pre-wrap">{feedback.feedback}</p>
          </Card>
        ))}
      </div>
      <div className="flex justify-end mt-6">
        <Button
          onClick={onNext}
          className="bg-black text-white hover:bg-black/80 transition-colors"
        >
          分析を見る
        </Button>
      </div>
    </div>
  );
};

export default FeedbackResults;