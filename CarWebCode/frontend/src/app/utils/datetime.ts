// The API sends and receives local datetimes without a time zone: "YYYY-MM-DD HH:mm:ss".

const pad = (n: number) => String(n).padStart(2, '0');

/** "YYYY-MM-DD HH:mm:ss" -> a value the DatePipe reads in local time. */
export function sqlToDate(value: string): string {
  return value.replace(' ', 'T');
}

/** "YYYY-MM-DD HH:mm:ss" -> "YYYY-MM-DDTHH:mm" for an <input type="datetime-local">. */
export function sqlToInput(value: string): string {
  return value.slice(0, 16).replace(' ', 'T');
}

/** "YYYY-MM-DDTHH:mm" (datetime-local) -> "YYYY-MM-DD HH:mm". */
export function inputToSql(value: string): string {
  return value.replace('T', ' ').slice(0, 16);
}

/** A Date as "YYYY-MM-DDTHH:mm" in local time (min/max of datetime-local inputs). */
export function dateToInput(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Today plus `days`, at `hour`:00 local time. */
export function daysFromNow(days: number, hour = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

/** Business hours of the dealership: Mon-Fri 9:00-17:00, Sat 9:00-15:00, closed on Sunday. */
export function isBusinessHours(date: Date): boolean {
  const day = date.getDay();
  const minutes = date.getHours() * 60 + date.getMinutes();
  if (day === 0) return false;
  if (day === 6) return minutes >= 540 && minutes <= 900;
  return minutes >= 540 && minutes <= 1020;
}
