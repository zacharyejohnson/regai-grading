import React from 'react';

const steps = ['Initial', 'Grading', 'Critiquing', 'Revision', 'Final'];

function GradingProgress({ currentStage }) {
  const currentIndex = steps.indexOf(currentStage);

  return (
    <div className="mb-8">
      <div className="flex items-center">
        {steps.map((step, index) => (
          <React.Fragment key={step}>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
              index <= currentIndex ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              {index + 1}
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-1 ${
                index < currentIndex ? 'bg-blue-500' : 'bg-gray-300'
              }`}></div>
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="flex justify-between mt-2">
        {steps.map((step) => (
          <div key={step} className="text-xs font-semibold text-gray-600">
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}

export default GradingProgress;