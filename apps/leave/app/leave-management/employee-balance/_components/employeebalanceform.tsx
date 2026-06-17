"use client";

import React, { useEffect, useState, useCallback, type Dispatch, type SetStateAction } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import SemiPopupWrapper from "@repo/ui/components/popupwrapper/semi-popup-wrapper";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select";
import { Button } from "@repo/ui/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@repo/ui/components/ui/dropdown-menu";
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest";
import { toast } from "react-toastify";
import { fetchDynamicQuery } from "@repo/ui/hooks/api/dynamic-graphql";
import { Search, AlertCircle, X, User, Plus, Trash2, CheckCircle, ChevronDown, ChevronUp, MoreVertical } from "lucide-react";
import { gql, useQuery } from "@apollo/client";
import { client } from "@repo/ui/hooks/api/dynamic-graphql";
import { useGetTenantCode } from '@/hooks/api/serach/useGetTenantCode'
import { useSession } from "next-auth/react";
import EmployeeSearchField, { type Employee as EmpType } from "@/components/fields/employee-search";

export type EmployeeBalanceItem = {
  _id?: string;
  organizationCode?: string;
  tenantCode?: string;
  employeeID: string;
  balances: BalanceItem[];
  createdOn?: string;
  createdBy?: string;
}

export type BalanceItem = {
  leaveTitle: string;
  leaveCode: string;
  unitOfTime?: string;
  beginningYearBalance?: number;
  carryoverBalance?: number;
  absencePaidYearToDate?: number;
  absencePaidInPeriod?: number;
  beginningPeriodBalance?: number;
  accruedInPeriod?: number;
  carryoverForfeitedInPeriod?: number;
  encashed?: number;
  includeEventsAwaitingApproval?: number;
  asOfPeriod?: string;
  balance?: number;
  encashable?: number;
}

const optionalNumber = yup
  .number()
  .transform((value, originalValue) => (originalValue === "" || originalValue === null ? undefined : value))
  .min(0, "Must be non-negative")
  .test('decimal-places', 'Must have at most 2 decimal places', function(value) {
    if (value === undefined || value === null) return true;
    return Number.isInteger(value * 100); // Check if value has at most 2 decimal places
  })
  .optional();

const balanceSchema = yup.object({
  leaveTitle: yup.string().required("Leave title is required"),
  leaveCode: yup.string().required("Leave code is required"),
  unitOfTime: yup.string().optional(),
  beginningYearBalance: optionalNumber,
  carryoverBalance: optionalNumber,
  absencePaidYearToDate: optionalNumber,
  absencePaidInPeriod: optionalNumber,
  beginningPeriodBalance: optionalNumber,
  accruedInPeriod: optionalNumber,
  carryoverForfeitedInPeriod: optionalNumber,
  encashed: optionalNumber,
  includeEventsAwaitingApproval: optionalNumber,
  asOfPeriod: yup.string().optional(),
  balance: optionalNumber,
  encashable: optionalNumber,
});

const schema = yup.object({
  employeeID: yup.string().required("Employee is required"),
  balances: yup
    .array()
    .of(balanceSchema)
    .min(1, "At least one balance record is required")
    .required()
    .test(
      'unique-leave-code',
      'Leave Code must be unique across records',
      (balances) => {
        if (!Array.isArray(balances)) return true
        const codes = balances.map(b => (b as any)?.leaveCode).filter(Boolean)
        const set = new Set(codes)
        return set.size === codes.length
      }
    ),
  _id: yup.string().optional(),
  tenantCode: yup.string().optional(),
  organizationCode: yup.string().optional(),
}).required();

interface Props {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  editData?: EmployeeBalanceItem | null;
  isEditMode?: boolean;
  isViewMode?: boolean;
  onSuccess?: (saved: EmployeeBalanceItem) => void;
  onServerUpdate?: () => Promise<any>;
  duplicationData?: any[];
}


// Define the working GraphQL query for company employees
const LEAVE_BALANCE_QUERY = gql`
  query FetchLeavePolicy($criteriaRequests: [CriteriaRequest!]!, $collection: String!) {
    fetchLeavePolicy(criteriaRequests: $criteriaRequests, collection: $collection) {
      leavePolicy {
            leaveCode
            leaveTitle
        }
        employeeCategory
    }
  }
`;

