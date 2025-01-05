import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StepIndicator from "@/components/StepIndicator";
import PersonaCreation from "@/components/steps/PersonaCreation";
import PersonaConfirmation from "@/components/steps/PersonaConfirmation";
import ContentCreation from "@/components/steps/ContentCreation";
import FeedbackResults from "@/components/steps/FeedbackResults";
import AnalyticsView from "@/components/steps/AnalyticsView";
import { Feedback } from "@/types/feedback";
import UserAvatar from "@/components/UserAvatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { PersonaFormData } from "@/components/PersonaForm";
import { HistorySidebar } from "@/components/HistorySidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ExecutionHistoryItem } from "@/types/feedback";

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
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [personas, setPersonas] = useState<string[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [formData, setFormData] = useState<PersonaFormData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      }
    };
    checkAuth();
  }, [navigate]);

  const handleStepClick = (stepIndex: number) => {
    if (stepIndex <= currentStep) {
      setCurrentStep(stepIndex);
    }
  };

  const saveExecutionHistory = async (data: PersonaFormData, personas: string[], feedbacks?: Feedback[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }

      const historyData = {
        target_gender: data.targetGender,
        target_age: data.targetAge,
        target_income: data.targetIncome,
        service_description: data.serviceDescription,
        usage_scene: data.usageScene,
        personas: personas,
        user_id: user.id,
        feedbacks: feedbacks ? feedbacks.map(f => ({
          persona: f.persona,
          feedback: f.feedback,
          selectedImageUrl: f.selectedImageUrl
        })) : null
      };

      const { error } = await supabase
        .from("execution_history")
        .upsert([historyData]);

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

  const handleHistorySelect = (selectedHistory: ExecutionHistoryItem) => {
    setFormData({
      targetGender: selectedHistory.target_gender,
      targetAge: selectedHistory.target_age,
      targetIncome: selectedHistory.target_income,
      serviceDescription: selectedHistory.service_description,
      usageScene: selectedHistory.usage_scene,
    });
    setPersonas(selectedHistory.personas);
    if (selectedHistory.feedbacks) {
      setFeedbacks(selectedHistory.feedbacks);
      setCurrentStep(3); // フィードバック結果の表示ステップへ
    } else {
      setCurrentStep(2); // 画像アップロードステップへ
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
        <HistorySidebar onHistorySelect={handleHistorySelect} />
        <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8 bg-white">
          <UserAvatar />
          
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
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
