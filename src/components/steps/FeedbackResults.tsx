import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FeedbackData {
  firstImpression: string;
  appealPoints: string[];
  improvements: string[];
  summary: string;
}

interface FeedbackResultsProps {
  feedbacks: Array<{
    persona: string;
    feedback: FeedbackData;
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
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-black mb-2">第一印象</h4>
                <p className="text-gray-800">{feedback.feedback.firstImpression}</p>
              </div>
              <div>
                <h4 className="font-medium text-black mb-2">訴求ポイント</h4>
                <ul className="list-disc list-inside space-y-1">
                  {feedback.feedback.appealPoints.map((point, i) => (
                    <li key={i} className="text-gray-800">{point}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-black mb-2">改善点</h4>
                <ul className="list-disc list-inside space-y-1">
                  {feedback.feedback.improvements.map((improvement, i) => (
                    <li key={i} className="text-gray-800">{improvement}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-black mb-2">総評</h4>
                <p className="text-gray-800">{feedback.feedback.summary}</p>
              </div>
            </div>
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