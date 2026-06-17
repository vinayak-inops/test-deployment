"use client";
import React from "react";
import SubOrganizationPage from "./[...organization]/_components/sub-organization-page";

export default function Home() {
  const [formData, setFormData] = React.useState<any>(null);
  

  return (
    <div className="w-full overflow-y-auto">
        <SubOrganizationPage/>
      {/* <OrganizationPage /> */}
      {/* <LocationManagement/> */}
      {/* {formData !== null ? <DynamicForm department={formData} /> : null} */}
    </div>
  );
}
