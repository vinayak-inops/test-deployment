import { useRouter } from "next/navigation";
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray";

function ServiceName() {
    const router = useRouter();

    // Screen names for permission checks
    const wageCalculationApplicationScreen = "wageCalculationApplication"
    const wageMinimumWagesScreen = "wageMinimumWages"
    const wageProfessionalTaxScreen = "wageProfessionalTax"
    const wageSalaryHeadsScreen = "wageSalaryHeads"
    const wageSalaryTemplatesScreen = "wageSalaryTemplates"
    const employeeAdvancesScreen = "employeeAdvances"
    const employeePenaltiesScreen = "employeePenalties"
    const wageEmployerContributionsScreen = "wageEmployerContributions"
    const employeeWageTemplateScreen = "employeeWageTemplate"

    // Use the role permissions hook for each service
    const { 
        responseData: wageCalculationAppPermissions, 
    } = useRolePermissions({
        serviceName: "wage",
        screenName: wageCalculationApplicationScreen
    });

    const { 
        responseData: wageMinimumWagesPermissions, 
    } = useRolePermissions({
        serviceName: "wage",
        screenName: wageMinimumWagesScreen
    });

    const { 
        responseData: wageProfessionalTaxPermissions, 
    } = useRolePermissions({
        serviceName: "wage",
        screenName: wageProfessionalTaxScreen
    });

    const { 
        responseData: wageSalaryHeadsPermissions, 
    } = useRolePermissions({
        serviceName: "wage",
        screenName: wageSalaryHeadsScreen
    });

    const { 
        responseData: wageSalaryTemplatesPermissions, 
    } = useRolePermissions({
        serviceName: "wage",
        screenName: wageSalaryTemplatesScreen
    });

    const {
        responseData: employeeAdvancesPermissions,
    } = useRolePermissions({
        serviceName: "wage",
        screenName: employeeAdvancesScreen
    });

    const {
        responseData: employeePenaltiesPermissions,
    } = useRolePermissions({
        serviceName: "wage",
        screenName: employeePenaltiesScreen
    });

    const {
        responseData: wageEmployerContributionsPermissions,
    } = useRolePermissions({
        serviceName: "wage",
        screenName: wageEmployerContributionsScreen
    });

    const {
        responseData: employeeWageTemplatePermissions,
    } = useRolePermissions({
        serviceName: "wage",
        screenName: employeeWageTemplateScreen
    });

    // Derive permissions from rolePermissions for each service
    const canWageCalculationApp = !!(wageCalculationAppPermissions?.view || wageCalculationAppPermissions?.apply);
    const canWageMinimumWages = !!(wageMinimumWagesPermissions?.view || wageMinimumWagesPermissions?.edit || wageMinimumWagesPermissions?.add);
    const canWageProfessionalTax = !!(wageProfessionalTaxPermissions?.view || wageProfessionalTaxPermissions?.edit || wageProfessionalTaxPermissions?.add);
    const canWageSalaryHeads = !!(wageSalaryHeadsPermissions?.view || wageSalaryHeadsPermissions?.edit || wageSalaryHeadsPermissions?.add);
    const canWageSalaryTemplates = !!(wageSalaryTemplatesPermissions?.view || wageSalaryTemplatesPermissions?.edit || wageSalaryTemplatesPermissions?.add);
    const canEmployeeAdvances = !!(employeeAdvancesPermissions?.view || employeeAdvancesPermissions?.edit || employeeAdvancesPermissions?.add);
    const canEmployeePenalties = !!(employeePenaltiesPermissions?.view || employeePenaltiesPermissions?.edit || employeePenaltiesPermissions?.add);
    const canWageEmployerContributions = !!(wageEmployerContributionsPermissions?.view || wageEmployerContributionsPermissions?.edit || wageEmployerContributionsPermissions?.add);
    const canEmployeeWageTemplate = !!(employeeWageTemplatePermissions?.view || employeeWageTemplatePermissions?.edit || employeeWageTemplatePermissions?.add);

    // Navigation functions for each service
    const navigateToWageCalculationApp = () => {
        router.push('/wage-calculation-application');
    };

    const navigateToWageMinimumWages = () => {
        router.push('/wage-management/wage-minimum-wages');
    };

    const navigateToWageProfessionalTax = () => {
        router.push('/wage-management/wage-professional-tax');
    };

    const navigateToWageSalaryHeads = () => {
        router.push('/wage-management/wage-salary-heads');
    };

    const navigateToWageSalaryTemplates = () => {
        router.push('/wage-management/wage-salary-templates');
    };

    const navigateToEmployeeAdvances = () => {
        router.push('/employee-advances');
    };

    const navigateToEmployeePenalties = () => {
        router.push('/employee-penalties');
    };

    const navigateToWageEmployerContributions = () => {
        router.push('/wage-management/wage-employer-contributions');
    };

    const navigateToEmployeeWageTemplate = () => {
        router.push('/wage-management/employee-wage-template');
    };

    return (
        <div className="">
            {/* Main Content Area - Centered */}
            <div className="flex justify-center px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl w-full">
                    {/* Wage Configuration & Management Section */}
                    <div className="bg-gray-100 rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-2 mb-2">
                            <h2 className="text-base font-semibold text-gray-700">Wage Configuration & Management</h2>
                            <span className="text-blue-600 text-sm cursor-help">?</span>
                        </div>
                        <div className="space-y-3">
                            {/* Wage Minimum Wages Card */}
                            {canWageMinimumWages && (
                                <button 
                                    onClick={navigateToWageMinimumWages}
                                    className="w-full bg-white hover:shadow-md transition-all duration-200 border border-gray-200 rounded-lg p-4 text-left"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 mb-1">Wage Minimum Wages</h3>
                                            <p className="text-sm text-gray-600">Configure and manage minimum wage regulations</p>
                                        </div>
                                    </div>
                                </button>
                            )}

                            {/* Wage Professional Tax Card */}
                            {canWageProfessionalTax && (
                                <button 
                                    onClick={navigateToWageProfessionalTax}
                                    className="w-full bg-white hover:shadow-md transition-all duration-200 border border-gray-200 rounded-lg p-4 text-left"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 mb-1">Wage Professional Tax</h3>
                                            <p className="text-sm text-gray-600">Manage professional tax slabs and configurations</p>
                                        </div>
                                    </div>
                                </button>
                            )}

                            {/* Wage Salary Heads Card */}
                            {canWageSalaryHeads && (
                                <button 
                                    onClick={navigateToWageSalaryHeads}
                                    className="w-full bg-white hover:shadow-md transition-all duration-200 border border-gray-200 rounded-lg p-4 text-left"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 mb-1">Wage Salary Heads</h3>
                                            <p className="text-sm text-gray-600">Define and manage salary head components</p>
                                        </div>
                                    </div>
                                </button>
                            )}

                            {/* Wage Salary Templates Card */}
                            {canWageSalaryTemplates && (
                                <button
                                    onClick={navigateToWageSalaryTemplates}
                                    className="w-full bg-white hover:shadow-md transition-all duration-200 border border-gray-200 rounded-lg p-4 text-left"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 mb-1">Wage Salary Templates</h3>
                                            <p className="text-sm text-gray-600">Create and manage salary templates for different roles</p>
                                        </div>
                                    </div>
                                </button>
                            )}

                            {/* Employee Wage Template Card */}
                            {canEmployeeWageTemplate && (
                                <button
                                    onClick={navigateToEmployeeWageTemplate}
                                    className="w-full bg-white hover:shadow-md transition-all duration-200 border border-gray-200 rounded-lg p-4 text-left"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 mb-1">Employee Wage Template</h3>
                                            <p className="text-sm text-gray-600">Assign salary templates to employees with effective date ranges</p>
                                        </div>
                                    </div>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Wage Applications Section */}
                    <div className="bg-gray-100 rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-2 mb-2">
                            <h2 className="text-base font-semibold text-gray-700">Wage Applications</h2>
                            <span className="text-blue-600 text-sm cursor-help">?</span>
                        </div>
                        <div className="space-y-3">
                            {/* Wage Calculation Application Card */}
                            {canWageCalculationApp && (
                                <button 
                                    onClick={navigateToWageCalculationApp}
                                    className="w-full bg-white hover:shadow-md transition-all duration-200 border border-gray-200 rounded-lg p-4 text-left"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 mb-1">Wage Calculation Application</h3>
                                            <p className="text-sm text-gray-600">Submit and manage wage calculation applications</p>
                                        </div>
                                    </div>
                                </button>
                            )}

                            {canEmployeeAdvances && (
                                <button
                                    onClick={navigateToEmployeeAdvances}
                                    className="w-full bg-white hover:shadow-md transition-all duration-200 border border-gray-200 rounded-lg p-4 text-left"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a5 5 0 00-10 0v2M5 9h14l-1 11H6L5 9zm3 4h8" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 mb-1">Employee Advances</h3>
                                            <p className="text-sm text-gray-600">Manage employee advance requests and adjustments</p>
                                        </div>
                                    </div>
                                </button>
                            )}

                            {canEmployeePenalties && (
                                <button
                                    onClick={navigateToEmployeePenalties}
                                    className="w-full bg-white hover:shadow-md transition-all duration-200 border border-gray-200 rounded-lg p-4 text-left"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 mb-1">Employee Penalties</h3>
                                            <p className="text-sm text-gray-600">Track penalties, fines, and payroll impact</p>
                                        </div>
                                    </div>
                                </button>
                            )}

                            {canWageEmployerContributions && (
                                <button
                                    onClick={navigateToWageEmployerContributions}
                                    className="w-full bg-white hover:shadow-md transition-all duration-200 border border-gray-200 rounded-lg p-4 text-left"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 mb-1">Wage Employer Contributions</h3>
                                            <p className="text-sm text-gray-600">Manage employer contribution rules and configurations</p>
                                        </div>
                                    </div>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ServiceName;
