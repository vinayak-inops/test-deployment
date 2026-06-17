import React from 'react';

interface EntriesPerPageProps {
  entriesPerPage: number;
  isOpen: boolean;
  onToggle: () => void;
  handleEntriesChange: any;
}

const EntriesPerPage = ({ entriesPerPage, isOpen, onToggle, handleEntriesChange }: EntriesPerPageProps) => {
  return (
    <div className="relative">
      <button
        className={`flex items-center gap-2 px-2 py-1.5 border ${isOpen ? 'border-gray-400 bg-gray-50' : 'border-gray-300'} rounded-md text-sm`}
        onClick={onToggle}
      >
        <span>{entriesPerPage}</span>
        <span className="text-gray-500">entries per page</span>
        <svg
          className="w-4 h-4 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-40 bg-white rounded-md shadow-lg border border-gray-200 z-10">
          <div className="py-1">
            {[5, 10, 20, 30, 40, 50].map((number) => (
              <button
                key={number}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                    handleEntriesChange(number)
                }}
              >
                {number} entries
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EntriesPerPage;