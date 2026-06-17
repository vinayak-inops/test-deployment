import React from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../../ui/select";

interface EntriesPerPageSelectorProps {
  entriesPerPage: number;
  handleEntriesChange: (value: string) => void;
}

const EntriesPerPageSelector: React.FC<EntriesPerPageSelectorProps> = ({
  entriesPerPage,
  handleEntriesChange,
}) => {
  return (
    <div className="flex items-center mb-4">
      <div className="flex items-center space-x-2">
        <Select
          value={entriesPerPage.toString()}
          onValueChange={handleEntriesChange}
        >
          <SelectTrigger className="w-[80px] h-9">
            <SelectValue placeholder="10" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-gray-500">entries per page</span>
      </div>
    </div>
  );
};

export default EntriesPerPageSelector;
