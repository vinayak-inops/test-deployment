"use client"

import { gql, useQuery } from "@apollo/client";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import getHeaderConfig from "@/json/organization/sub-organization";
import PageNotFound from "@/components/page-notfound";
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray";
import { useFilteredNavigationByObjectKey } from "@/hooks/role-control/useRoleControlByObjectKey";
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode";
import { Sidebar } from "@/components/fields/sidebar-local";
import SidebarFromHeader from "@/components/header/sidebar-from-header";
import { client } from "@repo/ui/hooks/api/dynamic-graphql";
import { RootState } from "@inops/store/src/store";
import { navItemsForm } from "@/json/menu/menu";
import OrganizationInfo from "../../_components/organization-info";
import AreasTable from "./form/areas/areas-table";
import SubsidiariesTable from "./form/subsidiaries/subsidiaries-table";
import AssetMasterTable from "./form/asset-master/asset-master-table";
import CasteTable from "./form/caste/caste-table";
import CentralServerDetailsTable from "./form/central-server-details/central-server-details-table";
import CommunicationSoftwareForm from "./form/communication-software/CommunicationSoftwareForm";
import CountryTable from "./form/country/country-table";
import DepartmentsTable from "./form/departments/departments-table";
import DesignationsTable from "./form/designations/designations-table";
import DivisionsTable from "./form/divisions/divisions-table";
import DocumentMasterTable from "./form/document-master/document-master-table";
import EmployeeCategoriesTable from "./form/employee-categories/employee-categories-table";
import GradesTable from "./form/grades/grades-table";
import LeaveWagesTable from "./form/leave-wages/leave-wages-table";
import LocationTable from "./form/location/location-table";
import MailGroupTable from "./form/mail-group/mail-group-table";
import MaxEmployeesPerSubsidiaryTable from "./form/max-employees-per-subsidiary/max-employees-per-subsidiary-table";
import GlobalServerDetailsForm from "./form/global-server-details/GlobalServerDetailsForm";
import NatureOfWorkTable from "./form/nature-of-work/nature-of-work-table";
import SectionsTable from "./form/sections/sections-table";
import SubDepartmentsTable from "./form/sub-departments/sub-departments-table";
import ReasonCodesTable from "./form/reason-codes/reason-codes-table";
import RegionTable from "./form/region/region-table";
import SkillLevelsTable from "./form/skill-levels/skill-levels-table";
import StateTable from "./form/state/state-table";
import WagePeriodTable from "./form/wage-period/wage-period-table";
import WorkSkillTable from "./form/work-skill/work-skill-table";

const FETCH_ALL_ORGANIZATION_QUERY = gql`
    query FetchAllOrganization($collection: String!, $tenantCode: String!) {
        fetchAllOrganization(collection: $collection, tenantCode: $tenantCode) {
            _id
        }
    }
`;

// Transform camelCase to hyphenated lowercase
const transformToHyphenated = (param: string) => {
    return param
        .replace(/([A-Z])/g, '-$1') // Add hyphen before capital letters
        .toLowerCase() // Convert to lowercase
        .replace(/^-/, ''); // Remove leading hyphen if exists
};

