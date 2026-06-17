"use client"
import { cn } from "../../../../utils/shadcnui/cn";
import { FieldProps } from "../../../../type/master/organization/type";
import React, { useEffect } from "react";
import { useStateTracker } from "../../../../hooks/form-dynamic/useStateTracker";
import { getLocalStorageValue } from "../../../../utils/form-dynamic/functions/value-data-set";

function ValueArray({ field, register, error, setValue, setError, eventHandler, valueUpdate, formStructure, watch }: any) {
    const nameChanged = useStateTracker(formStructure, 'formStructure');
    const [localstorageValue, setLocalstorageValue] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [errorLocalStorage, setErrorLocalStorage] = React.useState<any>(true);

    useEffect(() => {
        setIsLoading(true);
        field?.functions?.forEach((event: any) => {
            if (event.function === "getValeFromWatch") {
                try {
                        //   const parsedData = JSON.parse(storageKey);
                        const parsedData = watch(event.storageName)
                        setLocalstorageValue(parsedData);
                        setErrorLocalStorage(false)
                        setIsLoading(false);
                } catch (error) {
                    setErrorLocalStorage(true)
                } finally {
                    setIsLoading(false);
                }
            }
        });
    }, []);

    // Loading state
    if (isLoading) {
        return (
            <div className={cn("animate-pulse", field.classvalue.container)}>
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
                <div className="space-y-2">
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    // Error state
    // if (errorLocalStorage) {
    //     return (
    //         <div className={cn("p-4 rounded-lg border border-red-200 bg-red-50", field.classvalue.container)}>
    //             <div className="text-red-600 font-medium mb-1">{field.label}</div>
    //             <div className="text-sm text-red-500">{error.message}</div>
    //         </div>
    //     );
    // }

    // Empty state
    // if (localstorageValue[field.previewName]?.length == 0) {
    //     return (
    //         <div className={cn("p-4 rounded-lg border border-gray-200 bg-gray-50", field.classvalue.container)}>
    //             <div className="text-gray-700 font-medium mb-2">{field.label}</div>
    //             <div className="text-sm text-gray-500 italic">No items available</div>
    //         </div>
    //     );
    // }

    return (
        <div className={cn("p-0 rounded-lg bg-white", field.classvalue.container)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-0">
                <div className="text-gray-700 font-medium">{field.label}</div>
                <div className="text-xs text-gray-500">
                    {localstorageValue?.length} items
                </div>
            </div>

            {/* Items List */}
            <div className="space-y-1 space-x-2 flex flex-wrap">
                {localstorageValue?.map((item: any, index: number) => (
                    <div
                        key={`${item}-${index}`}
                        className={cn(
                            "text-sm bg-white border border-gray-300 p-3 rounded-full py-1",
                        )}
                    >
                        {/* Item Content */}
                        {item}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ValueArray;
