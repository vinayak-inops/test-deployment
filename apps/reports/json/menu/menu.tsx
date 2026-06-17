import { LuLayoutDashboard, LuUsers, LuCalendarClock, LuClipboardList, LuFileText, LuCreditCard, LuSettings, LuUpload, LuWorkflow, LuChevronRight, LuHeart, LuPlus, LuLink, LuPackagePlus } from "react-icons/lu";
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
import { MdOutlineHistory } from "react-icons/md";
import { TbReportAnalytics } from "react-icons/tb";
import { FaRegUser } from "react-icons/fa";

export const navigation = [
  {
    title: "",
    mainmenu: false,
    items: [
      {
        title: "Dashboard",
        icon: LuLayoutDashboard({ className: "w-5 h-5" }),
        href: "/dashboard",
      },
    ],
  },
  {
    title: "REPORTS",
    mainmenu: true,
    items: [
      {
        title: "Contractor Employee",
        icon: HiOutlineBuildingOffice2({ className: "w-5 h-5" }),
        href: "/contractor-employee",
      },
      {
        title: "Shift",
        icon: LuCalendarClock({ className: "w-5 h-5" }),
        href: "/shift",
      },
      {
        title: "Attendance",
        icon: TbReportAnalytics({ className: "w-5 h-5" }),
        href: "/attendance",
      },
      {
        title: "Leave",
        icon: MdOutlineHistory({ className: "w-5 h-5" }),
        href: "/leave",
      },
      {
        title: "Application",
        icon: LuFileText({ className: "w-5 h-5" }),
        href: "/application",
      },
      {
        title: "Salary",
        icon: LuCreditCard({ className: "w-5 h-5" }),
        href: "/salary",
      },
      {
        title: "Other",
        icon: LuSettings({ className: "w-5 h-5" }),
        href: "/other",
      },
    ],
  },
  {
    title: "",
    mainmenu: false,
    items: [
      {
        title: "Master",
        icon: FaRegUser({ className: "w-5 h-5" }),
        lasticon: LuLink({ className: "w-4 h-4" }),
        href: "/master",
      },
      {
        title: "Excel Upload",
        icon: LuUpload({ className: "w-5 h-5" }),
        lasticon: LuLink({ className: "w-4 h-4" }),
        href: "/excel-upload",
      },
      {
        title: "Work Flow",
        icon: LuWorkflow({ className: "w-5 h-5" }),
        lasticon: LuLink({ className: "w-4 h-4" }),
        href: "/work-flow",
      },
    ],
  },
];

export const navItems = [
  {
    label: "Reports",
    link: "/reports",
    page:"reportsGenerate"
  }
];
