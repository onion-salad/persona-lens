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
    console.log("Starting content submission with:", { content, imageCount: images?.length });
    setIsLoading(true);
    const imageUrls: string[] = [];

    try {
      if (images && images.length > 0) {
        console.log("Uploading images...");
        for (const image of images) {
          console.log("Uploading image:", image.name);
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
          console.log("Image uploaded successfully:", publicUrl);
        }
      }

      console.log("Invoking generate-feedback function...");
      const { data: feedbackData, error: feedbackError } = await supabase.functions.invoke('generate-feedback', {
        body: { 
          content,
          imageUrls,
          personas
        }
      });

      console.log("Response from generate-feedback:", { feedbackData, feedbackError });

      if (feedbackError) throw feedbackError;

      const typedFeedbacks: Feedback[] = feedbackData.feedbacks.map((f: any) => ({
        persona: f.persona,
        feedback: {
          firstImpression: f.feedback.firstImpression,
          appealPoints: f.feedback.appealPoints,
          improvements: f.feedback.improvements,
          summary: f.feedback.summary
        },
        selectedImageUrl: f.selectedImageUrl || null
      }));

      console.log('Generated feedbacks:', typedFeedbacks);
      
      onFeedbackGenerated(typedFeedbacks);

      toast({
        title: "フィードバックを生成しました",
        description: "各ペルソナからのフィードバックが生成されました。",
      });
    } catch (error) {
      console.error('Detailed error:', error);
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