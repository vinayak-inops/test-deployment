"use client";

import React from "react";
import InputHandler from "./input/input-handler";

/**
 * Props for the InputField component
 */
interface InputFieldProps {
  field: any;
  tag: string;
  fields: any;
}

/**
 * InputField Component
 * Renders a form input field with validation and error handling
 * Now delegates to InputHandler for type-specific logic
 */
export default function InputField({
  field,
  tag,
  fields,
}: InputFieldProps) {
  return (
    <InputHandler 
      field={field}
      tag={tag}
      fields={fields}
    />
  );
}