export default function EmployeeBalanceForm({ open, setOpen, editData, isEditMode, isViewMode, onSuccess, onServerUpdate, duplicationData }: Props) {
  // Helper function to ensure all numeric values have exactly 2 decimal places
 
  const { data: session, status: sessionStatus } = useSession();
  const formatToTwoDecimals = useCallback((value: any): number => {
    const num = Number(value || 0);
    return parseFloat(num.toFixed(2));
  }, []);

  // Helper function to ensure all numbers are formatted as doubles with .00
  const ensureDoubleFormat = useCallback((value: any): number => {
    const num = Number(value || 0);
    // Always return a number with exactly 2 decimal places
    return parseFloat(num.toFixed(2));
  }, []);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<EmployeeBalanceItem>({
    resolver: yupResolver(schema),
    defaultValues: {
      employeeID: "",
      balances: [{
        leaveTitle: "",
        leaveCode: "",
        unitOfTime: "Days",
        beginningYearBalance: formatToTwoDecimals(0), // Double precision
        carryoverBalance: formatToTwoDecimals(0), // Double precision
        absencePaidYearToDate: formatToTwoDecimals(0), // Double precision
        absencePaidInPeriod: formatToTwoDecimals(0), // Double precision
        beginningPeriodBalance: formatToTwoDecimals(0), // Double precision
        accruedInPeriod: formatToTwoDecimals(0), // Double precision
        carryoverForfeitedInPeriod: formatToTwoDecimals(0), // Double precision
        encashed: formatToTwoDecimals(0), // Double precision
        includeEventsAwaitingApproval: formatToTwoDecimals(0), // Double precision
        asOfPeriod: "",
        balance: formatToTwoDecimals(0), // Double precision
        encashable: formatToTwoDecimals(0), // Double precision
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "balances",
  });

  // Ensure numeric inputs display 2-decimal format while keeping numeric state (double precision)
  const handleNumberBlur = (rowIndex: number, field: keyof BalanceItem) => (e: React.FocusEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const num = isNaN(parseFloat(raw)) ? 0 : parseFloat(raw);
    const fixed = formatToTwoDecimals(num); // Double precision - 2 decimal places
    setValue(`balances.${rowIndex}.${field}` as const, fixed, { shouldValidate: true, shouldDirty: true });
    // Reflect formatted value in the input immediately
    e.target.value = fixed.toFixed(2);
    
    // Debug: Log the formatting (double precision)
  }

  // Handle number input change with immediate formatting (double precision)
  const handleNumberChange = (rowIndex: number, field: keyof BalanceItem) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty input for user to clear field
    if (value === '') {
      setValue(`balances.${rowIndex}.${field}` as const, 0, { shouldValidate: true, shouldDirty: true });
      return;
    }
    
    // Parse the number and format to 2 decimal places
    const num = parseFloat(value);
    if (!isNaN(num)) {
      const formatted = formatToTwoDecimals(num);
      setValue(`balances.${rowIndex}.${field}` as const, formatted, { shouldValidate: true, shouldDirty: true });
    }
  };
  const [selectedEmployee, setSelectedEmployee] = useState<EmpType | null>(null);
  const tenantCode = useGetTenantCode()

  // Leave codes state
  const [leaveOptions, setLeaveOptions] = useState<Array<{ leaveCode: string; leaveTitle: string }>>([]);
  const [loadingLeaveOptions, setLoadingLeaveOptions] = useState(false);
  const [leaveTitleSearch, setLeaveTitleSearch] = useState("");
  
  // State for managing view mode
  const [showAllBalances, setShowAllBalances] = useState(false);


  const {
    data,
    error,
    loading,
    refetch
} = useQuery(LEAVE_BALANCE_QUERY, {
    client,
    variables: {
        criteriaRequests: [
            {
                field: "tenantCode",
                operator: "eq",
                value: tenantCode,
            }
        ],
        collection: "leave_policy",
    },
    errorPolicy: 'all',
    onCompleted: (data) => {
        const list = Array.isArray(data?.fetchLeavePolicy) ? data.fetchLeavePolicy : []
        const options = list.flatMap((item: any) => {
          const policy = item?.leavePolicy
          if (Array.isArray(policy)) {
            return policy
              .filter((p: any) => (p?.leaveCode || p?.levcode) && (p?.leaveTitle || p?.leavetitle))
              .map((p: any) => ({
                leaveCode: p.leaveCode || p.levcode,
                leaveTitle: p.leaveTitle || p.leavetitle,
              }))
          }
          if (policy && (policy.leaveCode || policy.levcode) && (policy.leaveTitle || policy.leavetitle)) {
            return [{ leaveCode: policy.leaveCode || policy.levcode, leaveTitle: policy.leaveTitle || policy.leavetitle }]
          }
          return []
        })
        if (options.length) setLeaveOptions(options)
    },
    onError: (error) => {
        console.error('❌ GraphQL Error loading company employee data:', error);
        console.error('Error details:', error.message, error.graphQLErrors);
    }
});
useEffect(() => {
    refetch()
}, [])

  // Initialize form for edit/view/add
  useEffect(() => {
    if (open) {
    if ((isEditMode || isViewMode) && editData) {
        // Edit mode: Load existing data
      setValue("employeeID", editData.employeeID || "");
      
      if (editData.balances && editData.balances.length > 0) {
        // Format all numeric values to exactly 2 decimal places when loading edit data (double precision)
        const formattedBalances = editData.balances.map(balance => ({
          ...balance,
          beginningYearBalance: formatToTwoDecimals(balance.beginningYearBalance),
          carryoverBalance: formatToTwoDecimals(balance.carryoverBalance),
          absencePaidYearToDate: formatToTwoDecimals(balance.absencePaidYearToDate),
          absencePaidInPeriod: formatToTwoDecimals(balance.absencePaidInPeriod),
          beginningPeriodBalance: formatToTwoDecimals(balance.beginningPeriodBalance),
          accruedInPeriod: formatToTwoDecimals(balance.accruedInPeriod),
          carryoverForfeitedInPeriod: formatToTwoDecimals(balance.carryoverForfeitedInPeriod),
          encashed: formatToTwoDecimals(balance.encashed),
          includeEventsAwaitingApproval: formatToTwoDecimals(balance.includeEventsAwaitingApproval),
          balance: formatToTwoDecimals(balance.balance),
          encashable: formatToTwoDecimals(balance.encashable),
        }));
        
        // Reset and set balances with formatted values
        reset({
          employeeID: editData.employeeID || "",
          balances: formattedBalances,
        });
      }
      } else {
        // Add mode: Complete reset to default state
        reset({
          employeeID: "",
          balances: [{
            leaveTitle: "",
            leaveCode: "",
            unitOfTime: "Days",
            beginningYearBalance: formatToTwoDecimals(0),
            carryoverBalance: formatToTwoDecimals(0),
            absencePaidYearToDate: formatToTwoDecimals(0),
            absencePaidInPeriod: formatToTwoDecimals(0),
            beginningPeriodBalance: formatToTwoDecimals(0),
            accruedInPeriod: formatToTwoDecimals(0),
            carryoverForfeitedInPeriod: formatToTwoDecimals(0),
            encashed: formatToTwoDecimals(0),
            includeEventsAwaitingApproval: formatToTwoDecimals(0),
            asOfPeriod: "",
            balance: formatToTwoDecimals(0),
            encashable: formatToTwoDecimals(0),
          }],
        });
        setSelectedEmployee(null);
      }
    }
  }, [isEditMode, isViewMode, editData, open, setValue, reset, formatToTwoDecimals]);

  // Fetch leave codes when modal opens
  useEffect(() => {
    if (open) {
      // Fetch leave codes
      (async () => {
        try {
          if (leaveOptions.length > 0) return
          setLoadingLeaveOptions(true)
          const leavePolicyFields = {
            fields: [
              'leaveCode',
              'leaveTitle',
              'leaveCategory'
            ]
          }
          const result = await fetchDynamicQuery(
            leavePolicyFields,
            'leave_policy',
            'FetchAllLeavePolicy',
            'fetchAllLeavePolicy',
            {
              collection: 'leave_policy',
              tenantCode: tenantCode
            }
          )
          const raw = Array.isArray(result?.data) ? result.data : []
          const options = raw.flatMap((item: any) => {
            const policy = item?.leavePolicy
            if (Array.isArray(policy)) {
              return policy
                .filter((p: any) => (p?.leaveCode || p?.levcode) && (p?.leaveTitle || p?.leavetitle))
                .map((p: any) => ({
                  leaveCode: p.leaveCode || p.levcode,
                  leaveTitle: p.leaveTitle || p.leavetitle,
                }))
            }
            if (policy && (policy.leaveCode || policy.levcode) && (policy.leaveTitle || policy.leavetitle)) {
              return [{ leaveCode: policy.leaveCode || policy.levcode, leaveTitle: policy.leaveTitle || policy.leavetitle }]
            }
            return []
          })
          if (options.length) setLeaveOptions(options)
        } catch (e) {
          // silent fail; input will remain free text
        } finally {
          setLoadingLeaveOptions(false)
        }
      })();
    }
  }, [open, leaveOptions.length, tenantCode]);

  // Handle employee selection from EmployeeSearchField
  const handleEmployeeSelect = (emp: EmpType) => {
    setValue("employeeID", emp.employeeID, { shouldValidate: true });
    setSelectedEmployee(emp);
  };

  const handleEmployeeClear = () => {
    setValue("employeeID", "", { shouldValidate: true });
    setSelectedEmployee(null);
  };

  const { post: postBalance, loading: postLoading } = usePostRequest<any>({
    url: "leaveBalance",
    onSuccess: (data) => {
      toast.success("Employee balance saved successfully");
      onSuccess?.(data);
    },
    onError: (error) => {
      toast.error("Failed to save employee balance");
      console.error("POST error:", error);
    },
  });

  const onSubmit: Parameters<typeof handleSubmit>[0] = async (formData) => {
    // Duplicate employee validation using duplicationData - only check in add mode (not in view)
    if (!isEditMode && !isViewMode) {
    const selectedEmployeeId = (formData.employeeID || '').trim();
    if (duplicationData && Array.isArray(duplicationData) && selectedEmployeeId) {
      const isDuplicate = duplicationData.some((rec: any) => {
        if (!rec) return false;
        const sameEmployee = (rec.employeeID || '').trim() === selectedEmployeeId;
          return sameEmployee;
      });
      if (isDuplicate) {
        setError('employeeID', { type: 'manual', message: 'This employee already has a balance record' });
        toast.error('Duplicate employee: balance already exists');
        return;
        }
      }
    }

    // Format all numeric values to exactly 2 decimal places for backend storage (double precision)
    const formattedBalances = formData.balances.map(balance => ({
      ...balance,
      beginningYearBalance: formatToTwoDecimals(balance.beginningYearBalance),
      carryoverBalance: formatToTwoDecimals(balance.carryoverBalance),
      absencePaidYearToDate: formatToTwoDecimals(balance.absencePaidYearToDate),
      absencePaidInPeriod: formatToTwoDecimals(balance.absencePaidInPeriod),
      beginningPeriodBalance: formatToTwoDecimals(balance.beginningPeriodBalance),
      accruedInPeriod: formatToTwoDecimals(balance.accruedInPeriod),
      carryoverForfeitedInPeriod: formatToTwoDecimals(balance.carryoverForfeitedInPeriod),
      encashed: formatToTwoDecimals(balance.encashed),
      includeEventsAwaitingApproval: formatToTwoDecimals(balance.includeEventsAwaitingApproval),
      balance: formatToTwoDecimals(balance.balance),
      encashable: formatToTwoDecimals(balance.encashable),
    }));

    // Debug: Log the formatted values to verify they have 2 decimal places (double precision)


    const payload: EmployeeBalanceItem = {
      _id: isEditMode ? (editData as any)?._id : undefined,
      employeeID: formData.employeeID,
      balances: formattedBalances, // Use formatted balances with exactly 2 decimal places (double precision)
      tenantCode: tenantCode,
      organizationCode: tenantCode,
    };

    // Final validation: Ensure all numeric values are properly formatted with 2 decimal places
    const finalPayload = {
      ...payload,
      balances: payload.balances.map(balance => ({
        ...balance,
        beginningYearBalance: formatToTwoDecimals(balance.beginningYearBalance),
        carryoverBalance: formatToTwoDecimals(balance.carryoverBalance),
        absencePaidYearToDate: formatToTwoDecimals(balance.absencePaidYearToDate),
        absencePaidInPeriod: formatToTwoDecimals(balance.absencePaidInPeriod),
        beginningPeriodBalance: formatToTwoDecimals(balance.beginningPeriodBalance),
        accruedInPeriod: formatToTwoDecimals(balance.accruedInPeriod),
        carryoverForfeitedInPeriod: formatToTwoDecimals(balance.carryoverForfeitedInPeriod),
        encashed: formatToTwoDecimals(balance.encashed),
        includeEventsAwaitingApproval: formatToTwoDecimals(balance.includeEventsAwaitingApproval),
        balance: formatToTwoDecimals(balance.balance),
        encashable: formatToTwoDecimals(balance.encashable),
      }))
    };

    const postData = {
      tenant: tenantCode,
      action: "insert",
  id: finalPayload._id || null,
      collectionName: "leaveBalance",
      data: {
        ...finalPayload,
    balances: finalPayload.balances.map((balance) => ({
          ...balance,
      // Add small epsilon before posting; UI continues to show formatted values
      beginningYearBalance: (balance.beginningYearBalance ?? 0) ,
      carryoverBalance: (balance.carryoverBalance ?? 0) ,
      absencePaidYearToDate: (balance.absencePaidYearToDate ?? 0) ,
      absencePaidInPeriod: (balance.absencePaidInPeriod ?? 0) ,
      beginningPeriodBalance: (balance.beginningPeriodBalance ?? 0) ,
      accruedInPeriod: (balance.accruedInPeriod ?? 0) ,
      carryoverForfeitedInPeriod: (balance.carryoverForfeitedInPeriod ?? 0) ,
      encashed: (balance.encashed ?? 0) ,
      includeEventsAwaitingApproval: (balance.includeEventsAwaitingApproval ?? 0) ,
      balance: (balance.balance ?? 0) ,
      encashable: (balance.encashable ?? 0) ,
        })),
        tenantCode: tenantCode,
        organizationCode: tenantCode,
        createdOn: isEditMode ? editData?.createdOn : new Date().toISOString(),
        createdBy: isEditMode ? editData?.createdBy : session?.user?.name || "",
      },
    };


    await postBalance(postData);
    await onServerUpdate?.();
    
    // Clear the selected employee and form data after successful submission
    setSelectedEmployee(null);
    setOpen(false);
  };

  const addBalanceRow = () => {
    append({
      leaveTitle: "",
      leaveCode: "",
      unitOfTime: "Days",
      beginningYearBalance: formatToTwoDecimals(0), // Double precision
      carryoverBalance: formatToTwoDecimals(0), // Double precision
      absencePaidYearToDate: formatToTwoDecimals(0), // Double precision
      absencePaidInPeriod: formatToTwoDecimals(0), // Double precision
      beginningPeriodBalance: formatToTwoDecimals(0), // Double precision
      accruedInPeriod: formatToTwoDecimals(0), // Double precision
      carryoverForfeitedInPeriod: formatToTwoDecimals(0), // Double precision
      encashed: formatToTwoDecimals(0), // Double precision
      includeEventsAwaitingApproval: formatToTwoDecimals(0), // Double precision
      asOfPeriod: "",
      balance: formatToTwoDecimals(0), // Double precision
      encashable: formatToTwoDecimals(0), // Double precision
    });
  };

  // Popup behaviors
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      // Clear selected employee when closing popup
      setSelectedEmployee(null);
      reset(); // Reset form to default values
      setOpen(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        // Clear selected employee when closing popup
        setSelectedEmployee(null);
        reset(); // Reset form to default values
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [open, setOpen, reset]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-[1100px] h-[600px] flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <User className="h-5 w-5" />
              Employee Balance Management
            </h2>
            <p className="text-blue-100 text-sm mt-1">Manage employee leave balances and encashment</p>
          </div>
          <button
            onClick={() => {
              // Clear selected employee when closing popup
              setSelectedEmployee(null);
              reset(); // Reset form to default values
              setOpen(false);
            }}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
            aria-label="Close popup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form id="employee-balance-form" onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 pb-0 py-0 my-0 space-y-6 custom-scroll">
          {/* Employee Search Field */}
          <div className="mb-4 mt-4">
            <EmployeeSearchField
              label="Employee"
              required
              isOpen={open}
              preSelectedEmployeeId={isViewMode ? watch("employeeID") : undefined}
              errorText={errors.employeeID?.message}
              onSelect={handleEmployeeSelect}
              onClear={handleEmployeeClear}
                        // OR if you want to keep the individual props approach:
          subsidiaries={undefined}
          divisions={undefined}
          departments={undefined}
          locations={undefined}
          contractors={undefined}
            />
            {/* Hidden input to submit selected employeeID */}
            <input type="hidden" {...register("employeeID")}/>
            {/* Enhanced duplicate checking feedback - only show in add mode (not in view) */}
            {!isEditMode && !isViewMode && duplicationData && duplicationData.length > 0 && selectedEmployee?.employeeID && (
              <>
                {duplicationData.some((rec: any) => {
                  if (!rec || !rec.employeeID) return false;
                  return rec.employeeID.trim().toLowerCase() === selectedEmployee.employeeID.trim().toLowerCase();
                }) ? (
                  <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-orange-600 text-sm flex items-center gap-2">
                      <X className="h-4 w-4" />
                      <span className="font-medium">Duplicate Employee ID detected</span>
                    </p>
                  </div>
                ) : (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-600 text-sm flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Employee ID is available</span>
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Balance Records */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-semibold text-gray-700">Leave Balances ({(watch('balances')?.length || 0)})</div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="px-2 py-2 h-10 rounded-xl border-gray-300 hover:bg-gray-50 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-200 shadow-lg rounded-lg">
                    <DropdownMenuItem 
                      onClick={() => setShowAllBalances(!showAllBalances)}
                      className="cursor-pointer hover:bg-gray-50 px-3 py-2 text-sm"
                    >
                      {showAllBalances ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-2 text-gray-600" />
                          View Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-2 text-gray-600" />
                          View All ({(watch('balances')?.length || 0)} balances)
                        </>
                      )}
                    </DropdownMenuItem>
                    {/* Future menu items can be added here */}
                  </DropdownMenuContent>
                </DropdownMenu>
                {!isViewMode && (
                <Button
                  type="button"
                  onClick={addBalanceRow}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Balance
                </Button>
                )}
              </div>
            </div>

            {[...fields].reverse().map((field, originalIndex) => {
              const actualIndex = (fields.length || 0) - 1 - originalIndex;
              
              // Show only the most recently added balance record (first in reverse order) when showAllBalances is false
              if (!showAllBalances && originalIndex !== 0) {
                return null
              }
              
              return (
              <div key={field.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-700">
                    {actualIndex === (fields.length || 0) - 1 ? "Latest Balance Record (last update)" : `Balance Record ${actualIndex + 1}`}
                  </h4>
                  {fields.length > 1 && !isViewMode && (
                    <button
                      type="button"
                      onClick={() => remove(actualIndex)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Leave Title (searchable like Contractor) */}
                  <div className="space-y-2">
                    <Label>Leave Title <span className="text-red-500">*</span></Label>
                    <Select 
                      value={watch(`balances.${actualIndex}.leaveTitle`) || ""}
                      onValueChange={(value) => {
                        const match = leaveOptions.find(o => o.leaveTitle === value)
                        setValue(`balances.${actualIndex}.leaveTitle`, value, { shouldValidate: true })
                        setValue(`balances.${actualIndex}.leaveCode`, match?.leaveCode || '', { shouldValidate: true })
                      }}
                      disabled={isViewMode}
                    >
                      <SelectTrigger className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 bg-white ${errors.balances?.[actualIndex]?.leaveTitle ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'}`}>
                        <SelectValue placeholder={loadingLeaveOptions ? 'Loading leave titles…' : 'Search or select leave title'} />
                      </SelectTrigger>
                      <SelectContent position="popper" className="z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg max-h-[300px]">
                        <div className="p-2 border-b border-gray-200">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Search leave titles..."
                              value={leaveTitleSearch}
                              onChange={(e) => setLeaveTitleSearch(e.target.value)}
                              className="pl-10 h-9 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                            />
                          </div>
                        </div>
                        {loadingLeaveOptions ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : leaveOptions.length > 0 ? (
                          (() => {
                            const selectedCodes = (watch('balances') || []).map((b: any) => b?.leaveCode).filter(Boolean)
                            const currentCode = watch(`balances.${actualIndex}.leaveCode`)
                            return leaveOptions
                              .filter(o => {
                                if (leaveTitleSearch) {
                                  const s = leaveTitleSearch.toLowerCase()
                                  if (!o.leaveTitle.toLowerCase().includes(s) && !o.leaveCode.toLowerCase().includes(s)) return false
                                }
                                // allow if not selected elsewhere or it's the current selection
                                return !selectedCodes.includes(o.leaveCode) || o.leaveCode === currentCode
                              })
                              .map((o) => (
                                <SelectItem key={o.leaveCode} value={o.leaveTitle}>
                                  {o.leaveTitle} ({o.leaveCode})
                                </SelectItem>
                              ))
                          })()
                        ) : (
                          <SelectItem value="no-data" disabled>No leave titles available</SelectItem>
                        )}
                        {(!loadingLeaveOptions && leaveOptions.filter(o => {
                          if (!leaveTitleSearch) return false
                          const s = leaveTitleSearch.toLowerCase()
                          return o.leaveTitle.toLowerCase().includes(s) || o.leaveCode.toLowerCase().includes(s)
                        }).length === 0 && leaveTitleSearch) && (
                          <SelectItem value="no-results" disabled>No results for "{leaveTitleSearch}"</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {errors.balances?.[actualIndex]?.leaveTitle && (
                      <p className="text-sm text-red-500">{errors.balances[actualIndex]?.leaveTitle?.message}</p>
                    )}
                  </div>

                  {/* Leave Code (derived from Leave Title) */}
                  <div className="space-y-2">
                    <Label>Leave Code <span className="text-red-500">*</span></Label>
                    <Input
                      readOnly
                      {...register(`balances.${actualIndex}.leaveCode`)}
                      className="w-full h-10 rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm focus:outline-none"
                      placeholder="Auto-filled from Leave Title"
                    />
                    {errors.balances?.[actualIndex]?.leaveCode && (
                      <p className="text-sm text-red-500">{errors.balances[actualIndex]?.leaveCode?.message}</p>
                    )}
                  </div>

                  {/* Unit of Time */}
                  <div className="space-y-2">
                    <Label>Unit of Time</Label>
                    <select
                      {...register(`balances.${actualIndex}.unitOfTime`)}
                      className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isViewMode}
                    >
                      <option value="Days">Days</option>
                      <option value="Hours">Hours</option>
                    </select>
                    {errors.balances?.[actualIndex]?.unitOfTime && (
                      <p className="text-sm text-red-500">{errors.balances[actualIndex]?.unitOfTime?.message}</p>
                    )}
                  </div>

                  {/* Beginning Year Balance */}
                  <div className="space-y-2">
                    <Label>Beginning Year Balance</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      {...register(`balances.${actualIndex}.beginningYearBalance`)}
                      onChange={handleNumberChange(actualIndex, 'beginningYearBalance')}
                      onBlur={handleNumberBlur(actualIndex, 'beginningYearBalance')}
                      className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      readOnly={isViewMode}
                    />
                    {errors.balances?.[actualIndex]?.beginningYearBalance && (
                      <p className="text-sm text-red-500">{errors.balances[actualIndex]?.beginningYearBalance?.message}</p>
                    )}
                  </div>

                  {/* Carryover Balance */}
                  <div className="space-y-2">
                    <Label>Carryover Balance</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      {...register(`balances.${actualIndex}.carryoverBalance`)}
                      onChange={handleNumberChange(actualIndex, 'carryoverBalance')}
                      onBlur={handleNumberBlur(actualIndex, 'carryoverBalance')}
                      className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      readOnly={isViewMode}
                    />
                    {errors.balances?.[actualIndex]?.carryoverBalance && (
                      <p className="text-sm text-red-500">{errors.balances[actualIndex]?.carryoverBalance?.message}</p>
                    )}
                  </div>

                  {/* Absence Paid Year to Date */}
                  <div className="space-y-2">
                    <Label>Absence Paid Year to Date</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      {...register(`balances.${actualIndex}.absencePaidYearToDate`)}
                      onBlur={handleNumberBlur(actualIndex, 'absencePaidYearToDate')}
                      className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      readOnly={isViewMode}
                    />
                    {errors.balances?.[actualIndex]?.absencePaidYearToDate && (
                      <p className="text-sm text-red-500">{errors.balances[actualIndex]?.absencePaidYearToDate?.message}</p>
                    )}
                  </div>

                  {/* Absence Paid in Period */}
                  <div className="space-y-2">
                    <Label>Absence Paid in Period</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      {...register(`balances.${actualIndex}.absencePaidInPeriod`)}
                      onBlur={handleNumberBlur(actualIndex, 'absencePaidInPeriod')}
                      className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      readOnly={isViewMode}
                    />
                    {errors.balances?.[actualIndex]?.absencePaidInPeriod && (
                      <p className="text-sm text-red-500">{errors.balances[actualIndex]?.absencePaidInPeriod?.message}</p>
                    )}
                  </div>

                  {/* Beginning Period Balance */}
                  <div className="space-y-2">
                    <Label>Beginning Period Balance</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      {...register(`balances.${actualIndex}.beginningPeriodBalance`)}
                      onBlur={handleNumberBlur(actualIndex, 'beginningPeriodBalance')}
                      className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      readOnly={isViewMode}
                    />
                    {errors.balances?.[actualIndex]?.beginningPeriodBalance && (
                      <p className="text-sm text-red-500">{errors.balances[actualIndex]?.beginningPeriodBalance?.message}</p>
                    )}
                  </div>

                  {/* Accrued in Period */}
                  <div className="space-y-2">
                    <Label>Accrued in Period</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      {...register(`balances.${actualIndex}.accruedInPeriod`)}
                      onBlur={handleNumberBlur(actualIndex, 'accruedInPeriod')}
                      className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      readOnly={isViewMode}
                    />
                    {errors.balances?.[actualIndex]?.accruedInPeriod && (
                      <p className="text-sm text-red-500">{errors.balances[actualIndex]?.accruedInPeriod?.message}</p>
                    )}
                  </div>

                  {/* Carryover Forfeited in Period */}
                  <div className="space-y-2">
                    <Label>Carryover Forfeited in Period</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      {...register(`balances.${actualIndex}.carryoverForfeitedInPeriod`)}
                      onBlur={handleNumberBlur(actualIndex, 'carryoverForfeitedInPeriod')}
                      className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      readOnly={isViewMode}
                    />
                    {errors.balances?.[actualIndex]?.carryoverForfeitedInPeriod && (
                      <p className="text-sm text-red-500">{errors.balances[actualIndex]?.carryoverForfeitedInPeriod?.message}</p>
                    )}
                  </div>

                  {/* Encashed */}
                  <div className="space-y-2">
                    <Label>Encashed</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      {...register(`balances.${actualIndex}.encashed`)}
                      onBlur={handleNumberBlur(actualIndex, 'encashed')}
                      className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      readOnly={isViewMode}
                    />
                    {errors.balances?.[actualIndex]?.encashed && (
                      <p className="text-sm text-red-500">{errors.balances[actualIndex]?.encashed?.message}</p>
                    )}
                  </div>

                  {/* Include Events Awaiting Approval */}
                  <div className="space-y-2">
                    <Label>Include Events Awaiting Approval</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      {...register(`balances.${actualIndex}.includeEventsAwaitingApproval`)}
                      onBlur={handleNumberBlur(actualIndex, 'includeEventsAwaitingApproval')}
                      className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      readOnly={isViewMode}
                    />
                    {errors.balances?.[actualIndex]?.includeEventsAwaitingApproval && (
                      <p className="text-sm text-red-500">{errors.balances[actualIndex]?.includeEventsAwaitingApproval?.message}</p>
                    )}
                  </div>

                  {/* As of Period */}
                  <div className="space-y-2">
                    <Label>As of Period</Label>
                    <Input
                      type="date"
                      {...register(`balances.${actualIndex}.asOfPeriod`)}
                      className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      readOnly={isViewMode}
                    />
                    {errors.balances?.[actualIndex]?.asOfPeriod && (
                      <p className="text-sm text-red-500">{errors.balances[actualIndex]?.asOfPeriod?.message}</p>
                    )}
                  </div>

                  {/* Balance */}
                  <div className="space-y-2">
                    <Label>Balance</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      {...register(`balances.${actualIndex}.balance`)}
                      onChange={handleNumberChange(actualIndex, 'balance')}
                      onBlur={handleNumberBlur(actualIndex, 'balance')}
                      className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      readOnly={isViewMode}
                    />
                    {errors.balances?.[actualIndex]?.balance && (
                      <p className="text-sm text-red-500">{errors.balances[actualIndex]?.balance?.message}</p>
                    )}
                  </div>

                  {/* Encashable */}
                  <div className="space-y-2">
                    <Label>Encashable</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      {...register(`balances.${actualIndex}.encashable`)}
                      onBlur={handleNumberBlur(actualIndex, 'encashable')}
                      className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      readOnly={isViewMode}
                    />
                    {errors.balances?.[actualIndex]?.encashable && (
                      <p className="text-sm text-red-500">{errors.balances[actualIndex]?.encashable?.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )})}

            {errors.balances && typeof errors.balances === 'object' && 'message' in errors.balances && (
              <p className="text-sm text-red-500">{errors.balances.message}</p>
            )}
          </div>

        </form>

        {/* Footer - fixed (outside scroll) */}
        <div className="bg-gray-50 px-6 py-4 mt-4 flex justify-end gap-4 border-t border-gray-200 shrink-0">
          <button
            type="button"
            onClick={() => {
              // Clear selected employee when canceling
              setSelectedEmployee(null);
              reset(); // Reset form to default values
              setOpen(false);
            }}
            className="px-4 py-2 h-9 rounded-md font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors text-sm"
            disabled={isSubmitting || postLoading}
          >
            Cancel
          </button>
          {!isViewMode && (
          <button
            type="submit"
            form="employee-balance-form"
            className="px-4 py-2 h-9 rounded-md font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting || postLoading}
          >
            {(isSubmitting || postLoading) ? "Submitting..." : (isEditMode ? "Update" : "Submit")}
          </button>
          )}
        </div>
      </div>
    </div>
  );
}