import { ModeEnum } from "../../../utils/form-dynamic/enum";
import { FieldError, UseFormRegister } from "react-hook-form";

export type FieldProps = {
    field: {
      value: undefined;
      name: string;
      label: string;
      type: string;
      placeholder?: string;
      required?: boolean;
      mode?: ModeEnum;
      maxLength: number;
      options:any;
      classvalue?: {
        container: string;
        label: string;
        field: string;
      };
      error?: FieldError;
      onChange?: any,
      children?: any[];
      displayOrder?: number;
    };
    register: UseFormRegister<any>;
    error: any;
    setValue?:any
    control?: any;
  };