// Transform hyphenated lowercase back to camelCase
const transformToCamelCase = (param: string) => {
    return param
        .split('-') // Split by hyphen
        .map((word, index) => {
            // Capitalize first letter of each word except the first word
            return index === 0
                ? word.toLowerCase()
                : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(''); // Join words back together
};

const organizationSidebarItems = [
    { id: "organizationInfo", label: "Organization Info", icon: "building" },
    { id: "location", label: "Location", icon: "map-pin" },
    { id: "subsidiaries", label: "Subsidiary", icon: "building" },
    { id: "divisions", label: "Division", icon: "git-branch" },
    { id: "areas", label: "Area", icon: "git-branch" },
    { id: "designations", label: "Designation", icon: "user-circle" },
    { id: "grades", label: "Grade", icon: "book" },
    { id: "departments", label: "Department", icon: "briefcase" },
    { id: "subDepartments", label: "Sub Department", icon: "settings" },
    { id: "sections", label: "Section", icon: "grid" },
    { id: "employeeCategories", label: "Employee Category", icon: "user-circle" },
    { id: "workSkill", label: "Work Skill", icon: "shield-check" },
    { id: "natureOfWork", label: "Nature Of Work", icon: "briefcase" },
    { id: "region", label: "Region", icon: "map-pin" },
    { id: "reasonCodes", label: "Reason Code", icon: "file-text" },
    { id: "wagePeriod", label: "Wage Period", icon: "calculator" },
    { id: "skillLevels", label: "Skill Level", icon: "shield-check" },
    { id: "assetMaster", label: "Asset Master", icon: "clipboard-list" },
    { id: "documentMaster", label: "Document Master", icon: "file-text" },
    { id: "state", label: "State", icon: "map-pin" },
    { id: "country", label: "Country", icon: "map-pin" },
    { id: "caste", label: "Caste", icon: "user-circle" },
    { id: "leaveWages", label: "Leave Wages", icon: "credit-card" },
    { id: "mailGroup", label: "Mail Group", icon: "file-text" },
    { id: "centralServerDetails", label: "Central Server Details", icon: "server" },
    { id: "maxEmployeesPerSubsidiary", label: "Employee Limit", icon: "users" },
    { id: "globalServerDetails", label: "Global Server Details", icon: "server" },
    { id: "communicationSoftware", label: "Communication Software", icon: "radio" },
    { id: "trainingCategories", label: "Training Categories", icon: "book" },
    { id: "trainingPrograms", label: "Training Programs", icon: "book" },
];

const sidebarItemMap = organizationSidebarItems.reduce<Record<string, (typeof organizationSidebarItems)[number]>>(
    (accumulator, item) => {
        accumulator[item.id] = item;
        return accumulator;
    },
    {}
);

export default function SubOrganizationPage() {
    const router = useRouter()
    const params = useParams()
    const searchParams = useSearchParams()
    const tenantCode = useGetTenantCode()
    const apiState = useSelector((state: RootState) => state.api)
    const adminRole = useSelector((state: RootState) => (state as any)?.adminRole?.adminRole)

    const roleData = useMemo(() => {
        if (apiState?.data && Array.isArray(apiState.data) && apiState.data.length > 0) {
            return apiState.data[0]
        }
        return adminRole || {}
    }, [apiState?.data, adminRole])

    // If the param contains hyphens, convert to camelCase; default to organizationInfo
    const param = Array.isArray(params?.organization) ? params.organization[0] : undefined
    const transformedParam = param ? transformToCamelCase(param) : "organizationInfo"

    // Check if we're in view mode
    const mode = searchParams.get('mode')

    // Use the role permissions hook with proper initialization
    const permissionScreenName = transformedParam === "organizationInfo" ? "organization" : transformedParam
    const {
        responseData: rolePermissions,
    } = useRolePermissions({
        serviceName: "organization",
        screenName: permissionScreenName || ""
    });

    const filteredOrganizationNav: any[] = useFilteredNavigationByObjectKey(
        navItemsForm,
        roleData,
        ["organization"]
    )

    const viewMode = rolePermissions?.view || false;
    const editMode = rolePermissions?.edit || false;
    const addMode = rolePermissions?.add || false;
    const deleteMode = rolePermissions?.delete || false;
    const { data: organizationData } = useQuery(FETCH_ALL_ORGANIZATION_QUERY, {
        variables: {
            collection: "organization",
            tenantCode: tenantCode || "",
        },
        skip: !tenantCode,
        client,
    })
    const organizationId = organizationData?.fetchAllOrganization?.[0]?._id || ""

    const headerConfig = getHeaderConfig(transformedParam, mode);
    const filteredSidebarItems = useMemo(() => {
        const organizationGroup = filteredOrganizationNav.find((item: any) => item?.page === "organization")
        const allowedItems = Array.isArray(organizationGroup?.items) ? organizationGroup.items : []

        return allowedItems
            .map((item: any) => {
                const sidebarId = item.page === "organization" ? "organizationInfo" : item.page
                return sidebarItemMap[sidebarId]
            })
            .filter(Boolean)
    }, [filteredOrganizationNav])

    const sidebarSections = useMemo(
        () => [
            {
                title: "Organization Setup",
                items: filteredSidebarItems,
            },
        ],
        [filteredSidebarItems],
    );

    const handleSidebarItemClick = (id: string) => {
        const nextSlug = transformToHyphenated(id);
        const query = searchParams.toString();
        router.push(`/organization-management/${nextSlug}${query ? `?${query}` : ""}`);
    };

    return (
        <>
            {
                (viewMode || editMode || addMode) ? (
                    <>
                        <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden">
                            <div className="w-full px-12">
                                <div className="mx-auto">
                                    <SidebarFromHeader
                                        title={"Organization"}
                                        description={headerConfig.description}
                                        canAdd={false}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-center flex-1 overflow-hidden px-12">
                                <div className="w-full max-w-7xl h-full flex">
                                    <div className="flex-shrink-0 h-full">
                                        <Sidebar
                                            sections={sidebarSections}
                                            activeId={transformedParam}
                                            onItemClick={handleSidebarItemClick}
                                        />
                                    </div>
                                    <main className="min-w-0 flex-1 overflow-y-auto pr-2 pt-4">
                                        {transformedParam === "organizationInfo" ? (
                                            <OrganizationInfo />
                                        ) : transformedParam === "location" ? (
                                            <LocationTable
                                                addMode={addMode}
                                                editMode={editMode}
                                                deleteMode={deleteMode}
                                                organizationId={organizationId}
                                            />
                                        ) : transformedParam === "subsidiaries" ? (
                                            <SubsidiariesTable
                                                addMode={addMode}
                                                editMode={editMode}
                                                deleteMode={deleteMode}
                                                organizationId={organizationId}
                                            />
                                        ) : transformedParam === "assetMaster" ? (
                                            <AssetMasterTable
                                                addMode={addMode}
                                                editMode={editMode}
                                                deleteMode={deleteMode}
                                                organizationId={organizationId}
                                            />
                                        ) : transformedParam === "documentMaster" ? (
                                            <DocumentMasterTable
                                                addMode={addMode}
                                                editMode={editMode}
                                                deleteMode={deleteMode}
                                                organizationId={organizationId}
                                            />
                                        ) : transformedParam === "caste" ? (
                                            <CasteTable
                                                addMode={addMode}
                                                editMode={editMode}
                                                deleteMode={deleteMode}
                                                organizationId={organizationId}
                                            />
                                        ) : transformedParam === "country" ? (
                                            <CountryTable
                                                addMode={addMode}
                                                editMode={editMode}
                                                deleteMode={deleteMode}
                                                organizationId={organizationId}
                                            />
                                        ) : transformedParam === "divisions" ? (
                                            <DivisionsTable
                                                addMode={addMode}
                                                editMode={editMode}
                                                deleteMode={deleteMode}
                                                organizationId={organizationId}
                                            />
                                        ) : transformedParam === "areas" ? (
                                            <AreasTable
                                                addMode={addMode}
                                                editMode={editMode}
                                                deleteMode={deleteMode}
                                                organizationId={organizationId}
                                            />
                                        ) : transformedParam === "designations" ? (
                                            <DesignationsTable
                                                addMode={addMode}
                                                editMode={editMode}
                                                deleteMode={deleteMode}
                                                organizationId={organizationId}
                                            />
                                        ) : transformedParam === "employeeCategories" ? (
                                            <EmployeeCategoriesTable
                                                addMode={addMode}
                                                editMode={editMode}
                                                deleteMode={deleteMode}
                                                organizationId={organizationId}
                                            />
                                        ) : transformedParam === "grades" ? (
                                            <GradesTable
                                                addMode={addMode}
                                                editMode={editMode}
                                                deleteMode={deleteMode}
                                                organizationId={organizationId}
                                            />
                                        ) : transformedParam === "leaveWages" ? (
                                            <LeaveWagesTable
                                                addMode={addMode}
                                                editMode={editMode}
                                                deleteMode={deleteMode}
                                                organizationId={organizationId}
                                            />
                                        ) : transformedParam === "subDepartments" ? (
                                            <SubDepartmentsTable
                                                addMode={addMode}
                                                editMode={editMode}
                                                deleteMode={deleteMode}
                                                organizationId={organizationId}
                                            />
                                        ) : transformedParam === "region" ? (
                                            <RegionTable
                                                addMode={addMode}
                                                editMode={editMode}
                                                deleteMode={deleteMode}
                                                organizationId={organizationId}
                                            />
                                        ) : transformedParam === "reasonCodes" ? (
                                            <ReasonCodesTable
                                                addMode={addMode}
                                                editMode={editMode}
                                                deleteMode={deleteMode}
                                                organizationId={organizationId}
                                            />
                                        ) : transformedParam === "mailGroup" ? (
                                            <MailGroupTable
                                                addMode={addMode}
                                                editMode={editMode}
                                                deleteMode={deleteMode}
                                                organizationId={organizationId}
                                            />
                                        ) : transformedParam === "centralServerDetails" ? (
                                            <CentralServerDetailsTable
                                                addMode={addMode}
                                                editMode={editMode}
                                                deleteMode={deleteMode}
                                                organizationId={organizationId}
                                            />
                                        ) : transformedParam === "maxEmployeesPerSubsidiary" ? (
                                            <MaxEmployeesPerSubsidiaryTable
                                                addMode={addMode}
                                                editMode={editMode}
                                                deleteMode={deleteMode}
                                                organizationId={organizationId}
                                            />
                                        ) : transformedParam === "globalServerDetails" ? (
                                            <GlobalServerDetailsForm
                                                organizationId={organizationId}
                                                isViewMode={!editMode && !addMode}
                                            />
                                        ) : transformedParam === "communicationSoftware" ? (
                                            <CommunicationSoftwareForm
                                                organizationId={organizationId}
                                                isViewMode={!editMode && !addMode}
                                            />
                                        ) : transformedParam === "sections" ? (
                                            <SectionsTable
                                                addMode={addMode}
                                                editMode={editMode}
                                                deleteMode={deleteMode}
                                                organizationId={organizationId}
                                            />
                                        ) : transformedParam === "natureOfWork" ? (
                                            <NatureOfWorkTable
                                                addMode={addMode}
                                                editMode={editMode}
                                                deleteMode={deleteMode}
                                                organizationId={organizationId}
                                            />
                                        ) : transformedParam === "departments" ? (
                                            <DepartmentsTable
                                                addMode={addMode}
                                                editMode={editMode}
                                                deleteMode={deleteMode}
                                                organizationId={organizationId}
                                            />
                                        ) : transformedParam === "skillLevels" ? (
                                            <SkillLevelsTable
                                                addMode={addMode}
                                                editMode={editMode}
                                                deleteMode={deleteMode}
                                                organizationId={organizationId}
                                            />
                                        ) : transformedParam === "state" ? (
                                            <StateTable
                                                addMode={addMode}
                                                editMode={editMode}
                                                deleteMode={deleteMode}
                                                organizationId={organizationId}
                                            />
                                        ) : transformedParam === "wagePeriod" ? (
                                            <WagePeriodTable
                                                addMode={addMode}
                                                editMode={editMode}
                                                deleteMode={deleteMode}
                                                organizationId={organizationId}
                                            />
                                        ) : transformedParam === "workSkill" ? (
                                            <WorkSkillTable
                                                addMode={addMode}
                                                editMode={editMode}
                                                deleteMode={deleteMode}
                                                organizationId={organizationId}
                                            />
                                        ) : (
                                            <PageNotFound />
                                        )}
                                    </main>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <PageNotFound />
                )
            }
        </>
    )
} 
