import React from 'react';

interface FilterButtonProps {
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (filter: string) => void;
}

const FilterButton = ({ isOpen, onToggle, onSelect }: FilterButtonProps) => {
  return (
    <div className="relative">
      <button 
        className={`p-1.5 border ${isOpen ? 'border-gray-400 bg-gray-50' : 'border-gray-300'} rounded-md`}
        onClick={onToggle}
      >
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
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-10">
          <div className="py-1">
            <div className="px-4 py-2 text-sm font-medium text-gray-700">Filter by</div>
            <div className="border-t border-gray-100">
              <button
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  onSelect('active');
                  onToggle();
                }}
              >
                Active users
              </button>
              <button
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  onSelect('inactive');
                  onToggle();
                }}
              >
                Inactive users
              </button>
              <button
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  onSelect('admin');
                  onToggle();
                }}
              >
                Admins
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterButton;