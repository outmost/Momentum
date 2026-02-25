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
import { createGoal } from '@/hooks/useGoals';
import { createFolder } from '@/hooks/useFolders';
import { updateSettings } from '@/hooks/useSettings';

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

  const completeOnboarding = async () => {
    try {
      // Create folder for the identity
      const folder = await createFolder({
        name: data.identity,
        color: '#5B5BD6', // Groove indigo
        icon: '🎯',
        category: 'custom',
      });

      // Create the first goal
      await createGoal({
        title: data.habit,
        type: 'binary',
        status: 'active',
        folderId: folder.id,
        frequency: 'daily',
        reminderEnabled: false,
        visibility: 'private',
      });

      // Mark onboarding as completed
      await updateSettings({ onboardingCompleted: true });

      // Redirect to home
      router.push('/');
    } catch (error) {
      console.error('Onboarding completion error:', error);
      // Still redirect even if there's an error
      router.push('/');
    }
  };

  const handleImageryComplete = async () => {
    await completeOnboarding();
  };

  const handleImagerySkip = async () => {
    await completeOnboarding();
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
