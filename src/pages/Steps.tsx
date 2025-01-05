import { useState } from "react";
import StepIndicator from "@/components/StepIndicator";
import PersonaCreation from "@/components/steps/PersonaCreation";
import PersonaConfirmation from "@/components/steps/PersonaConfirmation";
import ContentCreation from "@/components/steps/ContentCreation";
import FeedbackResults from "@/components/steps/FeedbackResults";
import AnalyticsView from "@/components/steps/AnalyticsView";
import { Feedback } from "@/types/feedback";
import FeedbackButton from "@/components/FeedbackButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { PersonaFormData } from "@/components/PersonaForm";
import { HistorySidebar } from "@/components/HistorySidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

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

const Steps = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [personas, setPersonas] = useState<string[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [formData, setFormData] = useState<PersonaFormData | null>(null);
  const { toast } = useToast();

  const handleStepClick = (stepIndex: number) => {
    if (stepIndex <= currentStep) {
      setCurrentStep(stepIndex);
    }
  };

  const saveExecutionHistory = async (data: PersonaFormData, personas: string[]) => {
    try {
      const { error } = await supabase.from("execution_history").insert({
        target_gender: data.targetGender,
        target_age: data.targetAge,
        target_income: data.targetIncome,
        service_description: data.serviceDescription,
        usage_scene: data.usageScene,
        personas: personas,
        user_id: null, // 認証機能実装時に更新
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error saving execution history:", error);
      toast({
        title: "エラーが発生しました",
        description: "実行履歴の保存に失敗しました。",
        variant: "destructive",
      });
    }
  };

  const updateExecutionHistoryWithFeedback = async (feedbacks: Feedback[]) => {
    try {
      const { data: latestHistory, error: fetchError } = await supabase
        .from("execution_history")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      if (latestHistory && latestHistory[0]) {
        const { error: updateError } = await supabase
          .from("execution_history")
          .update({ feedbacks: feedbacks as any })
          .eq("id", latestHistory[0].id);

        if (updateError) throw updateError;
      }
    } catch (error) {
      console.error("Error updating execution history:", error);
      toast({
        title: "エラーが発生しました",
        description: "フィードバックの保存に失敗しました。",
        variant: "destructive",
      });
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <PersonaCreation
            onPersonasGenerated={(newPersonas, formData) => {
              setPersonas(newPersonas);
              setFormData(formData);
              saveExecutionHistory(formData, newPersonas);
              setCurrentStep(1);
            }}
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
          <ContentCreation 
            personas={personas}
            onFeedbackGenerated={(newFeedbacks) => {
              setFeedbacks(newFeedbacks);
              updateExecutionHistoryWithFeedback(newFeedbacks);
              setCurrentStep(3);
            }}
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
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <HistorySidebar />
        <div 
          className="flex-1 py-12 px-4 sm:px-6 lg:px-8 relative"
          style={{
            backgroundImage: "url('/lovable-uploads/a7897bdf-655d-46b8-b190-acbfad79648c.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-white/15" />
          
          <FeedbackButton />
          
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
      </div>
    </SidebarProvider>
  );
};

export default Steps;