import React, { useEffect } from 'react';
import StepProgress from './step-progress-bar';
import { useLocalStorageSync } from '../../../../hooks/form-dynamic/useLocalStorageSync';

interface ProgressStepItemProps {
  step: any;
  index: number;
  currentIndex: number;
  hoveredStep: number | null;
  field: any;
  setValue: any;
  onStepClick: (index: number) => void;
  onStepSelect: (value: any, index: number, step: any) => void;
  setHoveredStep: (index: number | null) => void;
  isLastStep: boolean;
  updatedOptions: any;
}

export const ProgressStepItem: React.FC<ProgressStepItemProps> = ({
  step,
  index,
  currentIndex,
  hoveredStep,
  field,
  setValue,
  onStepClick,
  onStepSelect,
  setHoveredStep,
  isLastStep,
  updatedOptions,
}) => {
  const getConnectorLineClass = () => {
    if (index < currentIndex) return 'bg-indigo-600';
    if (hoveredStep === index) return 'bg-indigo-300';
    return 'bg-gray-300';
  };

  
  

  return (
    <div
      className="flex items-center relative"
      onMouseEnter={() => setHoveredStep(index)}
      onMouseLeave={() => setHoveredStep(null)}
      onClick={() => onStepSelect(step.value, index, step)}
    >
      {/* Step */}
      <div className="flex flex-col items-center">
        <StepProgress
          options={updatedOptions}
          currentIndex={index}
          onClick={onStepClick}
          setValue={setValue}
          field={field}
        />
      </div>

      {/* Connector Line */}
      {!isLastStep && (
        <div
          className={`w-[88px] absolute h-[2px] mx-1 top-[11px] left-14 transition-colors duration-200 ${getConnectorLineClass()}`}
        />
      )}
    </div>
  );
};

export default ProgressStepItem; 