
import IconComponent from "@/components/icon/icon-component";
import ControlButton from "@/components/ui/control-button";
import { ControlsProps } from "@/type/work-flow/create-work-flow/props";
import React, { useState } from "react";

const Controls: React.FC<ControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onReset,
}) => {
  const [isLocked, setIsLocked] = useState<boolean>(false);

  // Handle fullscreen toggle
  const handleFullscreen = async (): Promise<void> => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        // Uncomment if you want to hide sidebar in fullscreen
        // setSidebarSize("none");
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
        // Uncomment if you want to restore sidebar after exiting fullscreen
        // setSidebarSize("full");
      }
    } catch (err) {
    }
  };

  const handleLockToggle = (): void => {
    setIsLocked((prevState) => !prevState);
  };

  // Button styling
  const buttonBaseClass = `
    p-2 rounded border border-gray-300 shadow-sm 
    focus:outline-none transition-colors duration-200
    bg-gradient-to-b from-[#3f3f46] to-[#1b1b1b] 
    backdrop-blur-lg shadow-lg hover:bg-gray-50
  `;

  return (
    <div
      className={`absolute bottom-4 
     flex gap-2 z-50 ml-[14px]`}
    >
      <ControlButton
        onClick={handleFullscreen}
        title="Toggle fullscreen"
        iconName="Maximize2"
        iconClass="text-white"
        isLocked={isLocked}
        buttonBaseClass={buttonBaseClass}
      />

      <ControlButton
        onClick={onZoomIn}
        title="Zoom in"
        disabled={isLocked}
        iconName="ZoomIn"
        iconClass={`${isLocked ? "text-gray-400" : "text-white"}`}
        isLocked={isLocked}
        buttonBaseClass={buttonBaseClass}
      />

      <ControlButton
        onClick={onZoomOut}
        title="Zoom out"
        disabled={isLocked}
        iconName="ZoomOut"
        iconClass={`${isLocked ? "text-gray-400" : "text-white"}`}
        isLocked={isLocked}
        buttonBaseClass={buttonBaseClass}
      />

      <ControlButton
        onClick={onReset}
        title="Reset view"
        disabled={isLocked}
        iconName="RotateCcw"
        iconClass={`${isLocked ? "text-gray-400" : "text-white"}`}
        isLocked={isLocked}
        buttonBaseClass={buttonBaseClass}
      />

      <button
        onClick={handleLockToggle}
        className={`${buttonBaseClass} ${isLocked ? "bg-gray-100" : ""}`}
        title={isLocked ? "Unlock controls" : "Lock controls"}
      >
        <IconComponent
          icon={isLocked ? "Lock" : "Unlock"}
          size={20}
          className="text-white"
        />
      </button>
    </div>
  );
};

export default Controls;
