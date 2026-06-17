import React from 'react'
import { Button } from '@repo/ui/components/ui/button'
import { AlertCircle } from 'lucide-react'

type SaveEmployeeFilterButtonProps = {
    fromValue: any;
    setFormValue: (fn: (prev: any) => any) => void;
    setMessenger: (fn: (prev: any) => any) => void;
    messenger: any;
}

export default function SaveEmployeeFilterButton({ fromValue, setFormValue, setMessenger, messenger }: SaveEmployeeFilterButtonProps) {
    const formValue = messenger?.formValue || {};

    const selectedKeys = Object.entries(formValue)
        .filter(([key, value]) => typeof value === 'boolean' && key.toLowerCase().endsWith('select') && value === true)
        .map(([key]) => key);

    const getBaseKey = (key: string) => key.slice(0, key.length - 'select'.length);

    const hasValue = (val: any): boolean => {
        if (Array.isArray(val)) return val.length > 0;
        if (typeof val === 'string') return val.trim().length > 0;
        if (val && typeof val === 'object') return Object.keys(val).length > 0;
        return val !== undefined && val !== null;
    };

    const invalidKeys = selectedKeys.filter((selectKey) => {
        const baseKey = getBaseKey(selectKey);
        return !hasValue(formValue[baseKey]);
    });

    const canContinue = selectedKeys.length > 0 && invalidKeys.length === 0;

    // Get field labels for better error messages
    const getFieldLabel = (key: string): string => {
        const labelMap: Record<string, string> = {
            subsidiaries: 'Subsidiaries',
            divisions: 'Divisions', 
            departments: 'Departments',
            subDepartments: 'Sub Departments',
            sections: 'Sections',
            designations: 'Designations',
            grades: 'Grades',
            location: 'Location',
            employeeCategories: 'Employee Categories',
            contractor: 'Contractor',
            workOrderNumber: 'Work Order Number'
        };
        return labelMap[key] || key.charAt(0).toUpperCase() + key.slice(1);
    };

    const getErrorMessage = (): string => {
        if (selectedKeys.length === 0) {
            return "Please select at least one filter option to continue.";
        }
        
        if (invalidKeys.length > 0) {
            const missingFields = invalidKeys.map(selectKey => {
                const baseKey = getBaseKey(selectKey);
                return getFieldLabel(baseKey);
            });
            
            if (missingFields.length === 1) {
                return `Please select a value for ${missingFields[0]} to continue.`;
            } else {
                return `Please select values for the following fields: ${missingFields.join(', ')}`;
            }
        }
        
        return "";
    };

    const handleSaveAndContinue = () => {
        if (!canContinue) return;

        const valuesToPersist = selectedKeys.reduce((acc: any, selectKey: string) => {
            const baseKey = getBaseKey(selectKey);
            acc[baseKey] = formValue[baseKey];
            return acc;
        }, {} as Record<string, any>);

        setFormValue((prev: any) => ({
            ...prev,
            ...valuesToPersist,
        }));

        setMessenger((prev: any) => ({
            ...prev,
            formValue: {
                ...(prev?.formValue || {}),
                ...valuesToPersist,
            },
            progressbar: 'Basic Information',
        }));
    };

    const errorMessage = getErrorMessage();

    return (
        <div className="w-full pt-4">
            {/* Error Message Display */}
            {errorMessage && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <h4 className="text-sm font-medium text-red-800 mb-1">
                                Required Fields Missing
                            </h4>
                            <p className="text-sm text-red-700">
                                {errorMessage}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
                <Button
                    onClick={handleSaveAndContinue}
                    disabled={!canContinue}
                    className="px-8 py-2.5 h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                    Save and Continue
                </Button>
            </div>
        </div>
    )
}