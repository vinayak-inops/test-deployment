import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import type { ChangeEvent } from "react"
import { useEffect, useState } from "react"

// Updated NumericInput component with proper empty value handling
function NumericInput({
  value,
  onChange,
  disabled,
  placeholder,
  hasError,
  className = "",
  label,
  required,
  helperText,
  step = "0.01",
}: {
  value: number
  onChange: (v: number) => void
  disabled?: boolean
  placeholder?: string
  hasError?: boolean
  className?: string
  label?: string
  required?: boolean
  helperText?: string
  step?: string
}) {
  const [inputValue, setInputValue] = useState<string>(value?.toString() || "")

  // Sync with external value changes
  useEffect(() => {
    setInputValue(value?.toString() || "")
  }, [value])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    
    // Allow empty string
    if (newValue === "") {
      setInputValue("")
      onChange(0)
      return
    }
    
    // Allow valid numbers
    const numValue = parseFloat(newValue)
    if (!isNaN(numValue)) {
      setInputValue(newValue)
      onChange(numValue)
    }
  }

  return (
    <div className="space-y-2">
      {label && (
        <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <Input
        type="text"
        inputMode="decimal"
        value={inputValue}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        step={step}
        className={`h-9 ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"} ${
          hasError ? "border-red-500 ring-red-500" : ""
        } ${className}`}
      />
      {helperText && <p className={`text-xs ${hasError ? "text-red-600" : "text-gray-500"}`}>{helperText}</p>}
    </div>
  )
}

export default NumericInput
