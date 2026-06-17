import { useState, useCallback, useMemo } from 'react';

export interface HolidayItem {
  _id?: string;
  employeeCategory: string[];
  organizationCode: string;
  location: {
    locationName: string;
    locationCode: string;
  };
  tenantCode: string;
  holiday: {
    holidayType: string;
    holidayName: string;
    holidayDate: string;
  };
  subsidiary: {
    subsidiaryName: string;
    subsidiaryCode: string;
  };
  _class?: string;
  createdOn?: string;
  createdBy?: string;
}

export const useHolidayCrud = (initialHolidays: HolidayItem[] = []) => {
  const [holidays, setHolidays] = useState<HolidayItem[]>(initialHolidays);
  const [holiday, setHoliday] = useState<HolidayItem | null>(null);

  const addHoliday = useCallback((newHoliday: HolidayItem) => {
    setHolidays(prev => [...prev, { ...newHoliday, _id: newHoliday._id || `holiday_${Date.now()}` }]);
  }, []);

  const updateHoliday = useCallback((id: string, updatedHoliday: HolidayItem) => {
    setHolidays(prev => prev.map(h => h._id === id ? { ...updatedHoliday, _id: id } : h));
  }, []);

  const deleteHoliday = useCallback((id: string) => {
    setHolidays(prev => prev.filter(h => h._id !== id));
  }, []);

  const getHolidayById = useCallback((id: string) => {
    return holidays.find(h => h._id === id) || null;
  }, [holidays]);

  const getHolidayByDate = useCallback((date: string) => {
    return holidays.find(h => h.holiday.holidayDate === date) || null;
  }, [holidays]);

  const filterHolidays = useCallback((filters: Partial<HolidayItem>) => {
    return holidays.filter(holiday => {
      return Object.entries(filters).every(([key, value]) => {
        if (key === 'holiday') {
          return Object.entries(value).every(([holidayKey, holidayValue]) => {
            return holiday.holiday[holidayKey as keyof typeof holiday.holiday] === holidayValue;
          });
        }
        if (key === 'location') {
          return Object.entries(value).every(([locationKey, locationValue]) => {
            return holiday.location[locationKey as keyof typeof holiday.location] === locationValue;
          });
        }
        if (key === 'subsidiary') {
          return Object.entries(value).every(([subsidiaryKey, subsidiaryValue]) => {
            return holiday.subsidiary[subsidiaryKey as keyof typeof holiday.subsidiary] === subsidiaryValue;
          });
        }
        return holiday[key as keyof HolidayItem] === value;
      });
    });
  }, [holidays]);

  const resetHoliday = useCallback(() => {
    setHoliday(null);
  }, []);

  const resetHolidays = useCallback(() => {
    setHolidays([]);
  }, []);

  const setHolidaysData = useCallback((newHolidays: HolidayItem[]) => {
    setHolidays(newHolidays);
  }, []);

  return {
    holidays,
    holiday,
    addHoliday,
    updateHoliday,
    deleteHoliday,
    getHolidayById,
    getHolidayByDate,
    filterHolidays,
    setHoliday,
    resetHoliday,
    resetHolidays,
    setHolidaysData
  };
}; 