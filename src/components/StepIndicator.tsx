import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  currentStep: number;
  steps: {
    title: string;
    description: string;
  }[];
  onStepClick?: (stepIndex: number) => void;
}

const StepIndicator = ({ currentStep, steps, onStepClick }: StepIndicatorProps) => {
  return (
    <div className="w-full py-4">
      <div className="flex justify-between">
        {steps.map((step, index) => (
          <div
            key={index}
            className={cn(
              "flex flex-col items-center relative w-full cursor-pointer",
              index === steps.length - 1 ? "flex-1" : "flex-1",
              index <= currentStep ? "hover:opacity-80" : "cursor-not-allowed opacity-50"
            )}
            onClick={() => onStepClick?.(index)}
          >
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "absolute top-4 left-1/2 w-full h-[2px]",
                  currentStep > index ? "bg-primary" : "bg-gray-300"
                )}
              />
            )}
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 relative z-10 bg-background",
                currentStep > index
                  ? "bg-primary text-primary-foreground border-primary"
                  : currentStep === index
                  ? "border-primary text-primary"
                  : "border-gray-300 text-gray-300"
              )}
            >
              {index + 1}
            </div>
            <div className="mt-2 text-center">
              <div
                className={cn(
                  "text-sm font-medium",
                  currentStep >= index ? "text-primary" : "text-gray-300"
                )}
              >
                {step.title}
              </div>
              <div
                className={cn(
                  "text-xs",
                  currentStep >= index ? "text-gray-600" : "text-gray-300"
                )}
              >
                {step.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StepIndicator;