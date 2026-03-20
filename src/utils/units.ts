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

// Formats millimeters with appropriate unit (mm or m) and precision
export const formatMM = (mm: number, precision = 1): string => {
  if (mm >= 10000) return `${(mm / 1000).toFixed(1)} m`;
  if (mm >= 1000) return `${(mm / 1000).toFixed(2)} m`;
  return `${mm.toFixed(precision)} mm`;
};
