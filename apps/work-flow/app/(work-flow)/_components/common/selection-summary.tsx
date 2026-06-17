
import { SelectionSummaryProps } from "@/type/work-flow/create-work-flow/props";
import CommentSelectBox from "./comment-select-box";


export const SelectionSummary = ({
  tempNodeConnect,
  }: SelectionSummaryProps) => {
  return (
    <div className="flex-1 min-h-0 pb-4 overflow-y-scroll">
      <h2 className="pt-4 pb-2 px-4 font-bold text-base bg-white sticky top-0">
        Next Selected State
      </h2>
      <div>
        <CommentSelectBox
          username={tempNodeConnect.prasentState.title}
          content={tempNodeConnect.prasentState.title}
        />
      </div>

      <h2 className="pt-4 pb-2 px-4 font-bold text-base bg-white sticky top-0">
        Selected Event
      </h2>
      <div>
        {tempNodeConnect.event != "" && (
          <CommentSelectBox
            username={tempNodeConnect.event?.title}
            content={tempNodeConnect.event?.description}
          />
        )}
      </div>

      <h2 className="pt-4 pb-2 px-4 font-bold text-base bg-white sticky top-0">
        Selected Action
      </h2>
      <div>
        {tempNodeConnect.action != "" && (
          <CommentSelectBox
            username={tempNodeConnect.action?.title}
            content={tempNodeConnect.action?.description}
          />
        )}
      </div>

      <h2 className="pt-4 pb-2 px-4 font-bold text-base bg-white sticky top-0">
        Selected Guard
      </h2>
      <div>
        {tempNodeConnect.guard != "" && (
          <CommentSelectBox
            username={tempNodeConnect.guard?.title}
            content={tempNodeConnect.guard?.description}
          />
        )}
      </div>
    </div>
  );
};
