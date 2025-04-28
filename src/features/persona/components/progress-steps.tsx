import { motion } from "framer-motion"
import { Check, ChevronRight } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface Step {
  id: string
  title: string
  description: string
  isCompleted: boolean
  isOptional?: boolean
}

interface ProgressStepsProps {
  steps: Step[]
  currentStep: number
  onStepClick?: (index: number) => void
}

export function ProgressSteps({
  steps,
  currentStep,
  onStepClick,
}: ProgressStepsProps) {
  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="space-y-4">
      <div className="relative">
        <Progress value={progress} className="h-2" />
        <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full">
          <div className="flex justify-between">
            {steps.map((step, index) => {
              const isActive = index === currentStep
              const isPast = index < currentStep
              const isFuture = index > currentStep

              return (
                <motion.div
                  key={step.id}
                  className={`
                    relative flex items-center justify-center
                    w-8 h-8 rounded-full border-2 bg-background
                    transition-colors cursor-pointer
                    ${isActive ? "border-primary" : ""}
                    ${isPast ? "border-primary bg-primary text-primary-foreground" : ""}
                    ${isFuture ? "border-muted" : ""}
                  `}
                  onClick={() => onStepClick?.(index)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isPast ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="text-sm font-medium">
                      {index + 1}
                    </span>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {steps.map((step, index) => {
          const isActive = index === currentStep
          const isPast = index < currentStep

          return (
            <motion.div
              key={step.id}
              className={`
                space-y-1 cursor-pointer
                ${isActive ? "text-primary" : ""}
                ${isPast ? "text-muted-foreground" : ""}
              `}
              onClick={() => onStepClick?.(index)}
            >
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{step.title}</h3>
                {step.isOptional && (
                  <span className="text-xs text-muted-foreground">
                    (任意)
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {step.description}
              </p>
            </motion.div>
          )
        })}
      </div>

      <div className="flex justify-between mt-6">
        <button
          type="button"
          className={`
            flex items-center gap-2 text-sm font-medium
            ${currentStep === 0 ? "invisible" : ""}
          `}
          onClick={() => onStepClick?.(currentStep - 1)}
          disabled={currentStep === 0}
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          前のステップ
        </button>
        <button
          type="button"
          className={`
            flex items-center gap-2 text-sm font-medium
            ${currentStep === steps.length - 1 ? "invisible" : ""}
          `}
          onClick={() => onStepClick?.(currentStep + 1)}
          disabled={currentStep === steps.length - 1}
        >
          次のステップ
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
} 