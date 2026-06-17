/**
 * ActionButton Component
 * A reusable button component for form actions that handles both save and custom actions.
 * It prevents form submission when a value was recently set programmatically.
 */

import { FormAction } from '../../../type/dynamic-form/types';
import { cn } from '../../../utils/shadcnui/cn';

interface ActionButtonProps {
  action: FormAction;
  isSetValueCalled: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = ({ action, isSetValueCalled }) => (
  <button
    onClick={(e) => {
      // Prevent form submission for non-save actions or when a value was just set
      if (action.action !== "save" || isSetValueCalled) {
        e.preventDefault();
        // Execute custom action function if available
        if (action.action !== "save" && action.function) {
          action.function();
        }
        return false;
      }
    }}
    // Set button type based on action type
    type={action.action === "save" ? "submit" : "button"}
    // Apply base styles and any custom classes
    className={cn(
      "px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors",
      action.classvalue
    )}
  >
    {action.label}
  </button>
); 