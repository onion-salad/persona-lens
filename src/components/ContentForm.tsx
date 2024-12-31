import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Loader2, Camera, Upload } from "lucide-react";
import * as htmlToImage from 'html-to-image';
import { Input } from "@/components/ui/input";

interface ContentFormProps {
  onContentSubmit: (content: string, image?: File) => void;
  isLoading: boolean;
}

const ContentForm = ({ onContentSubmit, isLoading }: ContentFormProps) => {
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onContentSubmit(content, image || undefined);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
            <div className="flex gap-2">
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
          </div>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="フィードバックを受けたい内容を入力してください"
            className="min-h-[100px] mb-4"
          />
          <div className="space-y-4">
            <div>
              <label
                htmlFor="image"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                画像をアップロード
              </label>
              <div className="flex items-center gap-4">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="flex-1"
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="プレビュー"
                    className="w-20 h-20 object-cover rounded"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
        <Button type="submit" disabled={isLoading || (!content && !image)}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          ペルソナを生成する
        </Button>
      </form>
    </Card>
  );
};

export default ContentForm;