import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Upload, X } from "lucide-react";

interface ContentFormProps {
  onContentSubmit: (content: string, images?: File[]) => Promise<void>;
  isLoading: boolean;
}

const ContentForm = ({ onContentSubmit, isLoading }: ContentFormProps) => {
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const { toast } = useToast();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalSize = files.reduce((acc, file) => acc + file.size, 0);
    const existingSize = images.reduce((acc, file) => acc + file.size, 0);

    if (totalSize + existingSize > 15 * 1024 * 1024) {
      toast({
        title: "エラー",
        description: "画像の合計サイズは15MB以下にしてください",
        variant: "destructive",
      });
      return;
    }

    if (images.length + files.length > 5) {
      toast({
        title: "エラー",
        description: "画像は最大5枚までアップロードできます",
        variant: "destructive",
      });
      return;
    }

    // ファイル名を安全な形式に変換
    const safeFiles = files.map(file => {
      // 拡張子を取得
      const extension = file.name.split('.').pop() || '';
      // 新しいBlobを作成し、安全なファイル名を付与
      const safeFileName = `${crypto.randomUUID()}.${extension}`;
      return new File([file], safeFileName, { type: file.type });
    });

    const newImages = [...images, ...safeFiles];
    setImages(newImages);

    // プレビューの生成
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content && images.length === 0) {
      toast({
        title: "エラー",
        description: "テキストまたは画像を入力してください",
        variant: "destructive",
      });
      return;
    }
    await onContentSubmit(content, images.length > 0 ? images : undefined);
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
            画像をアップロード (最大5枚まで)
          </label>
          <div className="mt-1 flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("image")?.click()}
              className="flex items-center gap-2"
              disabled={images.length >= 5}
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
              multiple
            />
          </div>
          {imagePreviews.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt={`プレビュー ${index + 1}`}
                    className="w-full rounded-lg shadow-md"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button type="submit" disabled={isLoading || (!content && images.length === 0)}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          フィードバックを取得
        </Button>
      </form>
    </Card>
  );
};

export default ContentForm;