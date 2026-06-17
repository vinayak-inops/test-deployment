"use client";

import Table from "@repo/ui/components/table-dynamic/data-table";
import { useEffect, useState } from "react";

export default function TableForApplication({ rows, onOpenDetails, onAddNew }: any) {
	const [tableData, setTableData] = useState(rows ?? []);

	useEffect(()=>{
		setTableData(rows ?? []);
	},[rows])
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
				status: true,
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
				label: "Add New",
				status: true,
				classvalue: {
					container: "col-span-12 mb-2",
					label: "text-gray-600",
					field: "p-1",
				},
				function: () => {
					if (onAddNew) {
						try { onAddNew(); } catch {}
					}
				},
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
				function: async (deleteValue: any) => {
					// await handleOpenDelete(deleteValue);
				},
			},
			actionLink: {
				label: "Open",
				status: true,
				classvalue: {
					container: "col-span-12 mb-2",
					label: "text-gray-600",
					field: "p-1",
				},
				function: (data: any) => {
					if (onOpenDetails) {
						try { onOpenDetails(data); } catch {}
					}
				},
			},
			actionEdit: {
				label: "Edit",
				status: false,
				classvalue: {
					container: "col-span-12 mb-2",
					label: "text-gray-600",
					field: "p-1",
				},
				function: (data: any) => {},
			},
		},
	};

	return (
		<>
			{functionalityList && tableData && tableData.length > 0 && (
				<Table functionalityList={functionalityList} data={[...tableData].reverse()} />
			)}
		</>
	);
}