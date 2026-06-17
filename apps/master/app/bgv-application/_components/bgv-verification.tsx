"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";

export const BGV_URL =
  "https://equal.in/app/gateway/?instance_id=gateway.equal.15959643-9efe-47f6-938c-2b954e22299f&sdk_launch=true";

export default function BGVVerification() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="h-full bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden relative">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-10">
          <Loader2 size={40} className="text-blue-600 animate-spin mb-4" />
          <h3 className="text-slate-700 font-medium">Connecting to BGV Gateway...</h3>
          <p className="text-slate-400 text-xs mt-1">Establishing secure handshake with Equal.in</p>
        </div>
      )}

      <iframe
        src={BGV_URL}
        title="BGV Verification Portal"
        className="w-full h-full border-none"
        allow="camera; microphone; geolocation; fullscreen"
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
}
