import { useState, useCallback, useMemo } from 'react'

import { useSession } from 'next-auth/react';



// Types for organization data structure

interface OrganizationData {

  _id?: string

  organizationName?: string

  organizationCode?: string

  location?: any[]

  subsidiaries?: any[]

  divisions?: any[]

  departments?: any[]

  designations?: any[]

  grades?: any[]

  employeeCategories?: any[]

  workSkill?: any[]

  natureOfWork?: any[]

  region?: any[]

  country?: any[]

  state?: any[]

  [key: string]: any

}



interface CrudOperation {

  operation: 'add' | 'update' | 'delete' | 'get' | 'filter'

  category: string

  data?: any

  id?: string

  filters?: Record<string, any>

  code?: string

}



interface UseCrudOrganizationReturn {

  organizationData: OrganizationData

  performCrudOperation: (operation: CrudOperation) => OrganizationData | any[]

  addItem: (category: string, item: any, org?: any) => OrganizationData

  updateItem: (category: string, id: string, updatedData: any, org?: any) => OrganizationData

  deleteItem: (category: string, id: string, org?: any) => OrganizationData

  getItemsByCategory: (category: string) => any[]

  findItemById: (category: string, id: string) => any | null

  findItemByCode: (category: string, code: string) => any | null

  filterItems: (category: string, filters: Record<string, any>) => any[]

  getItemByCode: (category: string, code: string) => any | null

  updateItemByCode: (category: string, code: string, updatedData: any) => OrganizationData

  deleteItemByCode: (category: string, code: string) => OrganizationData

}



// Dynamic category configuration generator

const generateCategoryConfig = (category: string, sampleData?: any) => {

  

  // Auto-detect fields from sample data or use common patterns

  const commonPatterns = {

    codeField: `${category}Code`,

    nameField: `${category}Name`,

    descriptionField: `${category}Description`,

    requiredFields: [`${category}Code`, `${category}Name`],

    defaultStatus: 'active'

  }



  if (sampleData && typeof sampleData === 'object') {

    const keys = Object.keys(sampleData)

    const codeField = keys.find(key => key.toLowerCase().includes('code') && !key.toLowerCase().includes('description'))

    const nameField = keys.find(key => key.toLowerCase().includes('name') && !key.toLowerCase().includes('description'))

    const descriptionField = keys.find(key => key.toLowerCase().includes('description'))



    return {

      codeField: codeField || commonPatterns.codeField,

      nameField: nameField || commonPatterns.nameField,

      descriptionField: descriptionField || commonPatterns.descriptionField,

      requiredFields: [codeField, nameField].filter(Boolean),

      defaultStatus: 'active'

    }

  }



  return commonPatterns

}



