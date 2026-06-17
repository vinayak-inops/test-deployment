"use client";

import React, { useCallback, useEffect, useState } from "react"
import LiveDataGraph from "./livedatagraph1";
import PresentAbsent from "../components/presentabsent";
import LiveDataGraphLocationWise from "../components/LiveDataGraphlocationwise";
import { SelectSearch, SelectSearchOption } from "@repo/ui/components/ui/select-search"
import { Button } from "@repo/ui/components/ui/button"
import { Card, CardContent } from "@repo/ui/components/ui/card"
import { useAuthToken } from "@repo/ui/hooks/auth/useAuthToken";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

import PresentAbsentLocationSelection from "./PresentAbsentlocationselection";
import { WorkOrderCards } from "./workordercards";
import { RefreshCw } from "lucide-react"; // Import refresh icon
import {useGetTenantCode} from '@/hooks/useGetTenantCode';
import { useEmpHierarchy } from '@/hooks/hierarchy/emp-hierarchy';


export default function WorkOrderGraph() {
    const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
    const graphqlUrl = `${apiBaseUrl}/graphql`;
    const [value, setValue] = useState("")
    const [selectedName, setSelectedName] = useState("");
    const [selectedNamediv, setSelectedNamediv] = useState("");
    const [selectedNamedept, setSelectedNamedept] = useState("");
    const [workOrders, setWorkOrders] = useState<SelectSearchOption[]>([]);
    const [selectedWorkOrder, setSelectedWorkOrder] = useState("");
    const [refreshKey, setRefreshKey] = useState(0); // Add refresh key for triggering data refresh
    const [isRefreshing, setIsRefreshing] = useState(false); // Add loading state
    const [uniqueSubsidiaries, setUniqueSubsidiaries] = useState<any[]>([]);
    const [uniqueDivisions, setUniqueDivisions] = useState<any[]>([]); // Add state for unique divisions
    const [uniqueDepartments, setUniqueDepartments] = useState<any[]>([]); // Add state for unique departments
    const [loadingLocations, setLoadingLocations] = useState(false);
    const [loadingWorkOrders, setLoadingWorkOrders] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const tenantCode = useGetTenantCode();
    const { hierarchyFilters } = useEmpHierarchy();

    const [formData, setFormData] = useState({
        category: "",
        name: "",
        email: "",
        location: "",
        message: "",
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Handle form submission here
    }

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    // Handle work order change and trigger refresh
    const handleWorkOrderChange = (workOrderCode: string) => {
        setIsRefreshing(true); // Show loading state
        setSelectedWorkOrder(workOrderCode);
        setRefreshKey(prev => prev + 1); // Increment refresh key to trigger data refresh
        // Reset other selections when work order changes
        setSelectedName("");
        setSelectedNamediv("");
        setSelectedNamedept("");
        setUniqueDivisions([]); // Reset divisions when work order changes
        setUniqueDepartments([]); // Reset departments when work order changes
        setError(null); // Clear any previous errors
        
        // Hide loading state after a short delay to allow components to refresh
        setTimeout(() => {
            setIsRefreshing(false);
        }, 1000);
    }

    // Manual refresh function
    const handleManualRefresh = () => {
        if (selectedWorkOrder) {
            setIsRefreshing(true);
            setError(null);
            setRefreshKey(prev => prev + 1);
            setTimeout(() => {
                setIsRefreshing(false);
            }, 1000);
        }
    }

    // Handle subsidiary selection and fetch divisions
    const handleSubsidiarySelection = (subsidiaryCode: string) => {
        setSelectedName(subsidiaryCode);
        setSelectedNamediv(""); // Reset division selection
        setSelectedNamedept(""); // Reset department selection
        setUniqueDepartments([]); // Reset departments when subsidiary changes
        setError(null); // Clear any previous errors
        // The useRequest hook will automatically refetch when dependencies change
    }

    // Handle division selection and fetch departments
    const handleDivisionSelection = (divisionCode: string) => {
        setSelectedNamediv(divisionCode);
        setSelectedNamedept(""); // Reset department selection
        setError(null); // Clear any previous errors
        // The useRequest hook will automatically refetch when dependencies change
    }

    const { token, loading: tokenLoading, error: tokenError } = useAuthToken();

    const validateToken = (authToken: string | null): boolean => {
        if (!authToken || authToken.trim() === "") {
            console.warn("Token is null, empty, or whitespace");
            return false;
        }
        return true;
    };

    const createHeaders = (authToken: string) => ({
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken.trim()}`,
        Accept: "application/json",
    });

    useEffect(() => {
        if (tokenLoading || !token) {
            return;
        }

        if (!tenantCode) {
            setError("Tenant code not available");
            return;
        }

        if (!validateToken(token)) {
            setError("Invalid authentication token");
            return;
        }

        setLoadingWorkOrders(true);
        setError(null);

        // Define the GraphQL query for work orders
        const query = `
    query FetchContractors {
    fetchContractors(
        collection: "contractor"
        criteriaRequests: [{ field: "organizationCode", operator: "is", value: "${tenantCode}" },{field: "tenantCode", operator: "is", value: "${tenantCode}" }]
    ) {
        contractorCode
        workOrders {
            workOrderNumber
            contractPeriodFrom
            contractPeriodTo
        }
    }
}
    `;

        // Send the request using fetch
      //  fetch('http://192.168.1.11:8000/graphql', { // Replace '/graphql' with your GraphQL API endpoint
        fetch(graphqlUrl, {
            method: 'POST',
            headers: createHeaders(token),
            mode: "cors",
            credentials: "include",
            body: JSON.stringify({ query })

        })

            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status} - ${res.statusText}`);
                }
                return res.json();
            })
            .then(data => {
                // Extract work orders from contractors response
                if (data?.data?.fetchContractors) {
                    // Filter contractors based on hierarchy filters
                    let filteredContractors = data.data.fetchContractors;
                        const hierarchyContractorCodes = hierarchyFilters.contractors;
                        filteredContractors = filteredContractors.filter((contractor: { contractorCode: string }) => 
                            hierarchyContractorCodes.includes(contractor.contractorCode)
                        );
                    
                    // Extract work orders from filtered contractors
                    const workOrderData: SelectSearchOption[] = filteredContractors.flatMap((contractor: { contractorCode: string, workOrders?: Array<{ workOrderNumber: string }> }) =>
                        (contractor.workOrders || []).map((workOrder: { workOrderNumber: string }) => ({
                            value: workOrder.workOrderNumber,
                            label: `${workOrder.workOrderNumber}`
                        }))
                    );
                    
                    // Remove duplicate work orders (in case same work order appears in multiple contractors)
                    const uniqueWorkOrders: SelectSearchOption[] = Array.from(
                        new Map(workOrderData.map((wo: SelectSearchOption) => [wo.value, wo])).values()
                    ) as SelectSearchOption[];
                    
                    setWorkOrders(uniqueWorkOrders);
                } else {
                    setError('No work order data found');
                }
            })
            .catch(error => {
                console.error('Error fetching work orders:', error);
                setError(`Failed to fetch work orders: ${error.message}`);
            })
            .finally(() => {
                setLoadingWorkOrders(false);
            });
    }, [token, tokenLoading, tenantCode, hierarchyFilters, graphqlUrl]);

    
     

  

    return (
        <div className="w-full">
            {/* Show loading state when token is loading */}
            {tokenLoading && (
                <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                    <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-blue-600 font-medium">Loading authentication...</span>
                    </div>
                </div>
            )}

            {/* Show error state if token error */}
            {tokenError && (
                <div className="flex items-center justify-center p-4 bg-red-50 rounded-lg border border-red-200 mb-4">
                    <span className="text-red-600 font-medium">Authentication error: {tokenError.message}</span>
                </div>
            )}

            {/* Show general error state */}
            {error && (
                <div className="flex items-center justify-center p-4 bg-red-50 rounded-lg border border-red-200 mb-4">
                    <span className="text-red-600 font-medium">{error}</span>
                </div>
            )}

            {/* Show content when auth bootstrap is done and there is no auth error */}
            {!tokenLoading && token && (
                <>
                    {loadingWorkOrders && (
                        <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                            <div className="flex items-center space-x-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                <span className="text-blue-600 font-medium">Loading work orders...</span>
                            </div>
                        </div>
                    )}
                    
                    <div className="flex items-center gap-2 mb-4">
                        <SelectSearch 
                            options={workOrders}
                            value={selectedWorkOrder}
                            onValueChange={handleWorkOrderChange}
                            placeholder={
                                tokenLoading ? "Loading..." : 
                                loadingWorkOrders ? "Loading work orders..." :     
                                "Select Work Order"
                            }
                            disabled={!token || tokenLoading || loadingWorkOrders}
                            className="w-48"
                            searchPlaceholder="Search work orders..."
                            emptyMessage="No work orders found."
                        />
                        
                        {selectedWorkOrder && (
                            <Button 
                                onClick={handleManualRefresh} 
                                disabled={isRefreshing || !token || tokenLoading || loadingWorkOrders}
                                variant="outline" 
                                size="sm"
                                className="flex items-center gap-2"
                            >
                                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        )}
                    </div>

                    {selectedWorkOrder && (
                        <>
                            {isRefreshing && (
                                <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                                    <div className="flex items-center space-x-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                        <span className="text-blue-600 font-medium">Refreshing data for {workOrders.find(workOrder => workOrder.value === selectedWorkOrder)?.label.split(' - ')[1]}...</span>
                                    </div>
                                </div>
                            )}

                            <WorkOrderCards 
                                selectedWorkOrder={selectedWorkOrder}
                            />
                        </>
                    )}
                </>
            )}
        </div>
    )


}
