"use client"
import { useRouter } from "next/navigation";
import Table from "@repo/ui/components/table-dynamic/data-table";
import leavePolicy from "@/json/leave-policy/leave-policy";
import { useState } from "react";
import BigPopupWrapper from "@repo/ui/components/popupwrapper/big-popup-wrapper";
import CreateLeaveForm from "../create-leave-policy/_components/create-leave-form";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";

export default function LeavePolicyTable() {

    const router = useRouter();
    const functionalityList = {
        tabletype: {
            type: "data",
            classvalue: {
                container: "col-span-12 mb-2",
                tableheder: {
                    container: "bg-[#f8fafc]",
                },
                label: "text-gray-600",
                field: "p-1",
            },
        },
        columnfunctionality: {
            draggable: {
                status: true,
            },
            handleRenameColumn: {
                status: true,
            },
            slNumber: {
                status: true,
            },
            selectCheck: {
                status: false,
            },
            activeColumn: {
                status: false,
            },
        },
        textfunctionality: {
            expandedCells: {
                status: true,
            },
        },
        filterfunctionality: {
            handleSortAsc: {
                status: true,
            },
            handleSortDesc: {
                status: true,
            },
            search: {
                status: true,
            },
        },
        outsidetablefunctionality: {
            paginationControls: {
                status: true,
                start: "",
                end: "",
            },
            entriesPerPageSelector: {
                status: false,
            },
        },
        buttons: {
            save: {
                label: "Save",
                status: false,
                classvalue: {
                    container: "col-span-12 mb-2",
                    label: "text-gray-600",
                    field: "p-1",
                },
                function: () => {},
            },
            submit: {
                label: "Submit",
                status: false,
                classvalue: {
                    container: "col-span-12 mb-2",
                    label: "text-gray-600",
                    field: "p-1",
                },
                function: () => {},
            },
            addnew: {
                label: "Create Leave Policy",
                status: false,
                classvalue: {
                    container: "col-span-12 mb-2",
                    label: "text-gray-600",
                    field: "p-1",
                },
                function: () => setOpen(true),
            },
            cancel: {
                label: "Cancel",
                status: false,
                classvalue: {
                    container: "col-span-12 mb-2",
                    label: "text-gray-600",
                    field: "p-1",
                },
                function: () => {},
            },
            actionDelete: {
                label: "Delete",
                status: false,
                classvalue: {
                    container: "col-span-12 mb-2",
                    label: "text-gray-600",
                    field: "p-1",
                },
                function: (id: string) => {},
            },
            actionLink: {
                label: "link",
                status: false,
                classvalue: {
                    container: "col-span-12 mb-2",
                    label: "text-gray-600",
                    field: "p-1",
                },
                function: (item: any) => { router.push(`/excel-file-manager/upload-statues/${item?.like}`) },
            },
            actionEdit: {
                label: "Edit",
                status: false,
                classvalue: {
                    container: "col-span-12 mb-2",
                    label: "text-gray-600",
                    field: "p-1",
                },
                function: (id: string) => {},
            },
        },
    }
    const [open, setOpen] = useState(false);
    const [rows, setRows] = useState<any[]>([]);

        // const transformedParam = transformToUnderscore(params["contractor-employee"][0])

        const {
            data,
            error,
            loading,
            refetch
        } = useRequest<any[]>({
            url: "contract_employee",
            requireAuth: true,
            onSuccess: (data) => {
                setRows(data);
            },
            onError: (error) => {
                console.error('Error loading organization data:', error);
            }
        });
    return (
        
        <div>
        <BigPopupWrapper open={open} setOpen={setOpen}>
           <div className="w-full h-full p-8 overflow-y-auto">
           <CreateLeaveForm />
           </div>
        </BigPopupWrapper>
        <div>
            <Table
                data={rows}
                functionalityList={functionalityList}
            />
        </div>
      </div>
    );
}
