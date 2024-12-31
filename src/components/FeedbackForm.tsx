import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface FeedbackFormProps {
  personas: string[];
  onFeedbackReceived: (feedbacks: string[]) => void;
}

const FeedbackForm = ({ personas, onFeedbackReceived }: FeedbackFormProps) => {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/generate-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          personas,
        }),
      });

      const data = await response.json();
      onFeedbackReceived(data.feedbacks);
      toast({
        title: "フィードバックを生成しました",
        description: "各ペルソナからのフィードバックが生成されました。",
      });
    } catch (error) {
      toast({
        title: "エラーが発生しました",
        description: "フィードバックの生成に失敗しました。",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="content"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            フィードバックを受けたい内容
          </label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="フィードバックを受けたい内容を入力してください"
            className="min-h-[100px]"
          />
        </div>
        <Button type="submit" disabled={isLoading || !content}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          フィードバックを取得
        </Button>
      </form>
    </Card>
  );
};

export default FeedbackForm;