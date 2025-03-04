import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import StepIndicator from "@/components/StepIndicator";
import PersonaCreation from "@/components/steps/PersonaCreation";
import PersonaConfirmation from "@/components/steps/PersonaConfirmation";
import ServiceDetails from "@/components/steps/ServiceDetails";
import FeedbackResults from "@/components/steps/FeedbackResults";
import AnalyticsView from "@/components/steps/AnalyticsView";
import { useStepNavigation } from "@/hooks/useStepNavigation";
import StepContainer from "@/components/steps/StepContainer";
import StepHeader from "@/components/steps/StepHeader";
import { useStepsState } from "@/hooks/useStepsState";
import { ExecutionHistoryItem } from "@/types/feedback";

const STEPS = [
  {
    title: "ペルソナ設定",
    description: "基本情報を入力",
  },
  {
    title: "ペルソナ確認",
    description: "生成されたペルソナを確認",
  },
  {
    title: "サービス詳細",
    description: "追加情報を入力",
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
  const location = useLocation();
  const { currentStep, setCurrentStep, handleStepClick, resetSteps } = useStepNavigation();
  const { personas, setPersonas, feedbacks, setFeedbacks, formData, setFormData, resetState } = useStepsState();

  useEffect(() => {
    console.log("Steps component mounted or location state changed", { 
      locationState: location.state,
      currentStep,
      personas,
      feedbacks 
    });

    if (location.state?.reset) {
      console.log("Resetting steps and state");
      resetSteps();
      resetState();
    }
  }, [location.state?.timestamp]);

  const handleHistorySelect = (selectedHistory: ExecutionHistoryItem) => {
    console.log("History item selected:", selectedHistory);
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
      setCurrentStep(3);
    } else {
      setCurrentStep(2);
    }
  };

  const renderStep = () => {
    console.log("Rendering step:", currentStep);
    switch (currentStep) {
      case 0:
        return (
          <PersonaCreation
            onPersonasGenerated={(newPersonas, formData) => {
              console.log("Personas generated:", { newPersonas, formData });
              setPersonas(newPersonas);
              setFormData(formData);
              setCurrentStep(1);
            }}
          />
        );
      case 1:
        return (
          <PersonaConfirmation
            personas={personas}
            onNext={() => {
              console.log("Moving to content creation step");
              setCurrentStep(2);
            }}
          />
        );
      case 2:
        return (
          <ServiceDetails 
            onSubmit={async (details, images) => {
              console.log("Service details submitted:", { details, images });
              // フィードバックの生成ロジックは後で実装
              setCurrentStep(3);
            }}
            isLoading={false}
          />
        );
      case 3:
        return (
          <FeedbackResults
            feedbacks={feedbacks}
            onNext={() => {
              console.log("Moving to analytics step");
              setCurrentStep(4);
            }}
          />
        );
      case 4:
        return <AnalyticsView feedbacks={feedbacks} />;
      default:
        return null;
    }
  };

  return (
    <StepContainer onHistorySelect={handleHistorySelect}>
      <StepHeader />
      <div className="mb-8">
        <StepIndicator 
          currentStep={currentStep} 
          steps={STEPS} 
          onStepClick={handleStepClick}
        />
      </div>
      <div className="space-y-8">
        {renderStep()}
      </div>
    </StepContainer>
  );
};

export default Steps;
