import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const useStepNavigation = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const handleStepClick = (stepIndex: number) => {
    if (stepIndex <= currentStep) {
      setCurrentStep(stepIndex);
    }
  };

  const goToNextStep = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const resetSteps = () => {
    setCurrentStep(0);
    navigate("/steps", { replace: true });
  };

  return {
    currentStep,
    setCurrentStep,
    handleStepClick,
    goToNextStep,
    resetSteps
  };
};