export interface RoundingRule {
    from: number;
    to: number;
    roundOffTo: number;
  }
  
  export interface CalculationBasis {
    calculationBasis: string;
  }
  
  export interface Subsidiary {
    subsidiaryCode: string;
    subsidiaryName: string;
  }
  
  export interface Location {
    locationCode: string;
    locationName: string;
  }
  
  export interface OTPolicy {
    otPolicyCode: string;
    otPolicyName: string;
    calculateOnTheBasisOf: CalculationBasis;
    multiplierForWorkingDay: number;
    multiplierForNationalHoliday: number;
    multiplierForHoliday: number;
    multiplierForWeeklyOff: number;
    dailyMaximumAllowedHours: number;
    weeklyMaximumAllowedHours: number;
    monthlyMaximumAllowedHours: number;
    quaterlyMaximumAllowedHours: number;
    yearlyMaximumAllowedHours: number;
    maximumHoursOnHoliday: number;
    maximumHoursOnWeekend: number;
    maximumHoursOnWeekday: number;
    minimumExtraMinutesConsideredForOT: number;
    roundingEnabled: boolean;
    afterRoundingOff: boolean;
    beforeRoundingOff: boolean;
    doThisWhenCrossedAllocatedLimit: string;
    approvalRequired: boolean;
    minimumFixedMinutesToAllowOvertime: number;
    status: 'active' | 'inactive';
    rounding: RoundingRule[];
    remark: string;
    isConsideredForHoliday: boolean;
    isConsideredForNationalHoliday: boolean;
    isConsideredForWeeklyOff: boolean;
    isConsideredForWorkingDay: boolean;
    isConsideredBeforeShift: boolean;
    isConsideredAfterShift: boolean;
    perHourRate?: number;
  }
  
  export interface OTPolicyApplication {
    _id?: string;
    organizationCode: string;
    tenantCode: string;
    subsidiary: Subsidiary;
    location: Location;
    employeeCategory: string[];
    otPolicy: OTPolicy;
    _class?: string;
    createdOn?: string;
    createdBy?: string;
  } 