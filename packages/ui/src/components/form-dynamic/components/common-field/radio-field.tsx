
import type { UseFormRegister, FieldError } from "react-hook-form";

type RadioFieldProps = {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  register: UseFormRegister<any>;
  required?: boolean;
  error?: FieldError;
  disabled?: boolean;
};

function RadioField({
  label,
  name,
  options,
  register,
  required = false,
  error,
  disabled = false,
}: RadioFieldProps) {
  return (
    <div className="flex flex-col">
      <span className="mb-1 text-sm font-medium text-gray-700">{label}</span>
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex items-center space-x-2 text-sm ${
              disabled ? "text-gray-400" : "text-gray-700"
            }`}
          >
            <input
              type="radio"
              value={option.value}
              disabled={disabled}
              {...register(name, { required })}
              className={`h-4 w-4 border-gray-300 focus:ring-2 focus:ring-blue-500 ${
                disabled ? "bg-gray-100 cursor-not-allowed" : ""
              }`}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-500">
          {error.message || `${label} is required`}
        </p>
      )}
    </div>
  );
}

export default RadioField;