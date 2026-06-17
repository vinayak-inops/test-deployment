"use client";

interface PunchRecord {
  id: string;
  punchedTime: string;
  inOut: "I" | "O";
  typeOfMovement: string;
  attendanceDate: string;
  Status: string;
}

interface TodayWorkPopupProps {
  isOpen: boolean;
  onClose: () => void;
  punches: PunchRecord[];
  totalHours: number;
}

export default function TodayWorkPopup({ isOpen, onClose, punches, totalHours }: TodayWorkPopupProps) {
  // Format time utility
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (<></>
    // <PunchRequestList isOpen={isOpen} onClose={onClose} />
  );
} 