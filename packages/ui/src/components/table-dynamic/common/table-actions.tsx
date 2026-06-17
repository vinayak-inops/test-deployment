import React from "react";
import { Edit, MessageSquare, SendIcon, Trash2 } from "lucide-react";

interface TableActionsProps {
  item:any;
  id: string;
  functionCallingId: any;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  functionalityList?: any;
}
const TableActions: React.FC<TableActionsProps> = ({
  functionCallingId,
  functionalityList,
  item,
}) => {
  return (
    <td className="py-2 px-4 text-sm">
      <div className="flex space-x-2">
        {/* Edit Button */}
        
        {functionalityList?.buttons?.actionEdit?.status && (
          <button
            onClick={() =>
              functionalityList.buttons?.actionEdit?.function(functionCallingId)
            }
            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
          >
            <Edit className="h-4 w-4" />
          </button>
        )}

        {/* Delete Button */}
        {functionalityList?.buttons?.actionDelete?.status && (
          <button
            onClick={() =>
              functionalityList?.buttons?.actionDelete?.function(functionCallingId)
            }
            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}

        {/* Delete Button */}
        {functionalityList?.buttons?.actionLink?.status && (
          <button
            onClick={() =>
              functionalityList?.buttons?.actionLink?.function(item)
            }
            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
          >
            <SendIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </td>
  );
};

export default TableActions;
