export const formatDateTime = (value: any) => {
    if (!value) return "";
    const date = new Date(value);
    if (isNaN(date.getTime())) return String(value);
    return date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
};

export const formatDateTimeIST = (value: any) => {
    if (!value) return "-";
    
    try {
        let date: Date;
        let timeStr = String(value).trim();
        
        // Handle format like "2025-10-27T10:42:0" or "2025-10-27T10:42:00"
        if (timeStr.includes('T')) {
            // Normalize the time string - ensure seconds are always 2 digits
            // Match pattern like "2025-10-27T10:42:0" or "2025-10-27T10:42"
            const timeMatch = timeStr.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(?::(\d{1,2}))?(?:\.\d+)?([+-]\d{2}:\d{2}|Z)?$/);
            
            if (timeMatch) {
                let normalizedTime = timeMatch[1]; // Base part (date and HH:mm)
                const seconds = timeMatch[2]; // Seconds if present
                const timezone = timeMatch[3]; // Timezone if present
                
                // Add seconds if missing or normalize to 2 digits
                if (seconds !== undefined) {
                    normalizedTime += `:${String(seconds).padStart(2, '0')}`;
                } else {
                    normalizedTime += ':00';
                }
                
                // Add timezone if not present (default to IST)
                if (!timezone) {
                    normalizedTime += '+05:30';
                } else {
                    normalizedTime += timezone;
                }
                
                date = new Date(normalizedTime);
            } else {
                // Fallback: try to parse as-is, add timezone if missing
                if (!timeStr.match(/[+-]\d{2}:\d{2}$|Z$/)) {
                    // Normalize seconds before adding timezone
                    const parts = timeStr.split('T');
                    if (parts.length === 2) {
                        const timePart = parts[1];
                        const timeParts = timePart.split(':');
                        if (timeParts.length >= 2) {
                            // Ensure seconds are 2 digits
                            if (timeParts.length === 2) {
                                timeParts.push('00');
                            } else if (timeParts[2] && timeParts[2].length === 1) {
                                timeParts[2] = '0' + timeParts[2];
                            }
                            timeStr = parts[0] + 'T' + timeParts.join(':') + '+05:30';
                        }
                    }
                    if (!timeStr.includes('+') && !timeStr.includes('Z')) {
                        timeStr += '+05:30';
                    }
                }
                date = new Date(timeStr);
            }
        } else {
            // If it's just time like "10:42:0", combine with today's date
            const today = new Date();
            const parts = timeStr.split(':');
            if (parts.length >= 2) {
                const hours = parseInt(parts[0], 10);
                const minutes = parseInt(parts[1], 10);
                const seconds = parts[2] ? parseInt(parts[2], 10) : 0;
                
                // Create date in local time, then convert to IST
                const localDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes, seconds);
                // Convert to IST string and parse back
                const istString = localDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
                date = new Date(istString);
            } else {
                return timeStr;
            }
        }
        
        if (isNaN(date.getTime())) {
            return String(value);
        }
        
        // Format in IST timezone
        return date.toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    } catch (error) {
        console.error('Error formatting date:', error, value);
        return String(value);
    }
};