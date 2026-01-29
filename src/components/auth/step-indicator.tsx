'use client';

import { cn } from '@/lib/utils';

type Step = 'account' | 'payment' | 'success';

interface StepIndicatorProps {
  currentStep: Step;
}

const steps: { key: Step; label: string }[] = [
  { key: 'account', label: 'Account' },
  { key: 'payment', label: 'Payment' },
  { key: 'success', label: 'Complete' },
];

function getStepIndex(step: Step): number {
  return steps.findIndex((s) => s.key === step);
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentIndex = getStepIndex(currentStep);

  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={step.key} className="flex items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors',
                  isCompleted && 'bg-blue-600 border-blue-600 text-white',
                  isCurrent && 'border-blue-600 text-blue-600 bg-white',
                  !isCompleted && !isCurrent && 'border-gray-300 text-gray-400 bg-white'
                )}
              >
                {isCompleted ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  'text-xs mt-1 font-medium',
                  isCurrent || isCompleted ? 'text-blue-600' : 'text-gray-400'
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connecting line (except after last step) */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'w-16 h-0.5 mx-2',
                  index < currentIndex ? 'bg-blue-600' : 'bg-gray-300'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
