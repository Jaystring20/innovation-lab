import { cn } from '@/lib/utils';

interface Step {
  number: string;
  name: string;
  date?: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep?: number;
  className?: string;
}

/**
 * Horizontal timeline for the 4-stage Innovation Funnel
 * Shared by landing page and StageTracker in teacher dashboard
 */
const Stepper: React.FC<StepperProps> = ({ steps, currentStep, className }) => {
  return (
    <div className={cn('space-y-6 md:space-y-8', className)}>
      {steps.map((step, index) => (
        <div key={index} className="flex gap-4 md:gap-6">
          {/* Number circle + connector line */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-display font-semibold text-base md:text-lg',
                currentStep !== undefined && index <= currentStep
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-surface border border-border text-muted-foreground'
              )}
            >
              {step.number}
            </div>
            {/* Connector to next step (all but the last) */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'w-1 h-16 md:h-20 mt-2',
                  currentStep !== undefined && index < currentStep
                    ? 'bg-primary'
                    : 'bg-border'
                )}
              />
            )}
          </div>

          {/* Step info */}
          <div className="pt-1 pb-4 md:pb-8 flex-1">
            <h3 className="text-base md:text-lg font-semibold font-display text-foreground">
              {step.name}
            </h3>
            {step.date && (
              <p className="text-sm text-muted-foreground mt-1">{step.date}</p>
            )}
            {step.description && (
              <p className="text-sm text-muted-foreground mt-2">{step.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Stepper;
