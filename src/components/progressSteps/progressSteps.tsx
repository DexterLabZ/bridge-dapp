import { FC } from 'react';
import './progressSteps.scss';

const ProgressSteps: FC<{ currentStep: number, startStep: number, endStep: number }> = ({ currentStep, startStep, endStep }) => {
  const steps: boolean[] = new Array(endStep + startStep).fill(false);

  for (const step in steps) {
    if (parseInt(step) >= startStep && parseInt(step) <= currentStep) steps[step] = true;
  }

  return (
    <div className='mb-4 onboarding-progress-container'>
      {
        steps.map((isCompleted, index) => {
          if (index >= startStep && index <= endStep) {
            return (
              <div className={`current-progress ${isCompleted ? 'filled' : ''}`} key={index}></div>
            );
          }
        })
      }
    </div>
  );
};

export default ProgressSteps;
