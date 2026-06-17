import React, { useEffect, useState } from 'react'
import { useFormContext } from "../../../../context/FormContext";

interface SmallTextValueProps {
    field: any;
    tag: string;
    fields: any;
  }

export default function SmallTextValue({ field, tag, fields }: SmallTextValueProps) {
    const {
        register,
        errors,
        setValue,
        text,
      } = useFormContext();
      const [textValue, setTextValue] = useState<any>();
      useEffect(() => {
        if(field.value){
            setTextValue(field.value);
        }else if(text){
            setTextValue(text);
        }else{
            setTextValue("Not specified");
        }
      }, [text]);
    return (
        <div className="flex items-center">
            <span className="text-sm text-gray-600 w-24">{field.label}:</span>
            <span className="text-sm font-medium text-gray-900">
                { textValue }
            </span>
        </div>
    )
}