export const useCrudOrganization = (initialData: OrganizationData = {}): UseCrudOrganizationReturn => {

  const [organizationData, setOrganizationData] = useState<OrganizationData>(initialData)

  const { data: session, status: sessionStatus } = useSession();

  // Support nested categories stored under paths inside the organization document
  const categoryPathMap: Record<string, string> = {
    trainingCategories: 'trainingMaster.trainingCategories',
    trainingPrograms: 'trainingMaster.trainingPrograms',
  }

  const getArrayByPath = useCallback((obj: any, path?: string): any[] => {
    if (!path) return []
    return path.split('.').reduce((acc: any, key: string) => (acc ? acc[key] : undefined), obj) || []
  }, [])

  const setArrayByPath = useCallback((obj: any, path: string | undefined, value: any[]): any => {
    if (!path) return obj
    const keys = path.split('.')
    const newObj = { ...obj }
    let cursor: any = newObj
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      cursor[key] = { ...(cursor[key] || {}) }
      cursor = cursor[key]
    }
    cursor[keys[keys.length - 1]] = value
    return newObj
  }, [])
  // Helper function to generate unique ID

  const generateId = useCallback(() => {

    return Date.now().toString(36) + Math.random().toString(36).substr(2)

  }, [])



  // Dynamic category configuration

  const getCategoryConfig = useCallback((category: string) => {

    const path = categoryPathMap[category]
    const items = path ? getArrayByPath(organizationData, path) : (organizationData[category] || [])
    const sampleData = items[0] || {}

    return generateCategoryConfig(category, sampleData)

  }, [organizationData, getArrayByPath])


  // Dynamic validation based on data structure

  const validateRequiredFields = useCallback((category: string, data: any) => {

    // Skip generic required-field validation for categories that don't have code/name fields

    const skip = new Set(['skillLevels', 'caste', 'leaveWages'])

    if (skip.has(category)) return



    const config = getCategoryConfig(category)

    const missingFields = config.requiredFields.filter(field => field && !data[field])



    if (missingFields.length > 0) {

      throw new Error(`Missing required fields for ${category}: ${missingFields.join(', ')}`)

    }

  }, [getCategoryConfig])



  // Helper function to find item by ID

  const findItemById = useCallback((category: string, id: string): any | null => {

    const path = categoryPathMap[category]
    const items = path ? getArrayByPath(organizationData, path) : (organizationData[category] || [])
    return items.find((item: any) => item.id === id || item._id === id) || null

  }, [organizationData, getArrayByPath])


  // Helper function to find item by code

  const findItemByCode = useCallback((category: string, code: string): any | null => {

    const path = categoryPathMap[category]
    const items = path ? getArrayByPath(organizationData, path) : (organizationData[category] || [])


    const config = getCategoryConfig(category)

    return items.find((item: any) => item[config.codeField] === code) || null

  }, [organizationData, getCategoryConfig, getArrayByPath])


  // Helper function to get items by category

  const getItemsByCategory = useCallback((category: string): any[] => {

    const path = categoryPathMap[category]
    return path ? getArrayByPath(organizationData, path) : (organizationData[category] || [])
  }, [organizationData, getArrayByPath])


  // Helper function to filter items

  const filterItems = useCallback((category: string, filters: Record<string, any>): any[] => {

    const path = categoryPathMap[category]
    const items = path ? getArrayByPath(organizationData, path) : (organizationData[category] || [])
    return items.filter((item: any) => {

      return Object.entries(filters).every(([key, value]) => {

        if (Array.isArray(value)) {

          return value.includes(item[key])

        }

        if (typeof value === 'object' && value !== null) {

          return Object.entries(value).every(([subKey, subValue]) =>

            item[key]?.[subKey] === subValue

          )

        }

        return item[key] === value

      })

    })

  }, [organizationData, getArrayByPath])


  // Add new item to a category

  const addItem = useCallback((category: string, item: any, org?: any): OrganizationData => {

    const config = getCategoryConfig(category)

    validateRequiredFields(category, item)



    const newItem = {

      ...item,

      // id: generateId(),

      // status: config.defaultStatus,

      // type: category,

      createdOn: new Date().toISOString(),

      createdBy: session?.user?.name,

      // updatedAt: new Date().toISOString()

    }



    const targetOrg = org || organizationData

    const path = categoryPathMap[category]
    const items = path ? getArrayByPath(targetOrg, path) : (targetOrg[category] || [])
    const updatedArray = [...items, newItem]
    const updatedData = path
      ? setArrayByPath(targetOrg, path, updatedArray)
      : { ...targetOrg, [category]: updatedArray }


    setOrganizationData(updatedData)

    return updatedData

  }, [organizationData, generateId, getCategoryConfig, validateRequiredFields, findItemByCode, getArrayByPath, setArrayByPath])


  // Update existing item in a category

  const updateItem = useCallback((category: string, id: string, updatedData: any, org?: any): OrganizationData => {


    const targetOrg = org || organizationData


    const path = categoryPathMap[category]
    const items = path ? getArrayByPath(targetOrg, path) : (targetOrg[category] || [])


    // Find item by code (assuming id is the code)

    const config = getCategoryConfig(category)

    let itemIndex

    if (category == "subsidiaries") {

      itemIndex = items.findIndex((item: any) => item.subsidiaryCode === id)

    } else if (category == "divisions") {

      itemIndex = items.findIndex((item: any) => item.divisionCode === id)

    } else if (category == "departments") {

      itemIndex = items.findIndex((item: any) => item.departmentCode === id)

    } else if (category == "designations") {

      itemIndex = items.findIndex((item: any) => item.designationCode === id)

    } else if (category == "location") {

      itemIndex = items.findIndex((item: any) => item.locationCode === id)

    } else if (category == "grades") {

      itemIndex = items.findIndex((item: any) => item.gradeCode === id)

    } else if (category == "subDepartments") {

      itemIndex = items.findIndex((item: any) => item.subDepartmentCode === id)

    } else if (category == "employeeCategories") {

      itemIndex = items.findIndex((item: any) => item.employeeCategoryCode === id)

    } else if (category == "workSkill") {

      itemIndex = items.findIndex((item: any) => item.workSkillCode === id)

    } else if (category == "natureOfWork") {

      itemIndex = items.findIndex((item: any) => item.natureOfWorkCode === id)

    } else if (category == "region") {

      itemIndex = items.findIndex((item: any) => item.regionCode === id)

    } else if (category == "sections") {

      itemIndex = items.findIndex((item: any) => item.sectionCode === id)

    } else if (category == "reasonCodes") {

      itemIndex = items.findIndex((item: any) => item.reasonCode === id)

    } else if (category == "wagePeriod") {

      itemIndex = items.findIndex((item: any) => item.employeeCategory?.employeeCategoryCode === id)

    } else if (category == "skillLevels") {

      itemIndex = items.findIndex((item: any) => item.skilledLevelTitle === id)

    } else if (category == "caste") {

      itemIndex = items.findIndex((item: any) => item.casteName === id)

    } else if (category == "leaveWages") {

      itemIndex = items.findIndex((item: any) => item.skillLeavel?.skilledLevelTitle === id)

    }else if (category == "state") {

      itemIndex = items.findIndex((item: any) => item.stateCode === id)

    } else if (category == "country") {

      itemIndex = items.findIndex((item: any) => item.countryCode === id)

    }

     else {

      itemIndex = items.findIndex((item: any) => item[config.codeField] === id)

    }




    if (itemIndex === -1) {

      throw new Error(`Item with code ${id} not found in category ${category}`)

    }



    validateRequiredFields(category, updatedData)



    // Check if code already exists (excluding current item)

    let existingItem: any

    if (category == "subsidiaries") {

      existingItem = findItemByCode(category, updatedData.subsidiaryCode)

    } else if (category == "divisions") {

      existingItem = findItemByCode(category, updatedData.divisionCode)

    } else if (category == "departments") {

      existingItem = findItemByCode(category, updatedData.departmentCode)

    } else if (category == "designations") {

      existingItem = findItemByCode(category, updatedData.designationCode)

    } else if (category == "location") {

      existingItem = findItemByCode(category, updatedData.locationCode)

    } else if (category == "grades") {

      existingItem = findItemByCode(category, updatedData.gradeCode)

    } else if (category == "subDepartments") {

      existingItem = findItemByCode(category, updatedData.subDepartmentCode)

    } else if (category == "employeeCategories") {

      existingItem = findItemByCode(category, updatedData.employeeCategoryCode)

    } else if (category == "workSkill") {

      existingItem = findItemByCode(category, updatedData.workSkillCode)

    } else if (category == "natureOfWork") {

      existingItem = findItemByCode(category, updatedData.natureOfWorkCode)

    } else if (category == "region") {

      existingItem = findItemByCode(category, updatedData.regionCode)

    } else if (category == "sections") {

      existingItem = findItemByCode(category, updatedData.sectionCode)

    } else if (category == "reasonCodes") {

      existingItem = findItemByCode(category, updatedData.reasonCode)

    } else if (category == "wagePeriod") {

      existingItem = findItemByCode(category, updatedData.employeeCategory?.employeeCategoryCode)

    } else if (category == "skillLevels") {

      existingItem = findItemByCode(category, updatedData.skilledLevelTitle)

    } else if (category == "caste") {

      existingItem = findItemByCode(category, updatedData.casteName)

    } else if (category == "leaveWages") {

      existingItem = findItemByCode(category, updatedData.skillLeavel?.skilledLevelTitle)

    }else if (category == "state") {

      existingItem = findItemByCode(category, updatedData.stateCode)

    } else if (category == "country") {

      existingItem = findItemByCode(category, updatedData.countryCode)

    } else {

      existingItem = findItemByCode(category, updatedData[config.codeField])

    } 

    // Category-aware duplicate checks using proper keys

    if (category == "skillLevels") {

      if (existingItem && updatedData.skilledLevelTitle !== id) {

        throw new Error(`skillLevels with title ${updatedData.skilledLevelTitle} already exists`)

      }

    } else if (category == "caste") {

      if (existingItem && updatedData.casteName !== id) {

        throw new Error(`caste with name ${updatedData.casteName} already exists`)

      }

    } else if (category == "leaveWages") {

      const updatedKey = updatedData?.skillLeavel?.skilledLevelTitle

      if (existingItem && updatedKey !== id) {

        throw new Error(`leaveWages for skill level ${updatedKey} already exists`)

      }

    } else if (category == "state") {

      if (existingItem && updatedData.stateCode !== id) {

        throw new Error(`state with code ${updatedData.stateCode} already exists`)

      }

    } else if (category == "country") {

      if (existingItem && updatedData.countryCode !== id) {

        throw new Error(`country with code ${updatedData.countryCode} already exists`)

      }

    } else {

      if (existingItem && existingItem[config.codeField] !== id) {

        throw new Error(`${category} with code ${updatedData[config.codeField]} already exists`)

      }

    }






    const updatedItem = {

      ...items[itemIndex],

      ...updatedData,

      // updatedAt: new Date().toISOString()

    }



    const updatedItems = [...items]

    updatedItems[itemIndex] = updatedItem



    const newOrganizationData = path
      ? setArrayByPath(targetOrg, path, updatedItems)
      : { ...targetOrg, [category]: updatedItems }


    setOrganizationData(newOrganizationData)

    return newOrganizationData

  }, [organizationData, getCategoryConfig, validateRequiredFields, findItemByCode, getArrayByPath, setArrayByPath])




  const findItemInChild = useCallback((category: string, id: string, org: any): any | null => {

    const path = categoryPathMap[category]
    const items = path ? getArrayByPath(organizationData, path) : (organizationData[category] || [])
    return items.find((item: any) => item.subsidiaryCode === id) || null

  }, [organizationData, getArrayByPath])


  // Update item by code

  const updateItemByCode = useCallback((category: string, code: string, updatedData: any): OrganizationData => {

    const item = findItemByCode(category, code)

    if (!item) {

      throw new Error(`Item with code ${code} not found in category ${category}`)

    }

    return updateItem(category, item.id || item._id, updatedData)

  }, [findItemByCode, updateItem])



  // Delete item from a category

  const deleteItem = useCallback((category: string, id: string, org?: any): OrganizationData => {

    const targetOrg = org || organizationData

    const path = categoryPathMap[category]
    const items = path ? getArrayByPath(targetOrg, path) : (targetOrg[category] || [])


    let filteredItems: any[] = []

    let key: any

    let child: any

    let message: any



    if (category == "subsidiaries") {

      for (const item of ["divisions", "departments", "designations", "location", "grades", "subDepartments", "sections"]) {

        let childItems = findItemInChild(item, id, targetOrg)

        if (childItems) {

          child = true

          message = "This item has child items"

        }

        if(child){

          filteredItems = items 

        }

        else {

          filteredItems = items.filter((item: any) => item.subsidiaryCode !== id && item.subsidiaryCode !== id)

        }

      }



    } else if (category == "divisions") {

      filteredItems = items.filter((item: any) => item.divisionCode !== id && item.divisionCode !== id)

    } else if (category == "departments") {

      filteredItems = items.filter((item: any) => item.departmentCode !== id && item.departmentCode !== id)

    } else if (category == "designations") {

      filteredItems = items.filter((item: any) => item.designationCode !== id && item.designationCode !== id)

    } else if (category == "location") {

      filteredItems = items.filter((item: any) => item.locationCode !== id && item.locationCode !== id)

    } else if (category == "grades") {

      filteredItems = items.filter((item: any) => item.gradeCode !== id && item.gradeCode !== id)

    } else if (category == "subDepartments") {

      filteredItems = items.filter((item: any) => item.subDepartmentCode !== id && item.subDepartmentCode !== id)

    } else if (category == "employeeCategories") {

      filteredItems = items.filter((item: any) => item.employeeCategoryCode !== id && item.employeeCategoryCode !== id)

    } else if (category == "workSkill") {

      filteredItems = items.filter((item: any) => item.workSkillCode !== id && item.workSkillCode !== id)

    } else if (category == "natureOfWork") {

      filteredItems = items.filter((item: any) => item.natureOfWorkCode !== id && item.natureOfWorkCode !== id)

    } else if (category == "region") {

      filteredItems = items.filter((item: any) => item.regionCode !== id && item.regionCode !== id)

    } else if (category == "sections") {

      filteredItems = items.filter((item: any) => item.sectionCode !== id && item.sectionCode !== id)

    } else if (category == "reasonCodes") {

      filteredItems = items.filter((item: any) => item.reasonCode !== id && item.reasonCode !== id)

    } else if (category == "wagePeriod") {

      filteredItems = items.filter((item: any) => item.employeeCategory?.employeeCategoryCode !== id)

    } else if (category == "skillLevels") {

      filteredItems = items.filter((item: any) => item.skilledLevelTitle !== id && item.skilledLevelTitle !== id)

    } else if (category == "caste") {

      filteredItems = items.filter((item: any) => item.casteName !== id && item.casteName !== id)

    } else if (category == "leaveWages") {

      filteredItems = items.filter((item: any) => item.skillLeavel?.skilledLevelTitle !== id && item.skillLeavel?.skilledLevelTitle !== id)

    } else if (category == "state") {

      filteredItems = items.filter((item: any) => item.stateCode !== id && item.stateCode !== id)

    } else if (category == "country") {

      filteredItems = items.filter((item: any) => item.countryCode !== id && item.countryCode !== id)

    }

    else {

      filteredItems = items.filter((item: any) => item[`${category}Code`] !== id && item[`${category}Code`] !== id)

    }



    const updatedData = path
      ? setArrayByPath(targetOrg, path, filteredItems)
      : { ...targetOrg, [category]: filteredItems }




    setOrganizationData(updatedData)

    return updatedData

  }, [organizationData, getArrayByPath, setArrayByPath])


  // Delete item by code

  const deleteItemByCode = useCallback((category: string, code: string): OrganizationData => {

    const item = findItemByCode(category, code)

    if (!item) {

      throw new Error(`Item with code ${code} not found in category ${category}`)

    }

    return deleteItem(category, item.id || item._id)

  }, [findItemByCode, deleteItem])



  // Get item by code

  const getItemByCode = useCallback((category: string, code: string): any | null => {

    return findItemByCode(category, code)

  }, [findItemByCode])



  // Main CRUD operation function

  const performCrudOperation = useCallback((operation: CrudOperation): OrganizationData | any[] => {

    const { operation: op, category, data, id, filters, code } = operation



    switch (op) {

      case 'add':

        if (!data) {

          throw new Error('Data is required for add operation')

        }

        return addItem(category, data, organizationData)



      case 'update':

        if (!data) {

          throw new Error('Data is required for update operation')

        }

        if (code) {

          return updateItemByCode(category, code, data)

        }

        if (!id) {

          throw new Error('ID or code is required for update operation')

        }

        return updateItem(category, id, data, organizationData)



      case 'delete':

        if (code) {

          return deleteItemByCode(category, code)

        }

        if (!id) {

          throw new Error('ID or code is required for delete operation')

        }

        return deleteItem(category, id, organizationData)



      case 'get':

        if (code) {

          return getItemByCode(category, code) || []

        }

        if (filters) {

          return filterItems(category, filters)

        }

        return getItemsByCategory(category)



      case 'filter':

        if (!filters) {

          throw new Error('Filters are required for filter operation')

        }

        return filterItems(category, filters)



      default:

        throw new Error(`Unknown operation: ${op}`)

    }

  }, [addItem, updateItem, updateItemByCode, deleteItem, deleteItemByCode, getItemByCode, filterItems, getItemsByCategory])



  return {

    organizationData,

    performCrudOperation,

    addItem,

    updateItem,

    deleteItem,

    getItemsByCategory,

    findItemById,

    findItemByCode,

    filterItems,

    getItemByCode,

    updateItemByCode,

    deleteItemByCode

  }

}



