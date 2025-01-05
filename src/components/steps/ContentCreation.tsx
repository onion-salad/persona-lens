import { useState } from "react";
import ContentForm from "@/components/ContentForm";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Feedback } from "@/types/feedback";

interface ContentCreationProps {
  personas: string[];
  onFeedbackGenerated: (feedbacks: Feedback[]) => void;
}

const ContentCreation = ({ personas, onFeedbackGenerated }: ContentCreationProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleContentSubmit = async (content: string, images?: File[]) => {
    setIsLoading(true);
    const imageUrls: string[] = [];

    try {
      if (images && images.length > 0) {
        for (const image of images) {
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('feedback-images')
            .upload(`${Date.now()}-${image.name}`, image);

          if (uploadError) {
            console.error('Upload error:', uploadError);
            throw uploadError;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('feedback-images')
            .getPublicUrl(uploadData.path);
            
          imageUrls.push(publicUrl);
        }
      }

      const { data: feedbackData, error: feedbackError } = await supabase.functions.invoke('generate-feedback', {
        body: { 
          content,
          imageUrls,
          personas
        }
      });

      if (feedbackError) throw feedbackError;

      // フィードバックデータの型を確認して変換
      const typedFeedbacks: Feedback[] = feedbackData.feedbacks.map((f: any) => ({
        persona: f.persona,
        feedback: {
          firstImpression: f.feedback.firstImpression,
          appealPoints: f.feedback.appealPoints,
          improvements: f.feedback.improvements,
          summary: f.feedback.summary
        },
        selectedImageUrl: f.selectedImageUrl
      }));
      
      onFeedbackGenerated(typedFeedbacks);

      toast({
        title: "フィードバックを生成しました",
        description: "各ペルソナからのフィードバックが生成されました。",
      });
    } catch (error) {
      console.error('Error:', error);
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
    <ContentForm 
      onContentSubmit={handleContentSubmit}
      isLoading={isLoading}
    />
  );
};

export default ContentCreation;