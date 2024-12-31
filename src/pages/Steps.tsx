import { useState } from "react";
import StepIndicator from "@/components/StepIndicator";
import PersonaCreation from "@/components/steps/PersonaCreation";
import PersonaConfirmation from "@/components/steps/PersonaConfirmation";
import ContentCreation from "@/components/steps/ContentCreation";
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
  const [personas, setPersonas] = useState<string[]>([]);
  const [feedbacks, setFeedbacks] = useState<Array<{
    persona: string;
    feedback: string;
    selectedImageUrl: string;
  }>>([]);

  const handleStepClick = (stepIndex: number) => {
    if (stepIndex <= currentStep) {
      setCurrentStep(stepIndex);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <PersonaCreation
            onPersonasGenerated={(newPersonas) => {
              setPersonas(newPersonas);
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
    <div 
      className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative"
      style={{
        backgroundImage: "url('/lovable-uploads/a7897bdf-655d-46b8-b190-acbfad79648c.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-white/15" />
      
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