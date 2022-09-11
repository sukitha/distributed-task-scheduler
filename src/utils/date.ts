export const isToday = (dateMs: number) => {
  const today = new Date();
  return new Date(dateMs).setHours(0, 0, 0, 0) === today.setHours(0, 0, 0, 0);
}


export const getDayBoundariesMs = (config: Partial<{ daysOffset: number, baseDateMs: number }> = {}) => {
  const { daysOffset = 0, baseDateMs = Date.now() } = config;
  const date = new Date(baseDateMs);
  date.setDate(date.getDate() + daysOffset);
  return {
    from: date.setHours(0, 0, 0, 0),
    to: date.setHours(23, 59, 59, 999)
  }
}

export const dateConstants = {
  DAY_IN_MS: 1000 * 60 * 60 * 24
}