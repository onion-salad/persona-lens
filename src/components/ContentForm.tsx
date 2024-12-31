import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Loader2, Camera } from "lucide-react";
import * as htmlToImage from 'html-to-image';

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

  const handleScreenshot = async () => {
    const element = document.getElementById('content-form');
    if (element) {
      const dataUrl = await htmlToImage.toPng(element);
      const link = document.createElement('a');
      link.download = 'feedback-content.png';
      link.href = dataUrl;
      link.click();
    }
  };

  return (
    <Card className="p-6" id="content-form">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700"
            >
              フィードバックを受けたい内容
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleScreenshot}
              className="flex items-center gap-2"
            >
              <Camera className="h-4 w-4" />
              スクリーンショット
            </Button>
          </div>
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