"use client"

import * as React from "react"
import { Switch } from "../../../ui/switch"
import { Label } from "../../../ui/label"
import { FieldProps } from "../../../../type/master/organization/type";

export default function SwitchButton() {
  const [isEnabled, setIsEnabled] = React.useState(false)

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <Switch
          id="airplane-mode"
          checked={isEnabled}
          onCheckedChange={setIsEnabled}
          className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
        />
        <Label
          htmlFor="airplane-mode"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Airplane Mode
        </Label>
      </div>
    </div>
  )
}