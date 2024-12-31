import { useState } from "react";
import PersonaForm, { PersonaFormData } from "@/components/PersonaForm";
import ContentForm from "@/components/ContentForm";
import StepIndicator from "@/components/StepIndicator";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PersonaConfirmation from "@/components/steps/PersonaConfirmation";
import FeedbackResults from "@/components/steps/FeedbackResults";
import AnalyticsView from "@/components/steps/AnalyticsView";

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
  {
    title: "分析",
    description: "フィードバック分析",
  },
];

const Index = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [personas, setPersonas] = useState<string[]>([]);
  const [feedbacks, setFeedbacks] = useState<Array<{
    persona: string;
    feedback: string;
    selectedImageUrl: string;
  }>>([]);
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

  const handleStepClick = (stepIndex: number) => {
    if (stepIndex <= currentStep) {
      setCurrentStep(stepIndex);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <PersonaForm
            onSubmit={handlePersonaFormSubmit}
            isLoading={isLoading}
          />
        );
      case 1:
        return (
          <PersonaConfirmation
            personas={personas}
            onNext={() => setCurrentStep(2)}
          />
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
          <FeedbackResults
            feedbacks={feedbacks}
            onNext={() => setCurrentStep(4)}
          />
        );
      case 4:
        return <AnalyticsView feedbacks={feedbacks} />;
      default:
        return null;
    }
  };

  return (
    <div 
      className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative"
      style={{
        backgroundImage: "url('/lovable-uploads/a7897bdf-655d-46b8-b190-acbfad79648c.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-white/95" />
      
      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-black mb-4">
            Persona Lens
          </h1>
          <p className="text-lg text-gray-600">
            多様なペルソナの視点からファーストビューの評価を得られます
          </p>
        </div>

        <div className="mb-8">
          <StepIndicator 
            currentStep={currentStep} 
            steps={steps} 
            onStepClick={handleStepClick}
          />
        </div>

        <div className="space-y-8">
          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default Index;
