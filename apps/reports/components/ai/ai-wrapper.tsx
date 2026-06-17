"use client";

import React, { useState } from "react";
import { MessageSquare } from "lucide-react";
import { GreenChatWidget } from "@/components/ai/green-chat-widget";
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray";

function Aiwrapper() {
  const [isGreenChatOpen, setIsGreenChatOpen] = useState(false);
const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "ai",
    screenName: "aiChat",
  });
  return (
    <div className="pointer-events-none fixed inset-0 z-[9998]">
      {(!isGreenChatOpen && rolePermissions?.view) && (
        <div className="pointer-events-auto">
          <button
            type="button"
            onClick={() => setIsGreenChatOpen(true)}
            className="fixed bottom-4 right-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:bg-blue-700"
          >
            <MessageSquare className="h-6 w-6" />
          </button>
        </div>
      )}

      <div className="pointer-events-auto">
        <GreenChatWidget
          isOpen={isGreenChatOpen}
          onClose={() => setIsGreenChatOpen(false)}
        />
      </div>
    </div>
  );
}

export default Aiwrapper;
