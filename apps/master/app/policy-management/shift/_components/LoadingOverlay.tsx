import React from "react";

export default function LoadingOverlay({ message = "Loading, please wait..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white bg-opacity-70">
      <div className="flex flex-col items-center p-8">
        <div className="mb-4">
          <span className="block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
        </div>
        <span className="font-semibold text-lg text-gray-700 text-center">{message}</span>
      </div>
    </div>
  );
} 