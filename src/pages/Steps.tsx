import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [personas, setPersonas] = useState<string[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [formData, setFormData] = useState<PersonaFormData | null>(null);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
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

  useEffect(() => {
    if (location.state?.reset) {
      setCurrentStep(0);
      setPersonas([]);
      setFeedbacks([]);
      setFormData(null);
      navigate("/steps", { replace: true });
    }
  }, [location.state?.timestamp]);

  const saveExecutionHistory = async (data: PersonaFormData, personas: string[], feedbacks?: Feedback[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }

      if (currentHistoryId) {
        const { error: updateError } = await supabase
          .from("execution_history")
          .update({
            feedbacks: feedbacks || []
          })
          .eq('id', currentHistoryId);

        if (updateError) {
          console.error('Error updating history:', updateError);
          throw updateError;
        }
      } else {
        const { data: newHistory, error: insertError } = await supabase
          .from("execution_history")
          .insert([{
            target_gender: data.targetGender,
            target_age: data.targetAge,
            target_income: data.targetIncome,
            service_description: data.serviceDescription,
            usage_scene: data.usageScene,
            personas: personas,
            user_id: user.id,
            feedbacks: []
          }])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating history:', insertError);
          throw insertError;
        }

        setCurrentHistoryId(newHistory.id);
      }

    } catch (error) {
      console.error("Error saving execution history:", error);
      toast({
        title: "エラーが発生しました",
        description: "実行履歴の保存に失敗しました。",
        variant: "destructive",
      });
    }
  };

  const handleStepClick = (stepIndex: number) => {
    if (stepIndex <= currentStep) {
      setCurrentStep(stepIndex);
    }
  };

  const handlePersonasGenerated = async (newPersonas: string[], formData: PersonaFormData) => {
    setPersonas(newPersonas);
    setFormData(formData);
    await saveExecutionHistory(formData, newPersonas);
    setCurrentStep(1);
  };

  const handleFeedbackGenerated = async (newFeedbacks: Feedback[]) => {
    setFeedbacks(newFeedbacks);
    if (formData) {
      await saveExecutionHistory(formData, personas, newFeedbacks);
    }
    setCurrentStep(3);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <PersonaCreation
            onPersonasGenerated={handlePersonasGenerated}
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
            onFeedbackGenerated={handleFeedbackGenerated}
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
