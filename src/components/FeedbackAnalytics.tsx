import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { AlertCircle } from "lucide-react";

interface FeedbackAnalyticsProps {
  feedbacks: Array<{
    persona: string;
    feedback: string;
    selectedImageUrl: string;
  }>;
}

const FeedbackAnalytics = ({ feedbacks }: FeedbackAnalyticsProps) => {
  // 画像ごとの選択回数とエラー数を集計
  const { imageSelectionData, errorCount } = feedbacks.reduce(
    (acc: { 
      imageSelectionData: { [key: string]: number }; 
      errorCount: number 
    }, feedback) => {
      try {
        const imageUrl = feedback.selectedImageUrl;
        if (imageUrl) {
          acc.imageSelectionData[imageUrl] = (acc.imageSelectionData[imageUrl] || 0) + 1;
        }
      } catch (error) {
        acc.errorCount++;
      }
      return acc;
    },
    { imageSelectionData: {}, errorCount: 0 }
  );

  // グラフ用のデータ形式に変換
  const chartData = [
    ...Object.entries(imageSelectionData).map(([url, count], index) => ({
      name: `画像${index + 1}`,
      選択数: count,
      url
    })),
    ...(errorCount > 0 ? [{
      name: 'パース失敗',
      選択数: errorCount,
      isError: true
    }] : [])
  ];

  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">フィードバック分析</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar 
              dataKey="選択数" 
              fill={(data) => data.isError ? '#ef4444' : '#8884d8'}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-3 gap-4 mt-4">
        {chartData.filter(item => !item.isError).map((item, index) => (
          <div key={index} className="text-center">
            <img src={item.url} alt={`画像${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
            <p className="mt-2 text-sm text-gray-600">選択数: {item.選択数}</p>
          </div>
        ))}
      </div>
      {errorCount > 0 && (
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle className="h-4 w-4" />
          <span>パース失敗: {errorCount}件</span>
        </div>
      )}
    </Card>
  );
};

export default FeedbackAnalytics;