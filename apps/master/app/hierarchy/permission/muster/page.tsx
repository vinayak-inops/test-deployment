"use client";

import React from "react";
import MusterPermissionForm from "./_components/muster-permission";

export default function MusterPermissionPage() {
  const handleSave = (data: any) => {
    const payload = {
      tileName: "muster",
      serviceName: "muster",
      isActive:
        !!data.musterRollSelf ||
        !!data.musterRollAll ||
        !!data.rawPunchSelf ||
        !!data.rawPunchAll ||
        !!data.editPunch ||
        !!data.suspectedPunchAll ||
        !!data.addNewPunchAll ||
        !!data.addNewPunchSelf ||
        !!data.approve,
      screens: [
        {
          screenName: "muster-punch",
          permissions: {
            musterRollSelf: !!data.musterRollSelf,
            musterRollAll: !!data.musterRollAll,
            rawPunchSelf: !!data.rawPunchSelf,
            rawPunchAll: !!data.rawPunchAll,
            editPunch: !!data.editPunch,
            suspectedPunchAll: !!data.suspectedPunchAll,
            addNewPunchAll: !!data.addNewPunchAll,
            addNewPunchSelf: !!data.addNewPunchSelf,
          },
        },
        {
          screenName: "suspectedPunches",
          permissions: {
            approve: !!data.approve,
          },
        },
      ],
    };

    if (typeof window !== "undefined") {
      window.alert(JSON.stringify(payload, null, 2));
    }
  };

  return (
    <div className="flex justify-center min-h-screen">
      <div className="w-full max-w-5xl px-4 py-6">
        <MusterPermissionForm onSave={handleSave} mode="add" />
      </div>
    </div>
  );
}
