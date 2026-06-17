// Save or update a form entry in localStorage
export function saveOrUpdateFormData(storageKey: string, newItem: any) {
    const existing = localStorage.getItem(storageKey);
    let data: any[] = [];
  
    if (existing) {
      try {
        data = JSON.parse(existing);
      } catch (e) {
        console.error("Failed to parse existing localStorage data:", e);
      }
    }
  
    const index = data.findIndex((item: any) => item.id === newItem.id);
  
    if (index > -1) {
      // Update existing entry
      data[index] = newItem;
    } else {
      // Add new entry
      data.push(newItem);
    }
  
    localStorage.setItem(storageKey, JSON.stringify(data));
  }
  
  // Add new form data (generates ID automatically)
  export function addFormData(
    storageKey: string,
    form: any,
    values: any
  ) {
    const newFormData = {
      id: `form-location-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      form,
      values,
    };
  
    saveOrUpdateFormData(storageKey, newFormData);
    return newFormData.id; 
  }
  
  export function updateFormValues(storageKey: string, id: string, newValues: any) {
    const existing = localStorage.getItem(storageKey);
    let data: any[] = [];
  
    if (existing) {
      try {
        data = JSON.parse(existing);
      } catch (e) {
        console.error("Failed to parse existing localStorage data:", e);
      }
    }
  
    const index = data.findIndex((item: any) => item.id === id);
  
    if (index > -1) {
      // Update only the values field, keeping other fields intact
      data[index].values = { ...data[index].values, ...newValues };
    } else {
      return false; // No update performed
    }
  
    localStorage.setItem(storageKey, JSON.stringify(data));
    return true; // Update was successful
  }
  
  