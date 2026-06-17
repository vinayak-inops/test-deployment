import { NodeItemsListProps } from "@/type/work-flow/create-work-flow/props";
import { TriggerItem } from "./trigger-item";


export const NodeItemsList = ({ menu, onItemSelect }: NodeItemsListProps) => {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto space-y-1">
      {menu?.map((element: any) => (
        <div key={element.title} className="space-y-1">
          <TriggerItem
            title={element.title}
            description={element.description}
            type="circle"
            onClick={() => onItemSelect(element)}
          />
        </div>
      ))}
    </div>
  );
};