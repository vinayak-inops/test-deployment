"use client";

import { v4 as uuidv4 } from 'uuid';
// Type definitions for better type safety
export interface FormData {
  id: string;
  form: any;
  values: Record<string, any>;
}

export interface FormStructure {
  actions: Array<{
    action: string;
    function?: Function;
    [key: string]: any;
  }>;
  [key: string]: any;
}

// Functions for CRUD operations on form data
export function getFormData(storageKey: string): FormData[] {
  if (typeof window === 'undefined') return [];
  
  const data = localStorage.getItem(storageKey);
  try {
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to parse form data:", e);
    return [];
  }
}

export function getFormDataById(storageKey: string, id: string): FormData | null {
  const data = getFormData(storageKey);
  return data.find(item => item.id === id) || null;
}

export function addFormData(
  storageKey: string, 
  formStructure: FormStructure, 
  formValues: Record<string, any>
): string {
  const data = getFormData(storageKey);
  const id = uuidv4();
  
  const newItem: FormData = {
    id,
    form: formStructure,
    values: formValues,
  };
  
  data.push(newItem);
  localStorage.setItem(storageKey, JSON.stringify(data));
  return id;
}

export function updateFormValues(
  storageKey: string, 
  id: string, 
  formValues: Record<string, any>
): boolean {
  const data = getFormData(storageKey);
  const index = data.findIndex(item => item.id === id);
  
  if (index === -1) return false;
  
  data[index].values = formValues;
  localStorage.setItem(storageKey, JSON.stringify(data));
  return true;
}

export function deleteFormData(storageKey: string, id: string): boolean {
  const data = getFormData(storageKey);
  const updated = data.filter(item => item.id !== id);
  
  if (updated.length === data.length) return false;
  
  localStorage.setItem(storageKey, JSON.stringify(updated));
  return true;
}

// Transform raw form data to table data
export function formDataToTableData(formData: FormData[]): any[] {
  return formData.map(item => ({
    ...item.values,
    functioncallingid: item.id
  }));
}