import StatCardMain from "@/components/statcard";
import Table from "@repo/ui/components/table-dynamic/data-table";

export default function Home() {
  const data = [
    {
      cadre_name: "Union",
      cadregroup: "Union",
      cadreid: 1,
      dept_name: "HR",
      deptid: 1,
      desigid: 1,
      design_name: "Manager",
      doj: "12-05-2000",
      empid: 1001,
      empname: "John Doe",
      end: "6.00pm",
      id: "row-1",
      locationid: 1,
      lunch_time: "1.00pm to 1.30pm",
      shiftid: "A1",
      shifttype: "F",
      start: "9.00am",
      wkoffid: 2,
      wkoffid2: 6,
    },
    {
      cadre_name: "Union",
      cadregroup: "Union",
      cadreid: 2,
      dept_name: "Finance",
      deptid: 2,
      desigid: 2,
      design_name: "Analyst",
      doj: "15-07-2005",
      empid: 1002,
      empname: "Jane Smith",
      end: "5.30pm",
      id: "row-2",
      locationid: 1,
      lunch_time: "12.30pm to 1.00pm",
      shiftid: "B1",
      shifttype: "F",
      start: "8.30am",
      wkoffid: 3,
      wkoffid2: 7,
    },
    {
      cadre_name: "Union",
      cadregroup: "Union",
      cadreid: 3,
      dept_name: "IT",
      deptid: 3,
      desigid: 3,
      design_name: "Software Engineer",
      doj: "20-09-2010",
      empid: 1003,
      empname: "Alice Brown",
      end: "7.00pm",
      id: "row-3",
      locationid: 2,
      lunch_time: "1.30pm to 2.00pm",
      shiftid: "C1",
      shifttype: "F",
      start: "10.00am",
      wkoffid: 4,
      wkoffid2: 1,
    },
    {
      cadre_name: "Union",
      cadregroup: "Union",
      cadreid: 4,
      dept_name: "Operations",
      deptid: 4,
      desigid: 4,
      design_name: "Supervisor",
      doj: "11-02-2012",
      empid: 1004,
      empname: "Mark Taylor",
      end: "4.30pm",
      id: "row-4",
      locationid: 3,
      lunch_time: "12.00pm to 12.30pm",
      shiftid: "D1",
      shifttype: "P",
      start: "7.00am",
      wkoffid: 5,
      wkoffid2: 2,
    },
  ];

  const functionalityList = {
    handleDragStart: true,
    handleDragEnter: true,
    handleDragOver: true,
    handleDragEnd: true,
    expandedCells: true,
    setExpandedCells: true,
    handleSortAsc: true,
    handleSortDesc: true,
    handleRenameColumn: true,
    dragActive: true,
    fieldEdit: false,
    draggedColumnIndex: true,
    dragOverColumnIndex: true,
    button: {
      save: false,
      submit: false,
    },
    paginationControls: true,
    entriesPerPageSelector: false,
    adduser: {
      label: "Add User",
      action: false,
      function: () => {},
    },
    actionDelete: {
      label: "Delete",
      action: false,
      function: (id: string) => {},
    },
    
    actionLink: {
      label: "link",
      action: false,
      function: (item: any) => {},
    },
    actionEdit: {
      label: "Edit",
      action: false,
      function: (id: string) => {},
    },
  };

  return (
    <div className="h-full ">
      <StatCardMain />
      <div className="p-4">
        {/* <Table data={data} functionalityList={functionalityList} /> */}
      </div>
    </div>
  );
}
