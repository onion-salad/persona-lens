import { useState } from "react";
import { Card } from "@/components/ui/card";
import PersonaList from "@/components/PersonaList";
import ContentForm from "@/components/ContentForm";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PersonaForm, { PersonaFormData } from "@/components/PersonaForm";
import StepIndicator from "@/components/StepIndicator";

const steps = [
  {
    title: "ペルソナ設定",
    description: "基本情報を入力",
  },
  {
    title: "ペルソナ確認",
    description: "生成されたペルソナを確認",
  },
  {
    title: "画像アップロード",
    description: "評価する画像を選択",
  },
  {
    title: "フィードバック",
    description: "評価結果を確認",
  },
];

const Index = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [personas, setPersonas] = useState<string[]>([]);
  const [feedbacks, setFeedbacks] = useState<
    Array<{ persona: string; feedback: string; selectedImageUrl: string }>
  >([]);
  const { toast } = useToast();

  const handlePersonaFormSubmit = async (formData: PersonaFormData) => {
    setIsLoading(true);
    try {
      const { data: personasData, error: personasError } = await supabase.functions.invoke('generate-personas', {
        body: { 
          targetGender: formData.targetGender,
          targetAge: formData.targetAge,
          targetIncome: formData.targetIncome,
          serviceDescription: formData.serviceDescription,
          usageScene: formData.usageScene,
        }
      });
      
      if (personasError) throw personasError;
      
      setPersonas(personasData.personas);
      setCurrentStep(1);
      
      toast({
        title: "ペルソナを生成しました",
        description: "生成されたペルソナを確認してください。",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "エラーが発生しました",
        description: "ペルソナの生成に失敗しました。",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentSubmit = async (content: string, images?: File[]) => {
    setIsLoading(true);
    const imageUrls: string[] = [];

    try {
      if (images && images.length > 0) {
        for (const image of images) {
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('feedback-images')
            .upload(image.name, image);

          if (uploadError) {
            console.error('Upload error:', uploadError);
            throw uploadError;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('feedback-images')
            .getPublicUrl(image.name);
            
          imageUrls.push(publicUrl);
        }
      }

      console.log('Uploading images completed. URLs:', imageUrls);

      const { data: feedbackData, error: feedbackError } = await supabase.functions.invoke('generate-feedback', {
        body: { 
          imageUrls,
          personas
        }
      });

      console.log('Feedback response:', feedbackData);

      if (feedbackError) {
        console.error('Feedback error:', feedbackError);
        throw feedbackError;
      }
      
      setFeedbacks(feedbackData.feedbacks);
      setCurrentStep(3);

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

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <PersonaForm
            onSubmit={handlePersonaFormSubmit}
          />
        );
      case 1:
        return (
          <div className="space-y-4">
            <PersonaList personas={personas} />
            <div className="flex justify-end">
              <button
                onClick={() => setCurrentStep(2)}
                className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
              >
                次へ進む
              </button>
            </div>
          </div>
        );
      case 2:
        return (
          <ContentForm 
            onContentSubmit={handleContentSubmit}
            isLoading={isLoading}
          />
        );
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">フィードバック結果</h2>
            <div className="grid grid-cols-1 gap-4">
              {feedbacks.map((feedback, index) => (
                <Card key={index} className="p-4">
                  <div className="mb-2">
                    <h3 className="font-semibold text-gray-700">ペルソナ {index + 1}</h3>
                    <p className="text-sm text-gray-500">{feedback.persona}</p>
                  </div>
                  {feedback.selectedImageUrl && (
                    <div className="mb-4">
                      <img
                        src={feedback.selectedImageUrl}
                        alt={`選択された画像 ${index + 1}`}
                        className="w-full rounded-lg shadow-md"
                      />
                    </div>
                  )}
                  <p className="text-gray-700 whitespace-pre-wrap">{feedback.feedback}</p>
                </Card>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ファーストビュー評価ツール
          </h1>
          <p className="text-lg text-gray-600">
            多様なペルソナの視点からファーストビューの評価を得られます
          </p>
        </div>

        <div className="mb-8">
          <StepIndicator currentStep={currentStep} steps={steps} />
        </div>

        <div className="space-y-8">
          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default Index;