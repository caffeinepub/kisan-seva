export interface DriverSettings {
  attendanceType: "day" | "hr";
  dailyRate: number;
  hourlyRate: number;
  halfDayThreshold: number; // hours; below this = half day (only for 'day' type)
  addedDate: string; // 'YYYY-MM-DD'
}

export interface AttendanceEntry {
  date: string; // 'YYYY-MM-DD'
  status: "present_full" | "present_half" | "present_hr" | "absent";
  hoursWorked: number;
}

export interface MonthSummary {
  presentFull: number;
  presentHalf: number;
  presentHr: number;
  absent: number;
  totalHours: number;
  estimatedPay: number;
}

export function getDriverSettings(driverId: string): DriverSettings | null {
  try {
    const raw = localStorage.getItem(`driver_settings_${driverId}`);
    if (!raw) return null;
    return JSON.parse(raw) as DriverSettings;
  } catch {
    return null;
  }
}

export function saveDriverSettings(
  driverId: string,
  settings: DriverSettings,
): void {
  localStorage.setItem(`driver_settings_${driverId}`, JSON.stringify(settings));
}

// Compute attendance for a driver for a given month
// Only considers days from addedDate onwards
export function computeMonthlyAttendance(
  driverId: string,
  transactions: Array<{
    driverId?: string;
    date?: string; // 'YYYY-MM-DD'
    hours?: number;
    minutes?: number;
  }>,
  settings: DriverSettings,
  year: number,
  month: number, // 0-indexed
): AttendanceEntry[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const addedDate = new Date(settings.addedDate);
  addedDate.setHours(0, 0, 0, 0);

  // First day of month
  const firstDay = new Date(year, month, 1);
  // Last day of month (or today if current month)
  const lastDay = new Date(year, month + 1, 0);
  const effectiveLastDay = lastDay > today ? today : lastDay;

  // Start from max(firstDay, addedDate)
  const startDay = firstDay < addedDate ? addedDate : firstDay;

  if (startDay > effectiveLastDay) return [];

  // Build a map: date string -> total hours worked
  const hoursMap: Record<string, number> = {};
  for (const tx of transactions) {
    if (!tx.driverId || tx.driverId !== driverId) continue;
    if (!tx.date) continue;
    const txDate = tx.date.slice(0, 10);
    const txYear = Number(txDate.slice(0, 4));
    const txMonth = Number(txDate.slice(5, 7)) - 1;
    if (txYear !== year || txMonth !== month) continue;
    const hrs = (tx.hours || 0) + (tx.minutes || 0) / 60;
    hoursMap[txDate] = (hoursMap[txDate] || 0) + hrs;
  }

  const result: AttendanceEntry[] = [];
  const cursor = new Date(startDay);

  while (cursor <= effectiveLastDay) {
    const dateStr = cursor.toISOString().slice(0, 10);
    const hoursWorked = hoursMap[dateStr] || 0;

    let status: AttendanceEntry["status"];
    if (hoursWorked <= 0) {
      status = "absent";
    } else if (settings.attendanceType === "hr") {
      status = "present_hr";
    } else {
      // Day-based
      status =
        hoursWorked >= settings.halfDayThreshold
          ? "present_full"
          : "present_half";
    }

    result.push({ date: dateStr, status, hoursWorked });
    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
}

export function computeMonthSummary(
  attendance: AttendanceEntry[],
  settings: DriverSettings,
): MonthSummary {
  let presentFull = 0;
  let presentHalf = 0;
  let presentHr = 0;
  let absent = 0;
  let totalHours = 0;

  for (const entry of attendance) {
    totalHours += entry.hoursWorked;
    if (entry.status === "present_full") presentFull++;
    else if (entry.status === "present_half") presentHalf++;
    else if (entry.status === "present_hr") presentHr++;
    else absent++;
  }

  let estimatedPay = 0;
  if (settings.attendanceType === "hr") {
    estimatedPay = totalHours * settings.hourlyRate;
  } else {
    estimatedPay =
      presentFull * settings.dailyRate + presentHalf * settings.dailyRate * 0.5;
  }

  return {
    presentFull,
    presentHalf,
    presentHr,
    absent,
    totalHours,
    estimatedPay,
  };
}