// Dynamic CRUD hook for any category

export const useDynamicCrud = (category: string, initialData: OrganizationData = {}) => {

  const crud = useCrudOrganization(initialData)



  const config = useMemo(() => {

    const items = (crud.organizationData && crud.organizationData[category]) || []

    const sampleData = items[0] || {}

    return generateCategoryConfig(category, sampleData)

  }, [crud.organizationData, category])



  const addCategoryItem = useCallback((itemData: any, org?: any) => {

    const updatedData = crud.addItem(category, itemData, org)

    return updatedData

  }, [crud, category])



  const updateCategoryItem = useCallback((id: string, itemData: any, org?: any) => {

    const updatedData = crud.updateItem(category, id, itemData, org)

    return updatedData

  }, [crud, category])



  const updateCategoryItemByCode = useCallback((code: string, itemData: any) => {

    const updatedData = crud.updateItemByCode(category, code, itemData)

    return updatedData

  }, [crud, category])



  const deleteCategoryItem = useCallback((id: string, org: any) => {

    const updatedData = crud.deleteItem(category, id, org)

    return updatedData

  }, [crud, category])



  const deleteCategoryItemByCode = useCallback((code: string) => {

    const updatedData = crud.deleteItemByCode(category, code)

    return updatedData

  }, [crud, category])



  const getCategoryItems = useCallback(() => {

    return crud.getItemsByCategory(category)

  }, [crud, category])



  const getCategoryItemByCode = useCallback((code: string) => {

    return crud.getItemByCode(category, code)

  }, [crud, category])



  const filterCategoryItems = useCallback((filters: Record<string, any>) => {

    return crud.filterItems(category, filters)

  }, [crud, category])



  return {

    ...crud,

    category,

    config,

    addCategoryItem,

    updateCategoryItem,

    updateCategoryItemByCode,

    deleteCategoryItem,

    deleteCategoryItemByCode,

    getCategoryItems,

    getCategoryItemByCode,

    filterCategoryItems

  }

}



// Single function to get CRUD hook by category parameter

export const useOrganizationCrud = (category: string, initialData: OrganizationData = {}) => {

  return useDynamicCrud(category, initialData)

}







export default useCrudOrganization 
