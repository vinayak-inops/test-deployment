import { Check, AlertCircle } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";

interface StepProgressProps {
  steps: {
    label: string;
    date: string;
    completed: boolean;
    currentStatus?: string;
    eventMessage?: string;
  }[];
  currentIndex: number;
  isProcessing?: boolean;
  hasError?: boolean;
}

export default function StepProgress({ steps, currentIndex, isProcessing, hasError }: StepProgressProps) {
  const step = steps[currentIndex];
  const isCurrent = !step.completed && steps.findIndex((s) => !s.completed) === currentIndex;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center">
        {step.completed ? (
          <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white">
            <Check className="w-4 h-4" />
          </div>
        ) : isCurrent ? (
          <div className={cn(
            "w-6 h-6 rounded-full border-2 flex items-center justify-center",
            hasError ? "border-red-600 bg-red-50" :
            isProcessing ? "border-blue-600 bg-blue-50" :
            "border-indigo-600"
          )}>
            {hasError ? (
              <AlertCircle className="w-4 h-4 text-red-600" />
            ) : (
              <div className={cn(
                "w-2 h-2 rounded-full",
                isProcessing ? "bg-blue-600 animate-pulse" : "bg-indigo-600"
              )} />
            )}
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full border border-gray-300" />
        )}
      </div>
      <div className="text-xs text-gray-500 pt-2 text-center w-24">
        {step.date}
        <br />
        {step.label}
      </div>
    </div>
  );
}
