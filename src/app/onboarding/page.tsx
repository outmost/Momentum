'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'motion/react';
import { WelcomeScreen } from '@/components/onboarding/WelcomeScreen';
import { IdentityScreen } from '@/components/onboarding/IdentityScreen';
import { FirstHabitScreen } from '@/components/onboarding/FirstHabitScreen';
import { CueScreen } from '@/components/onboarding/CueScreen';
import { ExpectationScreen } from '@/components/onboarding/ExpectationScreen';
import { ImageryScreen } from '@/components/onboarding/ImageryScreen';

type OnboardingStep = 'welcome' | 'identity' | 'habit' | 'cue' | 'expectation' | 'imagery';

interface OnboardingData {
  identity: string;
  habit: string;
  cue: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [data, setData] = useState<OnboardingData>({
    identity: '',
    habit: '',
    cue: '',
  });

  // Prevent hydration mismatch
  useEffect(() => {
    // Component mounted
  }, []);

  const handleIdentity = (identity: string) => {
    setData({ ...data, identity });
    setStep('habit');
  };

  const handleHabit = (habit: string) => {
    setData({ ...data, habit });
    setStep('cue');
  };

  const handleCue = (cue: string) => {
    setData({ ...data, cue });
    setStep('expectation');
  };

  const handleExpectation = () => {
    setStep('imagery');
  };

  const handleImageryComplete = async () => {
    // TODO: Create initial goal and redirect to home
    // For now, just redirect to home
    router.push('/');
  };

  const handleImagerySkip = async () => {
    // TODO: Create initial goal and redirect to home
    // For now, just redirect to home
    router.push('/');
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg)',
        color: 'var(--text)',
        minHeight: '100dvh',
      }}
    >
      <AnimatePresence mode="wait">
        {step === 'welcome' && (
          <div key="welcome">
            <WelcomeScreen onNext={() => setStep('identity')} />
          </div>
        )}

        {step === 'identity' && (
          <div key="identity">
            <IdentityScreen
              onBack={() => setStep('welcome')}
              onNext={handleIdentity}
            />
          </div>
        )}

        {step === 'habit' && (
          <div key="habit">
            <FirstHabitScreen
              onBack={() => setStep('identity')}
              onNext={handleHabit}
            />
          </div>
        )}

        {step === 'cue' && (
          <div key="cue">
            <CueScreen
              onBack={() => setStep('habit')}
              onNext={handleCue}
            />
          </div>
        )}

        {step === 'expectation' && (
          <div key="expectation">
            <ExpectationScreen onNext={handleExpectation} />
          </div>
        )}

        {step === 'imagery' && (
          <div key="imagery">
            <ImageryScreen
              cueAnchor={data.cue}
              onSkip={handleImagerySkip}
              onComplete={handleImageryComplete}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
