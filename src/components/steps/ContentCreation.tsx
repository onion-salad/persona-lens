import { useState } from "react";
import ContentForm from "@/components/ContentForm";
import { useToast } from "@/components/ui/use-toast";
import { Feedback } from "@/types/feedback";

interface ContentCreationProps {
  personas: string[];
  onFeedbackGenerated: (feedbacks: Feedback[]) => void;
}

const ContentCreation = ({ personas, onFeedbackGenerated }: ContentCreationProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleContentSubmit = async (content: string, images?: File[]) => {
    console.log("Starting content submission with:", { content, imageCount: images?.length });
    setIsLoading(true);
    const imageUrls: string[] = [];

    try {
      if (images && images.length > 0) {
        console.log("Processing images...");
        // ここでは一時的に画像をBase64として扱います
        for (const image of images) {
          const reader = new FileReader();
          const imageUrl = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(image);
          });
          imageUrls.push(imageUrl);
        }
      }

      console.log("Generating feedback with:", {
        content,
        imageUrls,
        personas
      });

      // モックのフィードバックデータを生成
      const mockFeedbacks: Feedback[] = personas.map(persona => ({
        persona,
        feedback: {
          firstImpression: "この製品は興味深い特徴を持っています。",
          appealPoints: ["使いやすさ", "デザイン", "機能性"],
          improvements: ["より詳細な説明があるとよい", "価格設定の見直し"],
          summary: "総じて良い印象です。"
        },
        selectedImageUrl: imageUrls.length > 0 ? imageUrls[0] : null
      }));

      onFeedbackGenerated(mockFeedbacks);

      toast({
        title: "フィードバックを生成しました",
        description: "各ペルソナからのフィードバックが生成されました。",
      });
    } catch (error) {
      console.error('Error generating feedback:', error);
      toast({
        title: "エラーが発生しました",
        description: "フィードバックの生成に失敗しました。",
        variant: "destructive",
      });
    } finally {
      console.log("Content submission process completed");
      setIsLoading(false);
    }
  };

  return (
    <ContentForm 
      onContentSubmit={handleContentSubmit}
      isLoading={isLoading}
    />
  );
};

export default ContentCreation;