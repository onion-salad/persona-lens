
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Upload, X } from "lucide-react";

interface ServiceDetailsProps {
  onSubmit: (serviceDetails: string, images?: File[]) => Promise<void>;
  isLoading: boolean;
}

const ServiceDetails = ({ onSubmit, isLoading }: ServiceDetailsProps) => {
  const [details, setDetails] = useState("");
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

    const safeFiles = files.map(file => {
      const extension = file.name.split('.').pop() || '';
      const safeFileName = `${crypto.randomUUID()}.${extension}`;
      return new File([file], safeFileName, { type: file.type });
    });

    const newImages = [...images, ...safeFiles];
    setImages(newImages);

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
    if (!details) {
      toast({
        title: "エラー",
        description: "サービスの詳細を入力してください",
        variant: "destructive",
      });
      return;
    }
    await onSubmit(details, images.length > 0 ? images : undefined);
  };

  return (
    <Card className="p-8 backdrop-blur-md bg-white/30 border border-white/20 shadow-xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="details"
            className="block text-sm font-medium text-gray-900 mb-2"
          >
            サービスの詳細情報
          </label>
          <Textarea
            id="details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="サービスについての追加情報や特徴、具体的な利用シーンなどを記入してください"
            className="min-h-[200px] backdrop-blur-md bg-white/20 border border-white/30 focus:border-black/30 transition-colors"
          />
        </div>

        <div>
          <label
            htmlFor="image"
            className="block text-sm font-medium text-gray-900 mb-2"
          >
            関連画像をアップロード (任意・最大5枚まで)
          </label>
          <div className="mt-1 flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("image")?.click()}
              className="flex items-center gap-2 bg-white/50 hover:bg-white/70 border-white/30 hover:border-white/50 transition-all"
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
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`プレビュー ${index + 1}`}
                    className="w-full rounded-lg shadow-md transition-transform group-hover:scale-[1.02]"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button 
          type="submit" 
          disabled={isLoading || !details}
          className="w-full bg-black text-white hover:bg-black/80 transition-colors"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          フィードバックを取得
        </Button>
      </form>
    </Card>
  );
};

export default ServiceDetails;
