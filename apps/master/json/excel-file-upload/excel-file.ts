export const excelSheets = [
    {
      name: "organization",
      label: "Organization",
      sheet: 1,
      columns: [
        [
          { name: "organization", label: "Organization", type: "string" },
          { name: "organizationId", label: "Organization ID", type: "string" },
          { name: "location", label: "Location", type: "string" },
          { name: "industry", label: "Industry", type: "string" },
          { name: "employeeCount", label: "Employee Count", type: "number" },
          { name: "foundedYear", label: "Founded Year", type: "number" },
          { name: "revenue", label: "Revenue (in Crores)", type: "number" },
          { name: "isActive", label: "Active Status", type: "boolean" }
        ]
      ]
    },
    {
      name: "region",
      label: "Region",
      sheet: 2,
      columns: [
        [
          { name: "region", label: "Region", type: "string" },
          { name: "regionId", label: "Region ID", type: "string" },
          { name: "headquarters", label: "Headquarters", type: "string" },
          { name: "country", label: "Country", type: "string" },
          { name: "isOperational", label: "Operational Status", type: "boolean" }
        ]
      ]
    },
    {
      name: "department",
      label: "Department",
      sheet: 3,
      columns: [
        [
          { name: "department", label: "Department", type: "string" },
          { name: "departmentId", label: "Department ID", type: "string" },
          { name: "organizationId", label: "Organization ID", type: "string" },
          { name: "regionId", label: "Region ID", type: "string" },
          { name: "headOfDepartment", label: "Head of Department", type: "string" },
          { name: "employeeCount", label: "Employee Count", type: "number" }
        ]
      ]
    },
    {
      name: "subdepartment",
      label: "SubDepartment",
      sheet: 4,
      columns: [
        [
          { name: "subdepartment", label: "SubDepartment", type: "string" },
          { name: "subdepartmentId", label: "SubDepartment ID", type: "string" },
          { name: "departmentId", label: "Department ID", type: "string" },
          { name: "manager", label: "Manager", type: "string" },
          { name: "teamSize", label: "Team Size", type: "number" },
          { name: "budget", label: "Annual Budget (in Lakhs)", type: "number" },
          { name: "isRemote", label: "Remote Enabled", type: "boolean" }
        ]
      ]
    }
  ];
  