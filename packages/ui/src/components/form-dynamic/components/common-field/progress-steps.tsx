"use client";

import { useEffect, useRef, useState } from "react";
import { useLocalStorageSync } from "../../../../hooks/form-dynamic/useLocalStorageSync";
import ProgressStepItem from "./progress-step-item";

interface ProgressStep {
  label: string;
  date: string;
  completed: boolean;
  error?: boolean;
  formData?: any;
  validation?: {
    required?: boolean;
    pattern?: RegExp;
    message?: string;
  };
}

export default function ProgressSteps({
  field,
  onStepChange,
  onStepComplete,
  onStepError,
  setValue,
  eventHandler,
  functionToHandleEvent,
  validateRequiredFields,
  setError,
  formStructure,
  localStorageData,
  fromValue,
  setFormValue,
  setMessenger
}: {
  field: any;
  onStepChange?: (index: number) => void;
  onStepComplete?: (index: number, data: any) => void;
  onStepError?: (index: number, error: string) => void;
  setValue: any;
  eventHandler: any;
  functionToHandleEvent: any;
  validateRequiredFields: any;
  setError: any;
  formStructure: any;
  localStorageData: any;
  fromValue:any;
  setFormValue:any;
  setMessenger:any
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const stepContainerRef = useRef<HTMLDivElement>(null);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [isInitialRender, setIsInitialRender] = useState(true);

  const currentIndex = field?.options.findIndex((step: any) => !step.completed);

  // Function to center the current step
  const centerCurrentStep = () => {
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
        const scrollTo = targetLeft - containerWidth / 2 + targetWidth / 2;

        const maxScroll = stepContainerRef.current.scrollWidth - containerWidth;
        const limitedScrollTo = Math.max(0, Math.min(scrollTo, maxScroll));

        container.scrollTo({
          left: limitedScrollTo,
          behavior: "smooth",
        });
      }
    }
  };

  // Initial width calculation
  useEffect(() => {
    const updateWidths = () => {
      if (scrollRef.current && stepContainerRef.current) {
        setContainerWidth(scrollRef.current.offsetWidth);
        setContentWidth(stepContainerRef.current.scrollWidth);
      }
    };

    updateWidths();
    window.addEventListener("resize", updateWidths);
    return () => window.removeEventListener("resize", updateWidths);
  }, [field?.options]);

  // Initial centering effect
  useEffect(() => {
    if (isInitialRender) {
      // Use setTimeout to ensure the DOM is fully rendered
      setTimeout(() => {
        centerCurrentStep();
        setIsInitialRender(false);
      }, 100);
    }
  }, [isInitialRender]);

  // Scroll event listener
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      setIsUserScrolling(true);
      setTimeout(() => setIsUserScrolling(false), 1000);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Auto-scroll effect
  useEffect(() => {
    if (!isUserScrolling && !isInitialRender) {
      centerCurrentStep();
    }
  }, [currentIndex, isUserScrolling, isInitialRender]);

  const handleStepClick = (index: number) => {
    if (index <= currentIndex) {
      onStepChange?.(index);
    }
  };

  const validateStep = (index: number, data: any) => {
    const step = field.options[index];
    if (step.validation) {
      if (step.validation.required && !data) {
        onStepError?.(index, "This field is required");
        return false;
      }
      if (step.validation.pattern && !step.validation.pattern.test(data)) {
        onStepError?.(index, step.validation.message || "Invalid format");
        return false;
      }
    }
    return true;
  };

  const handleStepComplete = (index: number, data: any) => {
    if (validateStep(index, data)) {
      onStepComplete?.(index, data);
    }
  };

  const isContentSmaller = contentWidth < containerWidth;

  const handleStepSelect = (value: any, index: number, step: any) => {
    // Update the form value for the current step
    setValue(field.name, value, {
      shouldValidate: true,
      shouldDirty: true,
    });

    let validationResult: any;
    // if (step.status != "firststate") {
      validationResult = validateRequiredFields(
        step.requiredfields,
        step,
        setError,
        formStructure
      );

      let select:any=false;

      if (step?.selectFields?.field?.length) {
        if(fromValue){
          select = step.selectFields.field.every((parentField: string) => {
            const fieldValue = fromValue?.[parentField];
            return fieldValue != null && fieldValue !== "";
          });
        }else{
          select = false;
        }
      }else{
        select = true;
      }
      if(select){
        validationResult = "noerror";
        setFormValue((prevState:any)=>{
          return {
            ...prevState,
            progressbar: value
          }
        })
        // setMessenger((prevState:any)=>{
        //   return {
        //     ...prevState,
        //     progressbar: value
        //   }
        // })
      }else{
        validationResult = "error";
      }


      // Then execute functionToHandleEvent with the validation result
      step?.functions?.forEach((functionDetails: any) => {
        if (functionDetails.function === "validateRequiredFields") {
          // if (
          //   step.status == "working" ||
          //   step.status == "completed" ||
          //   step.status == "firststate"
          // ) {
            functionToHandleEvent(step, setValue, validationResult);
          // }
        }
      });
    // }

    // Handle any child field updates that need to happen after step selection
    if (
      field?.onChange?.length > 0 &&
      (step.status == "working" ||
        step.status == "completed" ||
        step.status == "firststate")
    ) {
      field.onChange.forEach((event: any) => {
        if (event.event === "updatechild") {
          // Use setTimeout to ensure form state is updated before child updates
          setTimeout(() => {
            eventHandler(field.children, setValue, value, field);
          }, 0);
        }
      });
    }
  };
  const [updatedOptions, setUpdatedOptions] = useState<any>(field?.options || []);

  const { getLocalStorageData } = useLocalStorageSync();

  useEffect(() => {
    if (!field?.options?.length) return;

    const newOptions = field.options.map((option: any) => {
      let select = false;
      let parent = false;
      let children = false;

      if (option?.childrenFields?.field?.length) {
        if(fromValue){
          children = option.childrenFields.field.every((parentField: string) => {
            const fieldValue = fromValue?.[parentField];
            return fieldValue != null && fieldValue !== "";
          });
        }else{
          children = false;
        }
      }else{
        children = true;
      }

      if (option?.parentFields?.field?.length) {
        if(fromValue){
          parent = option.parentFields.field.every((parentField: string) => {
            const fieldValue = fromValue?.[parentField];
            return fieldValue != null && fieldValue !== "";
          });
        }else{
          parent = false;
        }
      }else{
        parent = true;
      }

      if (option?.selectFields?.field?.length) {
        if(fromValue){
          select = option.selectFields.field.every((parentField: string) => {
            const fieldValue = fromValue?.[parentField];
            return fieldValue != null && fieldValue !== "";
          });
        }else{
          select = true;
        }
      }else{
        select = true;
      }


      return {
        ...option,
        completed:select && parent && children,
        status:select ? "completed" : "Completed"
      }
    });

    setUpdatedOptions(newOptions);
  }, [field?.activeTab,fromValue]);

 

  return (
    <div className="relative w-full">
      <div
        ref={scrollRef}
        className={`overflow-x-auto scroll-smooth whitespace-nowrap scroll-hidden [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none] ${
          isContentSmaller ? "flex justify-center" : ""
        }`}
      >
        <div
          ref={stepContainerRef}
          className={`flex gap-4 py-0 w-max ${isContentSmaller ? "mx-auto" : ""}`}
        >
          {updatedOptions?.map((step: any, index: number) => (
            <ProgressStepItem
              key={index}
              step={step}
              index={index}
              currentIndex={currentIndex}
              hoveredStep={hoveredStep}
              field={field}
              updatedOptions={updatedOptions}
              setValue={setValue}
              onStepClick={handleStepClick}
              onStepSelect={handleStepSelect}
              setHoveredStep={setHoveredStep}
              isLastStep={index === field.options.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
