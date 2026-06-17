import { useMemo } from 'react';

type InputDate = string | Date;

export const useWeekDayName = (inputDate: InputDate): string => {
  return useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    let date: Date;

    if (typeof inputDate === 'string') {
      date = new Date(inputDate);
    } else {
      date = inputDate;
    }

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    return days[date.getDay()];
  }, [inputDate]);
};
