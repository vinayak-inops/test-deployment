import { Check, AlertCircle, Info } from "lucide-react";
import { useState } from "react";

interface StepProgressProps {
  options: any;
  currentIndex: number;
  onClick?: (index: number) => void;
  setValue: any;
  field: any;
}

export default function StepProgress({ options, currentIndex, onClick, setValue, field }: StepProgressProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const step = options[currentIndex];
  const isCurrent = !step?.completed && options.findIndex((s:any) => !s.completed) === currentIndex;
  const isClickable = onClick !== undefined;

  // const handleClick = () => {
  //   if (isClickable && onClick) {
  //     onClick(currentIndex);
  //   }
  // };

  const getStepStatus = () => {
    if (step?.error) return 'Error';
    if (step?.completed) return 'Completed';
    if (isCurrent) return 'Current';
    return 'Pending';
  };


  return (
    <div 
      className={`flex flex-col items-center justify-center ${isClickable ? 'cursor-pointer' : ''}`}
      // onClick={handleClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="relative flex items-center justify-center">
        {step?.completed ? (
          <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white">
            <Check className="w-4 h-4" />
          </div>
        ) : step?.error ? (
          <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white">
            <AlertCircle className="w-4 h-4" />
          </div>
        ) : isCurrent ? (
          <div className="w-6 h-6 rounded-full border-2 border-indigo-600 flex items-center justify-center bg-white">
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full border border-gray-300 bg-white" />
        )}

      </div>
      <div className="text-xs text-gray-500 pt-2 text-center w-24">
        <div className="font-medium">{step?.label}</div>
        <div className="text-[10px]">{step?.date}</div>
        {step?.error && (
          <div className="text-red-500 text-[10px] mt-1">
            {step.validation?.message || 'Error'}
          </div>
        )}
      </div>
    </div>
  );
}
