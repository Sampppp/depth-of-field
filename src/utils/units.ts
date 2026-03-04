export const toMetric = (mm: number, precision = 2): string => {
  if (mm >= 1000) {
    return `${(mm / 1000).toFixed(precision)} m`;
  }
  return `${mm.toFixed(precision)} cm`;
};

// Formats mm as meters with given precision
export const mmToMeters = (mm: number, precision = 2): string => {
  return `${(mm / 1000).toFixed(precision)} m`;
};