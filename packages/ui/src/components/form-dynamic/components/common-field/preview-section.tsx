"use client";

import * as React from "react";
import { cn } from "../../../../utils/shadcnui/cn";
import RecursiveFormStructure from "../../form-structure";
import { useFormContext } from "../../../../context/FormContext";

interface FilterTabsProps extends React.HTMLAttributes<HTMLDivElement> {
  tabs: {
    id: string;
    label: string;
  }[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

interface PreviewSectionProps {
  field: any;
  tag: string;
  fields: any;
}

export function PreviewSection({
  field,
  tag,
  fields,
}: PreviewSectionProps) {
  return (
    <div className={cn("rounded-md bg-white")}>
      <div className={` grid grid-cols-12 gap-2 w-full mt-0`}>
        {field?.subformstructure?.length > 0 &&
          field?.subformstructure?.map(
            (group: any, i: number) => (
              <React.Fragment key={i}>
                <RecursiveFormStructure
                  fields={group.fields}
                  subformstructure={{
                    formgrid: group.group,
                    classvalue: group.classvalue,
                    title: group.title,
                  }}
                />
              </React.Fragment>
            )
          )}
      </div>
    </div>
  );
}
