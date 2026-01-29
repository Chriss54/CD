'use client';

import { Button } from '@/components/ui/button';

interface RegistrationStepPaymentProps {
  onComplete: () => void;
  onBack: () => void;
  isProcessing: boolean;
}

export function RegistrationStepPayment({
  onComplete,
  onBack,
  isProcessing,
}: RegistrationStepPaymentProps) {
  return (
    <div className="space-y-6">
      {/* Plan Card */}
      <div className="border rounded-lg p-6 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">Community Membership</h3>
            <p className="text-gray-600 text-sm mt-1">
              Full access to all community features
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold">$29</span>
            <span className="text-gray-600">/month</span>
          </div>
        </div>
      </div>

      {/* Mock Payment Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <p>
          This is a mock payment. No real charges will be made.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isProcessing}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={onComplete}
          disabled={isProcessing}
          className="flex-1"
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Processing...
            </span>
          ) : (
            'Complete Payment'
          )}
        </Button>
      </div>
    </div>
  );
}
