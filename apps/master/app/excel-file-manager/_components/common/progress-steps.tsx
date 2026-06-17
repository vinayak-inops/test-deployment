"use client";

import { useEffect, useRef } from "react";
import StepProgress from "./StepProgressBar";
import PayrollHeader from "./PayrollHeader";
import { useRouter } from "next/navigation";

interface ProgressStep {
  label: string;
  date: string;
  completed: boolean;
}

interface ProgressStepsProps {
  steps: ProgressStep[];
}

export default function ProgressSteps({ run }: { run: any }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const stepContainerRef = useRef<HTMLDivElement>(null);
  const currentIndex = run?.steps.findIndex((step: any) => !step.completed);
  const router = useRouter();

  useEffect(() => {
    if (
      scrollRef.current &&
      stepContainerRef.current &&
      currentIndex !== -1 &&
      stepContainerRef.current.children.length > currentIndex
    ) {
      const container = scrollRef.current;
      const targetStep = stepContainerRef.current.children[
        currentIndex
      ] as HTMLElement;

      if (targetStep) {
        const containerWidth = container.offsetWidth;
        const targetLeft = targetStep.offsetLeft;
        const targetWidth = targetStep.offsetWidth;
        const scrollTo = targetLeft - containerWidth / 1.5 + targetWidth / 2;

        container.scrollTo({
          left: scrollTo,
          behavior: "smooth",
        });
      }
    }
  }, [currentIndex]);

  return (
    <div className="flex items-center w-full gap-4">
      {/* Left: PayrollHeader */}
      <div className="flex-shrink-0">
        <PayrollHeader
          day={run?.day}
          month={run?.month}
          excelfilename={run?.excelfilename}
          workflowname={run?.workflowname}
          time={run?.time}
        />
      </div>

      {/* Middle: Progress Bar (takes remaining width) */}
      <div className="flex-1 min-w-0">
        <div
          ref={scrollRef}
          className="overflow-x-scroll scroll-smooth whitespace-nowrap scroll-hidden"
        >
          <div ref={stepContainerRef} className="flex w-max gap-4">
            {run?.steps.map((step: any, index: number) => (
              <div key={index} className="flex items-center relative">
                {/* Step */}
                <div className="flex flex-col items-center">
                  <StepProgress steps={run.steps} currentIndex={index} />
                </div>
                {/* Connector Line */}
                {index !== run.length - 1 && (
                  <div className="w-[88px] absolute h-[2px] bg-gray-300 mx-1 top-[11px] left-14" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Action Button */}
      {run.action && (
        <div className="flex flex-col items-center justify-center mt-0 top-0 pl-4 flex-shrink-0">
          <button onClick={()=>{
            router.push(`/excel-file-manager/upload-statues/${run?.excelfilename}`)
          }} className="px-5 py-1 text-blue-600 border border-blue-300 rounded-full hover:bg-blue-50 transition">
            {run.action.label}
          </button>
        </div>
      )}
    </div>
  );
}
