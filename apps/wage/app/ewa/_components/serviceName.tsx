import { useRouter } from "next/navigation";
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray";

function ServiceName() {
  const router = useRouter();

  // Screen names for permission checks
  const ewaEmployeeSettingsScreen = "EWAEmployeeSettings";
  const ewaWithdrawalCategoryScreen = "EWAWithdrawalCategory";
  const ewaAllowedWithdrawalScreen = "EWAAllowedWithdrawal";
  const ewaContractorOutstandingScreen = "ewaContractorOutstanding";
  const ewaTenantOutstandingScreen = "ewaTenantOutstanding";

  // Use the role permissions hook for each service
  const { responseData: ewaEmployeeSettingsPermissions } = useRolePermissions({
    serviceName: "ewa",
    screenName: ewaEmployeeSettingsScreen,
  });

  const { responseData: ewaWithdrawalCategoryPermissions } = useRolePermissions(
    {
      serviceName: "ewa",
      screenName: ewaWithdrawalCategoryScreen,
    },
  );

  const { responseData: ewaAllowedWithdrawalPermissions } = useRolePermissions({
    serviceName: "ewa",
    screenName: ewaAllowedWithdrawalScreen,
  });

  const { responseData: ewaContractorOutstandingPermissions } =
    useRolePermissions({
      serviceName: "ewa",
      screenName: ewaContractorOutstandingScreen,
    });

  const { responseData: ewaTenantOutstandingPermissions } = useRolePermissions({
    serviceName: "ewa",
    screenName: ewaTenantOutstandingScreen,
  });

  // Derive permissions from rolePermissions for each service
  const canEWAEmployeeSettings = !!(
    ewaEmployeeSettingsPermissions?.view ||
    ewaEmployeeSettingsPermissions?.edit ||
    ewaEmployeeSettingsPermissions?.add
  );
  const canEWAWithdrawalCategory = !!(
    ewaWithdrawalCategoryPermissions?.view ||
    ewaWithdrawalCategoryPermissions?.edit ||
    ewaWithdrawalCategoryPermissions?.add
  );
  const canEWAAllowedWithdrawal = !!(
    ewaAllowedWithdrawalPermissions?.view ||
    ewaAllowedWithdrawalPermissions?.edit ||
    ewaAllowedWithdrawalPermissions?.add
  );
  const canEWAContractorOutstanding = !!(
    ewaContractorOutstandingPermissions?.view ||
    ewaContractorOutstandingPermissions?.edit ||
    ewaContractorOutstandingPermissions?.add
  );
  const canEWATenantOutstanding = !!(
    ewaTenantOutstandingPermissions?.view ||
    ewaTenantOutstandingPermissions?.edit ||
    ewaTenantOutstandingPermissions?.add
  );

  // Navigation functions for each service
  const navigateToEWAEmployeeSettings = () => {
    router.push("/ewa/EWA-employee-settings");
  };

  const navigateToEWAWithdrawalCategory = () => {
    router.push("/ewa/EWA-withdrawal-category");
  };

  const navigateToEWAAllowedWithdrawal = () => {
    router.push("/ewa/ewa-allowed-withdrawl");
  };

  const navigateToEWAContractorOutstanding = () => {
    router.push("/ewa/ewa-contractor-outstanding");
  };

  const navigateToEWATenantOutstanding = () => {
    router.push("/ewa/ewa-tenant-outstanding");
  };

  return (
    <div className="">
      {/* Main Content Area - Centered */}
      <div className="flex justify-center px-8 py-6">
        <div className="grid grid-cols-2 max-w-6xl w-full">
          {/* EWA Applications Section */}
          <div className="bg-gray-100 rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-base font-semibold text-gray-700">
                EWA Applications
              </h2>
              <span className="text-blue-600 text-sm cursor-help">?</span>
            </div>
            <div className="space-y-3">
              {canEWAEmployeeSettings && (
                <button
                  onClick={navigateToEWAEmployeeSettings}
                  className="w-full bg-white hover:shadow-md transition-all duration-200 border border-gray-200 rounded-lg p-4 text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-6 h-6 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        EWA Employee Settings
                      </h3>
                      <p className="text-sm text-gray-600">
                        Manage employee eligibility and EWA settings
                      </p>
                    </div>
                  </div>
                </button>
              )}

              {canEWAWithdrawalCategory && (
                <button
                  onClick={navigateToEWAWithdrawalCategory}
                  className="w-full bg-white hover:shadow-md transition-all duration-200 border border-gray-200 rounded-lg p-4 text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-6 h-6 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 9V7a5 5 0 00-10 0v2M5 9h14l-1 11H6L5 9zm3 4h8"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        EWA Withdrawal Category
                      </h3>
                      <p className="text-sm text-gray-600">
                        Configure withdrawal limits and category rules
                      </p>
                    </div>
                  </div>
                </button>
              )}

              {canEWAAllowedWithdrawal && (
                <button
                  onClick={navigateToEWAAllowedWithdrawal}
                  className="w-full bg-white hover:shadow-md transition-all duration-200 border border-gray-200 rounded-lg p-4 text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-6 h-6 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 7h18M6 11h12M8 15h8M10 19h4"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        EWA Allowed Withdrawal
                      </h3>
                      <p className="text-sm text-gray-600">
                        Manage employee allowed withdrawal amounts
                      </p>
                    </div>
                  </div>
                </button>
              )}

              {canEWAContractorOutstanding && (
                <button
                  onClick={navigateToEWAContractorOutstanding}
                  className="w-full bg-white hover:shadow-md transition-all duration-200 border border-gray-200 rounded-lg p-4 text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-6 h-6 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M5 5h14v14H5z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        EWA Contractor Outstanding
                      </h3>
                      <p className="text-sm text-gray-600">
                        Manage contractor outstanding EWA balances
                      </p>
                    </div>
                  </div>
                </button>
              )}

              {canEWATenantOutstanding && (
                <button
                  onClick={navigateToEWATenantOutstanding}
                  className="w-full bg-white hover:shadow-md transition-all duration-200 border border-gray-200 rounded-lg p-4 text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-6 h-6 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 10h18M5 10V7l7-4 7 4v3M6 10v9m4-9v9m4-9v9m4-9v9M4 19h16"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        EWA Tenant Outstanding
                      </h3>
                      <p className="text-sm text-gray-600">
                        Manage tenant outstanding EWA balances
                      </p>
                    </div>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ServiceName;
