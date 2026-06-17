export interface LeavePolicyData {
    _id?: string
    organizationCode: string
    tenantCode: string
    subsidiary: {
      subsidiaryCode: string
      subsidiaryName: string
    }
    location: {
      locationCode: string
      locationName: string
    }
    designation: {
      designationCode: string
      designationName: string
    }
    employeeCategory: string[]
    leavePolicy: {
      leaveCode: string
      leaveTitle: string
      effectiveFrom: string
      genderAllowed: string
      maritalStatus: string[]
      minimumServicePeriodRequired: number
      maximumLeaveAllowed: Array<{
        type: string
        daysAllowed: number
      }>
      maximumApplicationAllowed: Array<{
        type: string
        count: number
      }>
      minimumDaysPerApplication: number
      maximumDaysPerApplication: number
      halfDayAllowed: boolean
      sandwichHolidayAsLeave: {
        countAsLeave: boolean
        minimumLeaveDays: number
      }
      sandwichWeekOffAsLeave: {
        countAsLeave: boolean
        minimumLeaveDays: number
      }
      canStartOrEndOnHoliday: boolean
      canStartOrEndOnWeekOff: boolean
      preApplication: {
        leaveDaysMoreThan: number
        applyBeforeDays: number
      }
      maximumBackDaysApplicationAllowed: number
      maximumFutureDaysApplicationAllowed: number
      requireDocsIfLeaveDaysExceeds: number
      allowedInNoticePeriod: boolean
      alertManagerAfterApproval: boolean
      alertManagerDaysBeforeLeaveStart: number
      delegateApplicable: boolean
      reminderFrequencyToApprover: number
      autoApproval: {
        autoApprovalAllowed: boolean
        autoApproveIfDateCrossed: boolean
        daysForAutoApproval: number
      }
      cannotCombineWith: {
        prefix: string[]
        postfix: string[]
      }
      balance: {
        balanceValidation: boolean
        allowedNegativeBalance: number
        minServicePeriodRequired: number
        lapseLeaveBalanceAtYearEnd: string
        maximumBalanceAllowed: number
      }
      leaveAccrual: {
        accrualType: string
        dayId: number
        accrualPolicy: {
          accrualDays: number
          workingDays: number
        }
        accrualInAdvance: boolean
        maximumBalanceCarriedForward: number
        excludedDaysForAccrual: string[]
      }
      encashment: {
        encashmentAllowed: boolean
        autoEncashment: boolean
        minimumBalanceRequired: number
        maximumAllowedEncashment: number
        applicationRequired: boolean
        maximumApplicationAllowedYearly: number
        maximumEncashmentPerApplication: number
      }
      leaveType: string
      leaveCategory: string
    }
    encashment: boolean
  }
  
  // Extended interface for backward compatibility with flat structure
  export interface LeavePolicyDataCompat extends Partial<LeavePolicyData> {
    // Allow flat structure for backward compatibility
    subsidiaryCode?: string
    subsidiaryName?: string
    locationCode?: string
    locationName?: string
    designationCode?: string
    designationName?: string
    leaveCode?: string
    leaveTitle?: string
    effectiveFrom?: string
    genderAllowed?: string
    maritalStatus?: string | string[]
    minimumServicePeriodRequired?: number
    maximumLeaveAllowed?: Array<{
      type: string
      count?: number
      daysAllowed?: number
    }>
    maximumApplicationAllowed?: Array<{
      type: string
      count: number
    }>
    minimumDaysPerApplication?: number
    maximumDaysPerApplication?: number
    halfDayAllowed?: boolean
    sandwichHolidayAsLeave?: any
    sandwichWeekOffAsLeave?: any
    canStartOrEndOnHoliday?: boolean
    canStartOrEndOnWeekOff?: boolean
    preApplicationDays?: number
    maximumBackDaysApplicationAllowed?: number
    maximumFutureDaysApplicationAllowed?: number
    requireDocsIfLeaveDaysExceeds?: number
    allowedInNoticePeriod?: boolean
    alertManagerAfterApproval?: boolean
    alertManagerDaysBeforeLeaveStart?: number
    delegateApplicable?: boolean
    reminderFrequencyToApprover?: number
    autoApproval?: {
      autoApprovalAllowed: boolean
      autoApproveIfDateCrossed: boolean
      daysForAutoApproval: number
    }
    autoApprovalAllowed?: boolean
    autoApproveIfDateCrossed?: boolean
    daysForAutoApproval?: number
    minServicePeriodRequired?: number
    lapseLeaveBalanceAtYearEnd?: string
    preApplication?: {
      leaveDaysMoreThan: number
      applyBeforeDays: number
    }
    cannotCombineWith?: {
      prefix: string[]
      postfix: string[]
    }
    leaveAccrual?: any
    balanceValidation?: boolean
    allowedNegativeBalance?: number
    maximumBalanceAllowed?: number
    encashmentAllowed?: boolean
    minimumBalanceRequired?: number
    maximumAllowedEncashment?: number
    autoEncashment?: boolean
    applicationRequired?: boolean
    maximumApplicationAllowedYearly?: number
    maximumEncashmentPerApplication?: number
    leaveType?: string
    leaveCategory?: string
  }
  
  export interface TabStatus {
    organization: boolean
    policy: boolean
    rules: boolean
    accrual: boolean
    balance: boolean
    encashment: boolean
  }