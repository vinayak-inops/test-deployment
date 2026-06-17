export type TrainingItem = {
  trainingCode?: string
  trainingName?: string
  trainingDescrition?: string
  startDate?: string
  endDate?: string
  validTill?: string
  notifyPriorDays?: number
  blockingEnabled?: boolean
  notificationEnabled?: boolean
}

export type EmployeeCategoryTrainingDetailsItem = {
  _id: string
  employeeCategoryCode?: string
  tenantCode?: string
  organizationCode?: string
  traninings?: TrainingItem[]
}


