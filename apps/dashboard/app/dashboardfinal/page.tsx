"use client";


import dynamic from "next/dynamic";
import { Cards } from "./components/cards";
import DepartmentWiseGraph from "./components/departmentwisegraph";
import ContractorWiseGraph from "./components/contractorwisegraph";
import WorkOrderGraph from "./components/workordergraph";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { useAdminRole } from "@inops/store/src/hooks/useAdminRole";
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray";

const MyComponent = dynamic(() => import('./components/livedatagraph'), { ssr: false })

export default function DashboardPage() {
    const [totalCount, setTotalCount] = useState<boolean>(false);
    const [workOrderCount, setWorkOrderCount] = useState<boolean>(false);
    const [departmentCount, setDepartmentCount] = useState<boolean>(false);
    const [contractorCount, setContractorCount] = useState<boolean>(false);

    const contractorEmployee = "liveDashboard"

    // If muster not allowed, softly redirect to launchdesk (adminRole still available if needed)
    const { adminRole } = useAdminRole();


    // Use shared role-permissions hook to derive screen permissions
    const { responseData: rolePerms, loading, error } = useRolePermissions({
        serviceName: "dashboard",
        screenName: contractorEmployee,
    });

    useEffect(() => {
        if (!rolePerms) {
            setTotalCount(false);
            setWorkOrderCount(false);
            setDepartmentCount(false);
            setContractorCount(false);
            return;
        }
        setTotalCount(Boolean((rolePerms as any)?.totalCount));
        setWorkOrderCount(Boolean((rolePerms as any)?.workOrderCount));
        setDepartmentCount(Boolean((rolePerms as any)?.departmentCount));
        setContractorCount(Boolean((rolePerms as any)?.contractorCount));
    }, [rolePerms]);
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            {
                totalCount && (
                    <Cards />
                )
            }
           {/* <MyComponent /> */}
            
            <div className="max-w-7xl mx-auto px-6 pb-6">
                <div className="mb-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                        Live Data Analytics
                    </h2>
                    <p className="text-gray-600">
                        Monitor department, contractor, and work order performance metrics
                    </p>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border p-4">
                    <Tabs defaultValue="department" className="w-full">
                        <TabsList className="h-auto mb-4">
                            {
                                departmentCount && (
                                    <TabsTrigger value="department" className="text-left justify-start">
                                        Department Live Data
                                    </TabsTrigger>
                                )
                            }
                            {
                                contractorCount && (
                                    <TabsTrigger value="contractor" className="text-left justify-start">
                                        Contractor Live Data
                                    </TabsTrigger>
                                )
                            }
                            {
                                workOrderCount && (
                                    <TabsTrigger value="workorder" className="text-left justify-start">
                                        Work Order Live Data
                                    </TabsTrigger>
                                )
                            }
                        </TabsList>
                        
                        {
                            departmentCount && (
                                <TabsContent value="department">
                                    <DepartmentWiseGraph />
                                </TabsContent>
                            )
                        }
                        
                        {
                            contractorCount && (
                                <TabsContent value="contractor">
                                    <ContractorWiseGraph />
                                </TabsContent>
                            )
                        }
                        
                        {
                            workOrderCount && (
                                <TabsContent value="workorder">
                                    <WorkOrderGraph />
                                </TabsContent>
                            )
                        }
                    </Tabs>
                </div>
            </div>
        </div>
    )
}

