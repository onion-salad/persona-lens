import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ContentFormProps {
  onContentSubmit: (content: string, image?: File) => Promise<void>;
  isLoading: boolean;
}

const ContentForm = ({ onContentSubmit, isLoading }: ContentFormProps) => {
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { toast } = useToast();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB制限
        toast({
          title: "エラー",
          description: "画像サイズは5MB以下にしてください",
          variant: "destructive",
        });
        return;
      }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content && !image) {
      toast({
        title: "エラー",
        description: "テキストまたは画像を入力してください",
        variant: "destructive",
      });
      return;
    }
    await onContentSubmit(content, image || undefined);
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

        <div>
          <label
            htmlFor="image"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            画像をアップロード (任意)
          </label>
          <div className="mt-1 flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("image")?.click()}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              画像を選択
            </Button>
            <input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
          {imagePreview && (
            <div className="mt-4">
              <img
                src={imagePreview}
                alt="プレビュー"
                className="max-w-xs rounded-lg shadow-md"
              />
            </div>
          )}
        </div>

        <Button type="submit" disabled={isLoading || (!content && !image)}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          フィードバックを取得
        </Button>
      </form>
    </Card>
  );
};

export default ContentForm;