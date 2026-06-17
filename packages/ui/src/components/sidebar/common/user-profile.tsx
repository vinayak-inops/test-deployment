import React from 'react';
import { ChevronDown } from "lucide-react";

interface UserProfileProps {
  name?: string;
  imageUrl?: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ 
  name = "D Yaminikrishna", 
  imageUrl = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces" 
}) => {
  return (
    <div className="p-4 border-b border-white/[0.08]">
      <div className="flex items-center gap-3">
        <img
          src={imageUrl}
          alt="Profile"
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex items-center justify-between flex-1">
          <span className="text-white">{name}</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </div>
  );
};

export default UserProfile;