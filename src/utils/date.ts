export function todayISO(date = new Date()) {
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

export function dateDaysAgo(days: number) {
  const value = new Date();
  value.setDate(value.getDate() - days);
  return todayISO(value);
}

export function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = Math.round(minutes % 60);

  if (hours <= 0) {
    return `${remainder}m`;
  }

  return `${hours}h ${remainder}m`;
}

export function shortId(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

