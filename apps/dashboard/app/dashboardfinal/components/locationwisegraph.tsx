"use client";

import React, { useCallback, useEffect, useState } from "react"
import LiveDataGraph from "./livedatagraph1";
import PresentAbsent from "../components/presentabsent";
import LiveDataGraphLocationWise from "../components/LiveDataGraphlocationwise";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Button } from "@repo/ui/components/ui/button"
import { Card, CardContent } from "@repo/ui/components/ui/card"
import { useAuthToken } from "@repo/ui/hooks/auth/useAuthToken";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useGetTenantCode } from '@/hooks/useGetTenantCode';
import PresentAbsentLocationSelection from "./PresentAbsentlocationselection";
import { RefreshCw } from "lucide-react"; // Import refresh icon
import { useEmpHierarchy } from '@/hooks/hierarchy/emp-hierarchy';
import { useKeyclockRoleInfo } from '@/hooks/search/keyclock-role-info';
import { useUserEntitlement } from '@/hooks/hierarchy/useUserEntitlement';
import useCurrentDomain from "@/hooks/api/useCurrentDomain";


export default function LocationWiseGraph() {
  const NEXT_PUBLIC_NEXTAUTH_URL= useCurrentDomain()
    const secureBase = (NEXT_PUBLIC_NEXTAUTH_URL || "").replace(/\/+$/, "");
    const graphqlUrl = secureBase ? `${secureBase}/api/secure/graphql` : "/api/secure/graphql";
    const [value, setValue] = useState("")
    const [selectedName, setSelectedName] = useState("");
    const [selectedNamediv, setSelectedNamediv] = useState("");
    const [selectedNamedept, setSelectedNamedept] = useState("");
    const [locations, setLocations] = useState<Array<{code: string, name: string}>>([]);
    const [selectedLocation, setSelectedLocation] = useState("");
    const [refreshKey, setRefreshKey] = useState(0); // Add refresh key for triggering data refresh
    const [isRefreshing, setIsRefreshing] = useState(false); // Add loading state
    const [uniqueSubsidiaries, setUniqueSubsidiaries] = useState<any[]>([]);
    const [uniqueDivisions, setUniqueDivisions] = useState<any[]>([]); // Add state for unique divisions
    const [uniqueDepartments, setUniqueDepartments] = useState<any[]>([]); // Add state for unique departments
    const [loadingLocations, setLoadingLocations] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const namesdiv = ["div1", "div2", "div3", "div4", "div5"];
    const namesdept = ["dept1", "dept2", "dept3", "dept4", "dept5"];
    const tenantCode = useGetTenantCode();
    const { employeeIds, employeesLite, loading: hLoading, error: hError, hierarchyFilters } = useEmpHierarchy()
    const { employeeId: loginEmployeeId } = useKeyclockRoleInfo()
    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0];

    const [formData, setFormData] = useState({
        category: "",
        name: "",
        email: "",
        location: "",
        message: "",
    })

    // Centralized user entitlement using shared hook (aligned with other dashboard components)
    const userEntitlement = useUserEntitlement(loginEmployeeId, hierarchyFilters)

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
    const handleLocationChange = (locationCode: string) => {
        setIsRefreshing(true); // Show loading state
        setSelectedLocation(locationCode);
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
        if (selectedLocation) {
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

    const { loading: tokenLoading, error: tokenError } = useAuthToken();

    useEffect(() => {
        // Wait for auth bootstrap and stop on auth errors
        if (tokenLoading || tokenError) {
            return;
        }

        setLoadingLocations(true);
        setError(null);

        // Define the GraphQL query
        const query = `
    query GetOrganizationByCode {
    getOrganizationByCode(
        collection: "organization"
        organizationCode: ${tenantCode}
        tenantCode: ${tenantCode}
    ) {
        location {
            locationCode
            locationName
        }
    }
}

    `;

        // Send the request using fetch
      //  fetch('http://192.168.1.11:8000/graphql', { // Replace '/graphql' with your GraphQL API endpoint
        fetch(graphqlUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
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
                // Extract the location codes and names from the data
                if (data?.data?.getOrganizationByCode?.location) {
                    let locationData = data.data.getOrganizationByCode.location.map((loc: { locationCode: string, locationName: string }) => ({
                        code: loc.locationCode,
                        name: loc.locationName
                    }));
                    
                    // Filter locations based on hierarchy filters
                    if (hierarchyFilters?.locations && hierarchyFilters.locations.length > 0) {
                        const hierarchyLocationCodes = hierarchyFilters.locations;
                        locationData = locationData.filter((location: { code: string, name: string }) => 
                            hierarchyLocationCodes.includes(location.code)
                        );
                    }
                    
                    setLocations(locationData);
                } else {
                    setError('No location data found');
                }
            })
            .catch(error => {
                console.error('Error fetching locations:', error);
                setError(`Failed to fetch locations: ${error.message}`);
            })
            .finally(() => {
                setLoadingLocations(false);
            });
    }, [tokenLoading, tokenError, tenantCode, hierarchyFilters, graphqlUrl]);

    
      const subsidiariesApi: any = {
        hierarchyFilters: {
          ...(hierarchyFilters?.subsidiaries && hierarchyFilters.subsidiaries.length > 0 && { subsidiary: hierarchyFilters.subsidiaries }),
          ...(hierarchyFilters?.divisions && hierarchyFilters.divisions.length > 0 && { division: hierarchyFilters.divisions }),
          ...(hierarchyFilters?.departments && hierarchyFilters.departments.length > 0 && { department: hierarchyFilters.departments }),
          ...(hierarchyFilters?.contractors && hierarchyFilters.contractors.length > 0 && { contractor: hierarchyFilters.contractors }),
          ...(hierarchyFilters?.locations && hierarchyFilters.locations.length > 0 && { location: hierarchyFilters.locations }),
        },
        criteriaRequests: [
          {
            "field": "attendanceDate",
            "operator": "eq",
            "value": formattedToday
          },
          {
            "field": "tenantCode",
            "operator": "eq",
            "value": tenantCode
          },
          {
            "field": "deployment.location.locationCode",
            "operator": "eq",
            "value": selectedLocation
          }
        ],
        userEntitlement: userEntitlement,
      }

      // Subsidiaries data using useRequest hook
      const {
          data: subsidiariesData,
          loading: loadingSubsidiaries,
          error: subsidiariesError,
          refetch: fetchSubsidiariesData
      } = useRequest<any[]>({
          url: 'muster/liveAttendance/searchWithHierarchy',
          method: 'POST',
          data: subsidiariesApi,
          onSuccess: (result) => {
              // Process the result to extract unique subsidiaries
              if (result && Array.isArray(result)) {
                  const seen = new Set();
                  const unique = result
                      .map((entry: any) => entry.deployment?.subsidiary)
                      .filter((sub: any) => {
                          if (!sub) return false;
                          const key = sub.subsidiaryCode;
                          return seen.has(key) ? false : seen.add(key);
                      });
                  setUniqueSubsidiaries(unique);
              }
          },
          onError: (error) => {
              console.error('Error fetching subsidiaries data:', error);
              setError(`Failed to fetch subsidiaries: ${error.message}`);
          },
          dependencies: [selectedLocation, formattedToday, tenantCode, hierarchyFilters]
      });

    const divisionsApi: any = {
      hierarchyFilters: {
        ...(hierarchyFilters?.subsidiaries && hierarchyFilters.subsidiaries.length > 0 && { subsidiary: hierarchyFilters.subsidiaries }),
        ...(hierarchyFilters?.divisions && hierarchyFilters.divisions.length > 0 && { division: hierarchyFilters.divisions }),
        ...(hierarchyFilters?.departments && hierarchyFilters.departments.length > 0 && { department: hierarchyFilters.departments }),
        ...(hierarchyFilters?.contractors && hierarchyFilters.contractors.length > 0 && { contractor: hierarchyFilters.contractors }),
        ...(hierarchyFilters?.locations && hierarchyFilters.locations.length > 0 && { location: hierarchyFilters.locations }),
      },
      criteriaRequests: [
        {
          "field": "attendanceDate",
          "operator": "eq",
          "value": formattedToday
        },
        {
          "field": "deployment.location.locationCode",
          "operator": "eq",
          "value": selectedLocation
        },
        {
          "field": "deployment.subsidiary.subsidiaryCode",
          "operator": "eq",
          "value": selectedName
        },
        {
          "field": "tenantCode",
          "operator": "eq",
          "value": tenantCode
        }
      ],
      userEntitlement: userEntitlement,
    }

    // Divisions data using useRequest hook
    const {
        data: divisionsData,
        loading: loadingDivisions,
        error: divisionsError,
        refetch: fetchDivisionsData
    } = useRequest<any[]>({
        url: 'muster/liveAttendance/searchWithHierarchy',
        method: 'POST',
        data: divisionsApi,
        onSuccess: (result) => {
            // Process the result to extract unique divisions
            if (result && Array.isArray(result)) {
                const seen = new Set();
                const unique = result
                    .map((entry: any) => entry.deployment?.division)
                    .filter((div: any) => {
                        if (!div) return false;
                        const key = div.divisionCode;
                        return seen.has(key) ? false : seen.add(key);
                    });
                setUniqueDivisions(unique);
            }
        },
        onError: (error) => {
            console.error('Error fetching divisions data:', error);
            setError(`Failed to fetch divisions: ${error.message}`);
        },
        dependencies: [selectedLocation, selectedName, formattedToday, tenantCode, hierarchyFilters]
    });

    const departmentsApi: any = {
      hierarchyFilters: {
        ...(hierarchyFilters?.subsidiaries && hierarchyFilters.subsidiaries.length > 0 && { subsidiary: hierarchyFilters.subsidiaries }),
        ...(hierarchyFilters?.divisions && hierarchyFilters.divisions.length > 0 && { division: hierarchyFilters.divisions }),
        ...(hierarchyFilters?.departments && hierarchyFilters.departments.length > 0 && { department: hierarchyFilters.departments }),
        ...(hierarchyFilters?.contractors && hierarchyFilters.contractors.length > 0 && { contractor: hierarchyFilters.contractors }),
        ...(hierarchyFilters?.locations && hierarchyFilters.locations.length > 0 && { location: hierarchyFilters.locations }),
      },
      criteriaRequests: [
        {
          "field": "attendanceDate",
          "operator": "eq",
          "value": formattedToday
        },
        {
          "field": "deployment.location.locationCode",
          "operator": "eq",
          "value": selectedLocation
        },
        {
          "field": "deployment.subsidiary.subsidiaryCode",
          "operator": "eq",
          "value": selectedName
        },
        {
          "field": "deployment.division.divisionCode",
          "operator": "eq",
          "value": selectedNamediv
        }
      ],
      userEntitlement: userEntitlement,
    }

    // Departments data using useRequest hook
    const {
        data: departmentsData,
        loading: loadingDepartments,
        error: departmentsError,
        refetch: fetchDepartmentsData
    } = useRequest<any[]>({
        url: 'muster/liveAttendance/searchWithHierarchy',
        method: 'POST',
        data: departmentsApi,
        onSuccess: (result) => {
            // Process the result to extract unique departments
            if (result && Array.isArray(result)) {
                const seen = new Set();
                const unique = result
                    .map((entry: any) => entry.deployment?.department)
                    .filter((dept: any) => {
                        if (!dept) return false;
                        const key = dept.departmentCode;
                        return seen.has(key) ? false : seen.add(key);
                    });
                setUniqueDepartments(unique);
            }
        },
        onError: (error) => {
            console.error('Error fetching departments data:', error);
            setError(`Failed to fetch departments: ${error.message}`);
        },
        dependencies: [selectedLocation, selectedName, selectedNamediv, formattedToday, tenantCode, hierarchyFilters]
    });

    // Call fetchSubsidiariesData when selectedLocation changes
    useEffect(() => {
        if (selectedLocation && !tokenLoading && !tokenError) {
            fetchSubsidiariesData();
        }
    }, [selectedLocation, fetchSubsidiariesData, tokenLoading, tokenError]);

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <main className="flex flex-1 flex-col gap-2 p-0 md:gap-4 md:p-4">

                {/* Show loading state when token is loading */}
                {tokenLoading && (
                    <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span className="text-blue-600 font-medium">Loading authentication...</span>
                        </div>
                    </div>
                )}

                {/* Show error state if token error */}
                {tokenError && (
                    <div className="flex items-center justify-center p-4 bg-red-50 rounded-lg border border-red-200">
                        <span className="text-red-600 font-medium">Authentication error: {tokenError.message}</span>
                    </div>
                )}

                {/* Show general error state */}
                {error && (
                    <div className="flex items-center justify-center p-4 bg-red-50 rounded-lg border border-red-200">
                        <span className="text-red-600 font-medium">{error}</span>
                    </div>
                )}

                {/* Show content when auth bootstrap is done and there is no auth error */}
                {!tokenLoading && !tokenError && (
                    <>
                        {loadingLocations && (
                            <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center space-x-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    <span className="text-blue-600 font-medium">Loading locations...</span>
                                </div>
                            </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                            <Select onValueChange={handleLocationChange} disabled={tokenLoading || loadingLocations}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder={
                                        tokenLoading ? "Loading..." : 
                                        loadingLocations ? "Loading locations..." : 
                                        "Select Location"
                                    } />
                                </SelectTrigger>
                                <SelectContent>
                                    {locations.map((location, index) => (
                                        <SelectItem key={index} value={location.code}>{location.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            
                            {selectedLocation && (
                                <Button 
                                    onClick={handleManualRefresh} 
                                    disabled={isRefreshing || tokenLoading || loadingSubsidiaries || loadingDivisions || loadingDepartments}
                                    variant="outline" 
                                    size="sm"
                                    className="flex items-center gap-2"
                                >
                                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                    Refresh
                                </Button>
                            )}
                        </div>

                {selectedLocation && (
                    <>
                        {isRefreshing && (
                            <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center space-x-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    <span className="text-blue-600 font-medium">Refreshing data for {locations.find(loc => loc.code === selectedLocation)?.name}...</span>
                                </div>
                            </div>
                        )}

                        <PresentAbsentLocationSelection 
                            name={selectedLocation} 
                            hierarchyLevel="location"
                            key={`present-${refreshKey}`} 
                        />

                        <div className="flex flex-col items-center">
                            {loadingSubsidiaries ? (
                                <div className="flex items-center justify-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                    <div className="flex items-center space-x-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                                        <span className="text-yellow-600 font-medium">Loading subsidiaries...</span>
                                    </div>
                                </div>
                            ) : uniqueSubsidiaries.length > 0 ? (
                                <>
                                    <div className="relative w-full max-w-xs">
                                        <Carousel 
                                            opts={{
                                                align: "start",
                                                loop: false,
                                            }}
                                            className="w-full"
                                        >
                                            <CarouselContent className="-ml-1">
                                                {uniqueSubsidiaries.map((subsidiary, index) => (
                                                    <CarouselItem key={index} className="pl-1 md:basis-1/2 lg:basis-1/3">
                                                        <div className="p-1">
                                                            <button
                                                                onClick={() => handleSubsidiarySelection(subsidiary.subsidiaryCode)}
                                                                className="w-full text-left rounded-xl shadow hover:shadow-lg transition"
                                                            >
                                                                <Card>
                                                                    <CardContent className="flex aspect-square items-center justify-center p-4">
                                                                        <span className="text-sm font-semibold text-center leading-tight">{subsidiary.subsidiaryName || subsidiary.subsidiaryCode}</span>
                                                                    </CardContent>
                                                                </Card>
                                                            </button>
                                                        </div>
                                                    </CarouselItem>
                                                ))}
                                            </CarouselContent>
                                            <CarouselPrevious />
                                            <CarouselNext />
                                        </Carousel>
                                    </div>
                                    {selectedName && (
                                        <>
                                            <div className="mt-6 w-full">
                                                <PresentAbsentLocationSelection 
                                                    name={selectedName} 
                                                    hierarchyLevel="subsidiary"
                                                    parentLocation={selectedLocation}
                                                    key={`present-subsidiary-${refreshKey}`} 
                                                />
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : (
                                <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg border border-gray-200">
                                    <span className="text-gray-500">No subsidiaries found for this location</span>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {selectedName && (loadingDivisions ? (
                    <div className="flex items-center justify-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                            <span className="text-yellow-600 font-medium">Loading divisions...</span>
                        </div>
                    </div>
                ) : uniqueDivisions.length > 0) && (
                    <div className="flex flex-col items-center">
                        <div className="relative w-full max-w-xs">
                            <Carousel 
                                opts={{
                                    align: "start",
                                    loop: false,
                                }}
                                className="w-full"
                            >
                                <CarouselContent className="-ml-1">
                                    {uniqueDivisions.map((division, index) => (
                                        <CarouselItem key={index} className="pl-1 md:basis-1/2 lg:basis-1/3">
                                            <div className="p-1">
                                                <button
                                                    onClick={() => handleDivisionSelection(division.divisionCode)}
                                                    className="w-full text-left rounded-xl shadow hover:shadow-lg transition"
                                                >
                                                    <Card>
                                                        <CardContent className="flex aspect-square items-center justify-center p-4">
                                                            <span className="text-sm font-semibold text-center leading-tight">{division.divisionName || division.divisionCode}</span>
                                                        </CardContent>
                                                    </Card>
                                                </button>
                                            </div>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                <CarouselPrevious />
                                <CarouselNext />
                            </Carousel>
                        </div>
                        {selectedNamediv && (
                            <>
                                <div className="mt-6 w-full">
                                    <PresentAbsentLocationSelection 
                                        name={selectedNamediv} 
                                        hierarchyLevel="division"
                                        parentLocation={selectedLocation}
                                        parentSubsidiary={selectedName}
                                        key={`present-division-${refreshKey}`} 
                                    />
                                </div>
                            </>
                        )}
                    </div>
                )}

                {selectedNamediv && (
                    <div className="flex flex-col items-center">
                        {loadingDepartments ? (
                            <div className="flex items-center justify-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                <div className="flex items-center space-x-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                                    <span className="text-yellow-600 font-medium">Loading departments...</span>
                                </div>
                            </div>
                        ) : uniqueDepartments.length > 0 ? (
                            <>
                                <div className="relative w-full max-w-xs">
                                    <Carousel 
                                        opts={{
                                            align: "start",
                                            loop: false,
                                        }}
                                        className="w-full"
                                    >
                                        <CarouselContent className="-ml-1">
                                            {uniqueDepartments.map((department, index) => (
                                                <CarouselItem key={index} className="pl-1 md:basis-1/2 lg:basis-1/3">
                                                    <div className="p-1">
                                                        <button
                                                            onClick={() => setSelectedNamedept(department.departmentCode)}
                                                            className="w-full text-left rounded-xl shadow hover:shadow-lg transition"
                                                        >
                                                            <Card>
                                                                <CardContent className="flex aspect-square items-center justify-center p-4">
                                                                    <span className="text-sm font-semibold text-center leading-tight">{department.departmentName || department.departmentCode}</span>
                                                                </CardContent>
                                                            </Card>
                                                        </button>
                                                    </div>
                                                </CarouselItem>
                                            ))}
                                        </CarouselContent>
                                        <CarouselPrevious />
                                        <CarouselNext />
                                    </Carousel>
                                </div>
                                {selectedNamedept && (
                                    <>
                                        <div className="mt-6 w-full">
                                            <PresentAbsentLocationSelection 
                                                name={selectedNamedept} 
                                                hierarchyLevel="department"
                                                parentLocation={selectedLocation}
                                                parentSubsidiary={selectedName}
                                                parentDivision={selectedNamediv}
                                                key={`present-department-${refreshKey}`} 
                                            />
                                        </div>
                                    </>
                                )}
                            </>
                        ) : (
                            <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg border border-gray-200">
                                <span className="text-gray-500">No departments found for this division</span>
                            </div>
                        )}
                    </div>
                )}
                    </>
                )}

            </main>
        </div>
    )


}

