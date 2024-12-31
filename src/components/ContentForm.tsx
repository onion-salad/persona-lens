import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface ContentFormProps {
  onContentSubmit: (content: string) => void;
  isLoading: boolean;
}

const ContentForm = ({ onContentSubmit, isLoading }: ContentFormProps) => {
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onContentSubmit(content);
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
          ペルソナを生成する
        </Button>
      </form>
    </Card>
  );
};

export default ContentForm;