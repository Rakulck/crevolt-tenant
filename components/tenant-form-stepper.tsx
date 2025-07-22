"use client"

import { Check } from "lucide-react"

interface StepperProps {
  currentStep: number
  steps: string[]
}

export function TenantFormStepper({ currentStep, steps }: StepperProps) {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep
          const isUpcoming = stepNumber > currentStep

          return (
            <div key={index} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                    isCompleted
                      ? "bg-[#4F46E5] border-[#4F46E5] text-white"
                      : isCurrent
                        ? "border-[#4F46E5] text-[#4F46E5] bg-white"
                        : "border-slate-300 text-slate-400 bg-white"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{stepNumber}</span>
                  )}
                </div>
                <span
                  className={`mt-2 text-sm font-medium ${
                    isCurrent ? "text-[#4F46E5]" : isCompleted ? "text-slate-900" : "text-slate-400"
                  }`}
                >
                  {step}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`h-0.5 w-16 mx-4 ${isCompleted ? "bg-[#4F46E5]" : "bg-slate-300"}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
