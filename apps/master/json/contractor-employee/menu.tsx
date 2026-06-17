import { LuFileUser } from "react-icons/lu";
import { VscOrganization } from "react-icons/vsc";
import { MdOutlinePolicy } from "react-icons/md";
import { MdOutlineCastForEducation } from "react-icons/md";
import { MdOutlineMiscellaneousServices } from "react-icons/md";
import { MdModelTraining } from "react-icons/md";
import { RiOrganizationChart } from "react-icons/ri";
import { GrMapLocation } from "react-icons/gr";

export const navContractorEmployee = [
  {
    title: "CONTRACTOR EMPLOYEE",
    items: [
      {
        title: "Contractor Employee",
        icon: <LuFileUser className="w-5 h-5" />,
        href: "/contractor-employee",
      },
      {
        title: "Contractor",
        icon: <VscOrganization className="w-5 h-5" />,
        href: "/contractor-employee/contractor",
      },
      {
        title: "Company Employee",
        icon: <LuFileUser className="w-5 h-5" />,
        href: "/contractor-employee/company-employee",
      },
      {
        title: "Category",
        icon: <MdOutlinePolicy className="w-5 h-5" />,
        href: "/contractor-employee/category",
      },
      {
        title: "Assign Role",
        icon: <MdOutlineCastForEducation className="w-5 h-5" />,
        href: "/contractor-employee/assign-role",
      },
      {
        title: "Grade",
        icon: <MdOutlineMiscellaneousServices className="w-5 h-5" />,
        href: "/contractor-employee/grade",
      },
      {
        title: "Designation",
        icon: <MdModelTraining className="w-5 h-5" />,
        href: "/contractor-employee/designation",
      },
      {
        title: "Week Off Allocation",
        icon: <RiOrganizationChart className="w-5 h-5" />,
        href: "/contractor-employee/week-off-allocation",
      },
      {
        title: "Employee Shift",
        icon: <GrMapLocation className="w-5 h-5" />,
        href: "/contractor-employee/employee-shift",
      },
      {
        title: "Area Of Work",
        icon: <MdOutlineMiscellaneousServices className="w-5 h-5" />,
        href: "/contractor-employee/area-of-work",
      },
      {
        title: "Work Skill",
        icon: <MdModelTraining className="w-5 h-5" />,
        href: "/contractor-employee/work-skill",
      },
      {
        title: "Nature Of Work",
        icon: <MdOutlinePolicy className="w-5 h-5" />,
        href: "/contractor-employee/nature-of-work",
      },
      {
        title: "Salary Allocation Bulk",
        icon: <MdOutlineMiscellaneousServices className="w-5 h-5" />,
        href: "/contractor-employee/salary-allocation-bulk",
      },
      {
        title: "Salary Process",
        icon: <MdOutlineCastForEducation className="w-5 h-5" />,
        href: "/contractor-employee/salary-process",
      },
      {
        title: "Manual Attendance",
        icon: <LuFileUser className="w-5 h-5" />,
        href: "/contractor-employee/manual-attendance",
      },
      {
        title: "Mass Contractor Employee Upload",
        icon: <VscOrganization className="w-5 h-5" />,
        href: "/contractor-employee/mass-upload",
      },
      {
        title: "Assign Auto Shift",
        icon: <GrMapLocation className="w-5 h-5" />,
        href: "/contractor-employee/assign-auto-shift",
      },
      {
        title: "Attendance Approval",
        icon: <MdOutlinePolicy className="w-5 h-5" />,
        href: "/contractor-employee/attendance-approval",
      },
      {
        title: "Over Time Rate Detail",
        icon: <MdModelTraining className="w-5 h-5" />,
        href: "/contractor-employee/over-time-rate-detail",
      },
    ],
  },
];
