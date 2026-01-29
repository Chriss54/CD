'use client';

import { useState } from 'react';
import { type RegisterInput } from '@/lib/validations/auth';
import { registerWithMembership } from '@/lib/auth-actions';
import { StepIndicator } from './step-indicator';
import { RegistrationStepAccount } from './registration-step-account';
import { RegistrationStepPayment } from './registration-step-payment';
import { RegistrationSuccess } from './registration-success';

type Step = 'account' | 'payment' | 'success';

export function RegistrationWizard() {
  const [step, setStep] = useState<Step>('account');
  const [accountData, setAccountData] = useState<RegisterInput | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccountComplete = (data: RegisterInput) => {
    setAccountData(data);
    setStep('payment');
    setError(null);
  };

  const handlePaymentComplete = async () => {
    if (!accountData) return;

    setIsProcessing(true);
    setError(null);

    // Simulate payment processing delay (1.5s)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Register user with membership
    const result = await registerWithMembership(accountData);

    if ('error' in result) {
      setIsProcessing(false);
      // Handle field errors - show first error
      const firstError = Object.values(result.error)[0]?.[0];
      setError(firstError || 'Registration failed. Please try again.');
      // Go back to account step if it's a field error
      setStep('account');
      return;
    }

    setIsProcessing(false);
    setStep('success');
  };

  const handleBack = () => {
    setStep('account');
    setError(null);
  };

  return (
    <div>
      <StepIndicator currentStep={step} />

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      {step === 'account' && (
        <RegistrationStepAccount
          onComplete={handleAccountComplete}
          defaultValues={accountData || undefined}
        />
      )}

      {step === 'payment' && (
        <RegistrationStepPayment
          onComplete={handlePaymentComplete}
          onBack={handleBack}
          isProcessing={isProcessing}
        />
      )}

      {step === 'success' && accountData && (
        <RegistrationSuccess
          email={accountData.email}
          password={accountData.password}
        />
      )}
    </div>
  );
}
