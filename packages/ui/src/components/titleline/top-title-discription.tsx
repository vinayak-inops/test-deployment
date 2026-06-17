import Ptag from "../text/p-tag";
import React, { useState } from "react";
import { Pencil } from "lucide-react"; // Assuming you're using Lucide icons

interface TopTitleDescriptionProps {
  titleValue: {
    title: string;
    description: string;
  };
}

function TopTitleDescription({ titleValue }: TopTitleDescriptionProps) {
  const [showDescription, setShowDescription] = useState(false);

  const handleToggle = () => {
    setShowDescription((prev) => !prev);
  };

  return (
    <div className="mb-2 col-span-12">
      {titleValue?.title !== "" && (
        <div className="flex items-center gap-2">
          {/* Use Roboto font for the title */}
          <h2 className={`text-xl font-semibold text-gray-900 transition-colors duration-300 group-hover:text-gray-800`}>
            {titleValue?.title}
          </h2>
          <button
            onClick={handleToggle}
            className="text-gray-600 hover:text-gray-900 transition"
          >
            <Pencil size={16} />
          </button>
        </div>
      )}
      {showDescription && titleValue?.description !== "" && (
        // Use Roboto font for the description
        <div className="font-roboto">
          <Ptag textvalue={titleValue?.description} />
        </div>
      )}
    </div>
  );
}

export default TopTitleDescription;

// Add this to your global CSS if not already present:
// .font-roboto { font-family: 'Roboto', Arial, sans-serif; }
