
import { MdModelTraining } from "react-icons/md";
import { GoOrganization } from "react-icons/go";
import { GrMapLocation } from "react-icons/gr";
import { RiOrganizationChart } from "react-icons/ri";
import { RiHomeOfficeLine } from "react-icons/ri";
import { PiBuildingOffice } from "react-icons/pi";
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
import { BsSignIntersectionY } from "react-icons/bs";
import { MdOutlineInventory } from "react-icons/md";
import { MdOutlineAttachMoney } from "react-icons/md";
import { MdOutlineDescription } from "react-icons/md";
import { MdOutlineEmojiEvents } from "react-icons/md";
import { MdOutlineTag } from "react-icons/md";
import { organization } from "./form-structure";
import { location } from "./location/form-structure";
import { subsidiary } from "./subsidiary/form-structure";

export const navorganization = [
    {
      title: "ORGANIZATION",
      items: [
        {
          title: "Organization",
          icon: <GoOrganization className="w-5 h-5" />,
          href: "/organization",
          badge: "SAVE",
          id:"68149dd330eb4a2911c9a6c4",
          from: organization
        },
        {
          title: "Location",
          icon: <GrMapLocation className="w-5 h-5" />,
          href: "/organization/location",
          id:"6815bfe48b84dd4e57ee025d",
          from: location
        },
        {
          title: "Subsidiary",
          icon: <RiOrganizationChart className="w-5 h-5" />,
          href: "/organization/subsidiary",
          id:"6815c1af8b84dd4e57ee025e",
          from: subsidiary
        },
        {
          title: "Division",
          icon: <RiHomeOfficeLine className="w-5 h-5" />,
          href: "/organization/division",
          id:"6815c34f8b84dd4e57ee0260",
          from: organization
        },
        {
          title: "Designation",
          icon: <PiBuildingOffice className="w-5 h-5" />,
          href: "/organization/designation",
          id:"6815c9ce8b84dd4e57ee0265",
          from: organization
        },
        {
          title: "Department",
          icon: <PiBuildingOffice className="w-5 h-5" />,
          href: "/organization/department",
          id:"6815c73d8b84dd4e57ee0261",
          from: organization
        },
        {
          title: "Sub Department",
          icon: <HiOutlineBuildingOffice2 className="w-5 h-5" />,
          href: "/organization/sub-department",
          id:"6815c8118b84dd4e57ee0262",
          from: organization
        },
        {
          title: "Section",
          icon: <BsSignIntersectionY className="w-5 h-5" />,
          href: "/organization/section",
          id:"6815c8c38b84dd4e57ee0264",
          from: organization
        },  
        {
          title: "Grade",
          icon: <HiOutlineBuildingOffice2 className="w-5 h-5" />,
          href: "/organization/grace",
          id:"6815cb058b84dd4e57ee0266",
          from: organization
        },
        {
          title: "Asset Master",
          icon: <MdOutlineInventory className="w-5 h-5" />,
          href: "/organization/asset-master",
          id:"6815cb058b84dd4e57ee0267",
          from: organization
        },
        {
          title: "Wage Period",
          icon: <MdOutlineAttachMoney className="w-5 h-5" />,
          href: "/organization/wage-period",
          id:"6815cb058b84dd4e57ee0268",
          from: organization
        },
        {
          title: "Document Master",
          icon: <MdOutlineDescription className="w-5 h-5" />,
          href: "/organization/document-master",
          id:"6815cb058b84dd4e57ee0269",
          from: organization
        },
        {
          title: "Skill Level",
          icon: <MdOutlineEmojiEvents className="w-5 h-5" />,
          href: "/organization/skill-levels",
          id:"6815cb058b84dd4e57ee026a",
          from: organization
        },
        {
          title: "Reason Code",
          icon: <MdOutlineTag className="w-5 h-5" />,
          href: "/organization/reason-codes",
          id:"6815cb058b84dd4e57ee026b",
          from: organization
        },
      ],
    }
  ];