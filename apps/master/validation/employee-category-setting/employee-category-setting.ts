import * as yup from 'yup'


// Types for form (local to this file)
export type GenericSettings = {
    allowMobileApp: boolean
    includeHolidayInPresentDays: boolean
    allowAttendanceFromMobileApp: boolean
    autoMarkPresent: boolean
    includeLeaveInPresentDays: boolean
    allowEmail: boolean
    ceilingLimitApplicableForPFContribution: boolean
    allowEmailNotification: boolean
    temporaryEmployee: boolean
    allowManualSwipesFromWeb: boolean
    excludeWeekOffFromPayableDays: boolean
  }
  
  export type NotificationSetting = {
    propertyName: string
    notifyPriorDays: number
    isActive: boolean
    mailGroup: string
    autoBlockEnabled?: boolean
    notifyEnabled?: boolean
  }
  
  export type ShiftGraceSettings = {
    earlyOutAllowedTime: number
    graceOut: number
    graceIn: number
    outAheadMargin: number
    inAheadMargin: number
    inAboveMargin: number
    lateInAllowedTime: number
    outAboveMargin: number
    lunchHourDeduction: boolean
  }
  
  export type LevelOfApprovals = {
    leaveApprovalLevel: number
    punchApprovalLevel: number
    outDutyApprovalLevel: number
    shiftApprovalLevel: number
  }
  
  export type EmployeeCategorySettingsForm = {
    genericSettings: GenericSettings
    shiftGraceSettings: ShiftGraceSettings
    notificationSettings: NotificationSetting[]
    defaultWeekOffs?: { week: number; weekOff: number[] }[]
    levelOfApprovals?: LevelOfApprovals
    employeeCategoryCode: string
    sourceEmailAddess?: string
    sourceEmailPassward?: string
    createdOn?: string
    createdBy?: string
  }


export const validationSchema: yup.ObjectSchema<EmployeeCategorySettingsForm> = yup.object({
    genericSettings: yup.object({
      allowMobileApp: yup.boolean().required(),
      includeHolidayInPresentDays: yup.boolean().required(),
      allowAttendanceFromMobileApp: yup.boolean().required(),
      autoMarkPresent: yup.boolean().required(),
      includeLeaveInPresentDays: yup.boolean().required(),
      allowEmail: yup.boolean().required(),
      ceilingLimitApplicableForPFContribution: yup.boolean().required(),
      allowEmailNotification: yup.boolean().required(),
      temporaryEmployee: yup.boolean().required(),
      allowManualSwipesFromWeb: yup.boolean().required(),
      excludeWeekOffFromPayableDays: yup.boolean().required(),
    }).required(),
    shiftGraceSettings: yup.object({
      earlyOutAllowedTime: yup.number().typeError('Must be a number').min(0).max(600).required('Required'),
      graceOut: yup.number().typeError('Must be a number').min(0).max(120).required('Required'),
      graceIn: yup.number().typeError('Must be a number').min(0).max(120).required('Required'),
      outAheadMargin: yup.number().typeError('Must be a number').min(0).max(600).required('Required'),
      inAheadMargin: yup.number().typeError('Must be a number').min(0).max(600).required('Required'),
      inAboveMargin: yup.number().typeError('Must be a number').min(0).max(600).required('Required'),
      lateInAllowedTime: yup.number().typeError('Must be a number').min(0).max(600).required('Required'),
      outAboveMargin: yup.number().typeError('Must be a number').min(0).max(600).required('Required'),
      lunchHourDeduction: yup.boolean().required(),
    }).required(),
    defaultWeekOffs: yup.array().of(
      yup.object({
        week: yup
          .number()
          .typeError('Must be a number')
          .min(1, 'Week must be between 1 and 5')
          .max(5, 'Week must be between 1 and 5')
          .required('Week is required'),
        weekOff: yup
          .array()
          .of(
            yup
              .number()
              .typeError('Day must be a number')
              .min(1, 'Day must be between 1 and 7')
              .max(7, 'Day must be between 1 and 7')
          )
          .required()
      })
    ).test('unique-weeks', 'Week numbers must be unique', function (weeks) {
      if (!weeks || weeks.length === 0) return true
      const weekNumbers = weeks.map(w => w.week).filter(n => !isNaN(n))
      const uniqueWeeks = new Set(weekNumbers)
      return uniqueWeeks.size === weekNumbers.length
    }).optional(),
    notificationSettings: yup.array().of(
      yup.object({
        propertyName: yup.string().required('Property name is required'),
        notifyPriorDays: yup
          .number()
          .typeError('Must be a number')
          .min(0, 'Must be 0 or greater')
          .max(365, 'Cannot exceed 365')
          .required('Notify prior days is required'),
        isActive: yup.boolean().required(),
        mailGroup: yup.string().required('Mail group is required'),
        autoBlockEnabled: yup.boolean().default(false),
        notifyEnabled: yup.boolean().default(false),
      })
    ).optional(),
    levelOfApprovals: yup.object({
      leaveApprovalLevel: yup.number().typeError('Must be a number').min(0).default(0),
      punchApprovalLevel: yup.number().typeError('Must be a number').min(0).default(0),
      outDutyApprovalLevel: yup.number().typeError('Must be a number').min(0).default(0),
      shiftApprovalLevel: yup.number().typeError('Must be a number').min(0).default(0),
    }).optional(),
    employeeCategoryCode: yup
      .string()
      .required('Employee category is required'),
    sourceEmailAddess: yup.string().email('Invalid email').required('Source email address is required'),
    sourceEmailPassward: yup.string().required('Source email password is required'),
  }) as yup.ObjectSchema<EmployeeCategorySettingsForm>