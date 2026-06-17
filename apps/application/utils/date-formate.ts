export const formatDateTime = (value: any): string => {
	try {
		if (!value) return "";

		// If already a Date, use it directly
		let date: Date;
		if (value instanceof Date) {
			date = value;
		} else if (typeof value === "number") {
			date = new Date(value);
		} else if (typeof value === "string") {
			// Normalize common backend formats to safe ISO
			const str = value.trim();
			// YYYY-MM-DD
			if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
				date = new Date(str + "T00:00:00Z");
			}
			// YYYY-MM-DDTHH:mm or :ss (no zone)
			else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(str)) {
				// Treat as UTC to avoid local offset inconsistencies
				date = new Date(str + "Z");
			}
			// If it already contains timezone (+.. or Z)
			else if (/[zZ]|[\+\-]\d{2}:?\d{2}$/.test(str)) {
				date = new Date(str);
			}
			// Fallback: try appending IST offset
			else {
				date = new Date(str + "+05:30");
			}
		} else {
			// Unsupported type
			return "";
		}

		if (isNaN(date.getTime())) return "";

		// Format consistently in Indian Standard Time
		return date.toLocaleString("en-IN", {
			timeZone: "Asia/Kolkata",
			year: "numeric",
			month: "short",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			hour12: true,
		});
	} catch {
		return "";
	}
};