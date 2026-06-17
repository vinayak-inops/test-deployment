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
import { ContractorCards } from "./contractorcards";
import { RefreshCw } from "lucide-react"; // Import refresh icon
import { useGetTenantCode } from '@/hooks/useGetTenantCode';
import { useEmpHierarchy } from '@/hooks/hierarchy/emp-hierarchy';


export default function ContractorWiseGraph() {
    const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");
    const graphqlUrl = `${apiBaseUrl}/graphql`;
    const [value, setValue] = useState("")
    const [selectedName, setSelectedName] = useState("");
    const [selectedNamediv, setSelectedNamediv] = useState("");
    const [selectedNamedept, setSelectedNamedept] = useState("");
    const [contractors, setContractors] = useState<SelectSearchOption[]>([]);
    const [selectedContractor, setSelectedContractor] = useState("");
    const [refreshKey, setRefreshKey] = useState(0); // Add refresh key for triggering data refresh
    const [isRefreshing, setIsRefreshing] = useState(false); // Add loading state
    const [uniqueSubsidiaries, setUniqueSubsidiaries] = useState<any[]>([]);
    const [uniqueDivisions, setUniqueDivisions] = useState<any[]>([]); // Add state for unique divisions
    const [uniqueDepartments, setUniqueDepartments] = useState<any[]>([]); // Add state for unique departments
    const [loadingLocations, setLoadingLocations] = useState(false);
    const [loadingContractors, setLoadingContractors] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const namesdiv = ["div1", "div2", "div3", "div4", "div5"];
    const namesdept = ["dept1", "dept2", "dept3", "dept4", "dept5"];
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

    // Handle location change and trigger refresh
    const handleLocationChange = (contractorCode: string) => {
        setIsRefreshing(true); // Show loading state
        setSelectedContractor(contractorCode);
        setRefreshKey(prev => prev + 1); // Increment refresh key to trigger data refresh
        // Reset other selections when location changes
        setSelectedName("");
        setSelectedNamediv("");
        setSelectedNamedept("");
        setUniqueDivisions([]); // Reset divisions when location changes
        setUniqueDepartments([]); // Reset departments when location changes
        setError(null); // Clear any previous errors
        
        // Hide loading state after a short delay to allow components to refresh
        setTimeout(() => {
            setIsRefreshing(false);
        }, 1000);
    }

    // Manual refresh function
    const handleManualRefresh = () => {
        if (selectedContractor) {
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

        setLoadingContractors(true);
        setError(null);

        // Define the GraphQL query for contractors
        const query = `
    query FetchContractors {
    fetchContractors(
        collection: "contractor"
        criteriaRequests: { operator: "eq", field: "tenantCode", value: "${tenantCode}" }
    ) {
        contractorCode
        contractorName
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
                // Extract the contractor codes and names from the data
                if (data?.data?.fetchContractors) {
                    let contractorData = data.data.fetchContractors.map((contractor: { contractorCode: string, contractorName: string }) => ({
                        value: contractor.contractorCode,
                        label: `${contractor.contractorCode} - ${contractor.contractorName}`
                    }));
                    
                    // Filter contractors based on hierarchy filters
                        const hierarchyContractorCodes = hierarchyFilters.contractors;
                        contractorData = contractorData.filter((contractor: SelectSearchOption) => 
                            hierarchyContractorCodes.includes(contractor.value)
                        );
                    
                    setContractors(contractorData);
                } else {
                    setError('No contractor data found');
                }
            })
            .catch(error => {
                console.error('Error fetching contractors:', error);
                setError(`Failed to fetch contractors: ${error.message}`);
            })
            .finally(() => {
                setLoadingContractors(false);
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
                    {loadingContractors && (
                        <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                            <div className="flex items-center space-x-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                <span className="text-blue-600 font-medium">Loading contractors...</span>
                            </div>
                        </div>
                    )}
                    
                    <div className="flex items-center gap-2 mb-4">
                        <SelectSearch 
                            options={contractors}
                            value={selectedContractor}
                            onValueChange={handleLocationChange}
                            placeholder={
                                tokenLoading ? "Loading..." : 
                                loadingContractors ? "Loading contractors..." :     
                                "Select Contractor"
                            }
                            disabled={!token || tokenLoading || loadingContractors}
                            className="w-48"
                            searchPlaceholder="Search contractors..."
                            emptyMessage="No contractors found."
                        />
                        
                        {selectedContractor && (
                            <Button 
                                onClick={handleManualRefresh} 
                                disabled={isRefreshing || !token || tokenLoading || loadingContractors}
                                variant="outline" 
                                size="sm"
                                className="flex items-center gap-2"
                            >
                                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        )}
                    </div>

                    {selectedContractor && (
                        <>
                            {isRefreshing && (
                                <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                                    <div className="flex items-center space-x-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                        <span className="text-blue-600 font-medium">Refreshing data for {contractors.find(contractor => contractor.value === selectedContractor)?.label.split(' - ')[1]}...</span>
                                    </div>
                                </div>
                            )}

                            <ContractorCards 
                                selectedContractor={selectedContractor}
                            />
                        </>
                    )}
                </>
            )}
        </div>
    )


}
