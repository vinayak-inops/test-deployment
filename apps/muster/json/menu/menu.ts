import { Timer } from "lucide-react";

export const menu = [
  // {
  //   label: "Over Time",
  //   link: "/over-time",
  //   dropdown: "Over Time",
  //   items: [
  //     {
  //       icon: "Timer", label: "OT Application",
  //       link: "/over-time/ot-application"
  //     },
  //   ]
  // },
  {
    label: "Punch",
    link: "/punch",
    page: "muster-punch"
  },
  {
    label: "Muster",
    link: "/punch/muster-punch",
    page: "muster-punch"
  },
  {
    label: "Raw Punch",
    link: "/punch/individual-punch",
    page: "individual-punch"
  },
  {
    label: "Punch Application",
    link: "/punch/punch-application",
    page: "punch-application"
  },
  {
    label: "Suspected Punches",
    link: "/punch/suspectedPunches",
    page: "suspectedPunches"
  },
  {
    label: "Added Punches",
    link: "/punch/added-punch",
    page: "added-punch"
  },
  {
    label: "Edit Punch Application",
    link: "/punch/edit-punch-application",
    page: "edit-punch-application"
  }
];
