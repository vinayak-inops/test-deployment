import { EventActionTabsProps } from "@/type/work-flow/create-work-flow/props";
import { cn } from "@repo/ui/utils/shadcnui/cn";


export const EventActionTabs = ({ activeTab, onTabChange }: EventActionTabsProps) => {
  return (
    <div className="">
      <div className="flex justify-center pt-3">
        <div className="inline-flex rounded-md border border-gray-200 bg-white">
          <button
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              activeTab === "event"
                ? "bg-gray-100 text-gray-700"
                : "bg-white text-gray-500 hover:bg-gray-50"
            )}
            onClick={() => onTabChange("event")}
          >
            Event
          </button>
          <button
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              activeTab === "action"
                ? "bg-gray-100 text-gray-700"
                : "bg-white text-gray-500 hover:bg-gray-50"
            )}
            onClick={() => onTabChange("action")}
          >
            Action
          </button>
          <button
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              activeTab === "guard"
                ? "bg-gray-100 text-gray-700"
                : "bg-white text-gray-500 hover:bg-gray-50"
            )}
            onClick={() => onTabChange("guard")}
          >
            Guard
          </button>
        </div>
      </div>
    </div>
  );
};