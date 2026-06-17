import React from 'react';

const AddUserButton = ({addnew}:{addnew:any}) => {
  return (
    <button onClick={()=>{
      addnew.function()
    }} className="px-3 py-[7px] bg-[#0061ff] text-white rounded-md text-sm font-medium flex items-center gap-1">
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
        />
      </svg>
      {addnew.label}
    </button>
  );
};

export default AddUserButton;