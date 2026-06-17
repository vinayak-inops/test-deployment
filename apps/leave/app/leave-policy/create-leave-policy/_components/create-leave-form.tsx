"use client";
import { useRouter } from "next/navigation";
import Table from "@repo/ui/components/table-dynamic/data-table";
import {
  leavePolicyForm,
  leavePolicyProgressBar,
  leavePolicySubmitForm,
  leavePolicyTableForm,
  leavePolicyTablePopup,
} from "@/json/leave-policy/create-policy/form-structure";
import DynamicForm from "@repo/ui/components/form-dynamic/dynamic-form";
import { useEffect, useState } from "react";
import MiniPopupWrapper from "@repo/ui/components/popupwrapper/mini-popup-wrapper";
import { useDynamicFieldUpdate } from "@/hooks/useDynamicFieldUpdate";
import { fetchDynamicQuery } from '@repo/ui/hooks/api/dynamic-graphql';

export default function CreateLeaveForm() {
  const [fromValue, setFormValue] = useState<any>();
  const [messenger, setMessenger] = useState<any>();
  const [open, setOpen] = useState<any>(false);
  const [data, setData] = useState<any>([]);
  const [editable, setEditable] = useState<any>(leavePolicyTablePopup);
  const [tempOrganizationData, setTempOrganizationData] = useState<any>(null);

  useEffect(() => {
    if (messenger?.locationSelectPopup == "false") {
      setOpen(false)
    }
    if (fromValue?.policyLocationsTable?.length > 0) {
      const uniqueLocations = new Set();
      const data = fromValue?.policyLocationsTable
        .filter((item: any) => {
          if (!item.location || uniqueLocations.has(item.location)) {
            return false;
          }
          uniqueLocations.add(item.location);
          return true;
        })
        .map((item: any, index: number) => ({
          _id: item.location || `location-${index}`,
          location: item.location || '',
          subsidiaries: item.subsidiaries || [],
          designations: item.designations || []
        }));
      setData(data.filter(Boolean));
    } else {
      setData([]);
    }
  }, [messenger, fromValue])

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
        label: "Create Leave Policy",
        status: true,
        classvalue: {
          container: "col-span-12 mb-2",
          label: "text-gray-600",
          field: "p-1",
        },
        function: () => {
          setOpen(true)
          setEditable(leavePolicyTablePopup)
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
        status: true,
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
        function: (item: any) => {
          router.push(`/excel-file-manager/upload-statues/${item?.like}`);
        },
      },
      actionEdit: {
        label: "Edit",
        status: true,
        classvalue: {
          container: "col-span-12 mb-2",
          label: "text-gray-600",
          field: "p-1",
        },
        function: (id: string) => {
          // Get the updated form JSON
          
          const updatedFormJson: any = updateField(id, leavePolicyTablePopup);
          setEditable(updatedFormJson);
          setOpen(true)
        },
      },
    },
  };

  const { updateField } = useDynamicFieldUpdate();

  const headData = [
    "location",
    "subsidiaries",
    "designations"
  ];

  // Fetch organization data
  const fetchOrganizationData = async () => {
    const organizationFields = {
        fields: [
            '_id',
            'organizationName',
            'organizationCode',
            'subsidiaries { label:subsidiaryName, value:subsidiaryCode, locationCode }',
            'designations { divisionCode, value:designationCode, label:designationName, subsidiaryCode, locationCode }',
            'grades { label:gradeCode, value:gradeName, designationCode, divisionCode, subsidiaryCode, locationCode }',
            'divisions { subsidiaryCode, value:divisionCode, label:divisionName, locationCode }',
            'departments { label:departmentName, value:departmentCode, divisionCode, subsidiaryCode, locationCode }',
            'subDepartments { label:subDepartmentName, value:subDepartmentCode, departmentCode, organizationCode, subsidiaryCode, divisionCode, locationCode }',
            'sections { label:sectionName, value:sectionCode, subDepartmentCode, departmentCode, divisionCode, subsidiaryCode, locationCode }',
            'location { label:locationName, value:locationCode }',
            'employeeCategories { employeeCategoryCode, employeeCategoryName }'
        ]
    };

    try {
        const result = await fetchDynamicQuery(
            organizationFields,
            'organization',
            'GetOrganizationsById',
            'getOrganizationsById',
            { id: '6839a36e20fbaf23ae2c410c' }
        );

        if (result.error) {
            throw new Error(result.error.message || 'Failed to fetch organization data');
        }

        return result.data;
    } catch (err) {
        console.error('Error fetching organization data:', err);
        return null;
    }
};

// Load organization data on component mount
useEffect(() => {
  const fetchAndSet = async () => {
      try {
          const data = await fetchOrganizationData();
          setTempOrganizationData(data);
          if (data) {
              setMessenger((prev: Record<string, any>) => ({
                  ...prev,
                  organizationData: data
              }));
          }
      } catch (error) {
          console.error('Error loading organization data:', error);
      }
  };

  fetchAndSet();
}, []);


  return (
    <div>
      <div className="w-full flex justify-center">
      <DynamicForm
        department={leavePolicyProgressBar}
        setFormValue={setFormValue}
        fromValue={fromValue}
        setMessenger={setMessenger}
        messenger={messenger}
      />
      </div>
      {(messenger?.progressbar === "Leave Policy" ||
        messenger?.progressbar == undefined) && (
          <DynamicForm
            department={leavePolicyForm}
            setFormValue={setFormValue}
            fromValue={fromValue}
            setMessenger={setMessenger}
            messenger={messenger}
          />
        )}
      {messenger?.progressbar === "Add Leave Area" && (
        <>
          <MiniPopupWrapper setOpen={setOpen} open={open}>
            <DynamicForm
              department={editable}
              setFormValue={setFormValue}
              fromValue={fromValue}
              setMessenger={setMessenger}
              messenger={messenger}
              test={tempOrganizationData}
            />
          </MiniPopupWrapper>

          <Table headData={headData} data={data} functionalityList={functionalityList} />

          {
            data.length > 0 && (
              <DynamicForm
                department={leavePolicySubmitForm}
                setFormValue={setFormValue}
                fromValue={fromValue}
                setMessenger={setMessenger}
                messenger={messenger}
              />
            )
          }
        </>
      )}
    </div>
  );
}
