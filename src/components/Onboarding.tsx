import { useState } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { Award, Gift, TrendingUp, CheckCircle2, ArrowRight, X } from 'lucide-react';
import { storage } from '../utils/storage';

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  
  // Get onboarding steps from system config
  const config = storage.getSystemConfig();
  const steps = config.onboardingSteps || [];
  
  // If no steps configured, use defaults
  if (steps.length === 0) {
    onComplete();
    return null;
  }
  
  // Icons for each step (static, not editable)
  const icons = [Award, Gift, TrendingUp, CheckCircle2];

  const handleNext = () => {
    if (currentStep === steps.length - 1) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const CurrentIcon = icons[currentStep] || Award;

  return (
    <Dialog open onOpenChange={handleSkip}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <div className="flex justify-end">
          <button
            onClick={handleSkip}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-center space-y-4 sm:space-y-6 py-4 sm:py-6">
          <div className="flex justify-center">
            <div className="bg-gradient-to-br from-primary to-secondary rounded-full p-4 sm:p-6">
              <CurrentIcon className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            </div>
          </div>

          <div className="space-y-3 px-2">
            <h2 className="text-xl sm:text-2xl">{steps[currentStep].title}</h2>
            <p className="text-base sm:text-lg text-muted-foreground">
              {steps[currentStep].description}
            </p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {steps[currentStep].details}
            </p>
          </div>

          {/* Progress indicators */}
          <div className="flex justify-center gap-2 py-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-8 bg-primary'
                    : index < currentStep
                    ? 'w-2 bg-primary/50'
                    : 'w-2 bg-border'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2 sm:gap-3 px-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex-1 h-11 sm:h-12"
              >
                Anterior
              </Button>
            )}
            <Button onClick={handleNext} className="flex-1 h-11 sm:h-12">
              {currentStep === steps.length - 1 ? '¡Comenzar!' : 'Siguiente'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}