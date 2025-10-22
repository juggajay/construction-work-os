/**
 * Weather Analytics
 * Analyze weather patterns and their impact on construction work
 */

type WeatherCondition =
  | 'clear'
  | 'partly_cloudy'
  | 'overcast'
  | 'rain'
  | 'snow'
  | 'fog'
  | 'wind';

interface WeatherData {
  date: string;
  condition?: WeatherCondition;
  temperatureHigh?: number;
  temperatureLow?: number;
  precipitation?: number;
  windSpeed?: number;
  humidity?: number;
}

interface ProductivityData extends WeatherData {
  totalCrewCount?: number;
  totalHours?: number;
  incidentCount?: number;
}

export interface WeatherAnalytics {
  // Overall Statistics
  totalDays: number;
  workableDays: number;
  impactedDays: number;
  workableDaysPercentage: number;

  // Weather Breakdown
  conditionBreakdown: Record<WeatherCondition | 'unknown', number>;
  averageTemperatureHigh: number;
  averageTemperatureLow: number;
  totalPrecipitation: number;
  daysWithPrecipitation: number;

  // Impact Analysis
  averageCrewOnClearDays: number;
  averageCrewOnRainyDays: number;
  productivityImpactPercentage: number;

  // Extreme Weather Days
  extremeHeatDays: number; // >95°F
  extremeColdDays: number; // <32°F
  highWindDays: number; // >25 mph
  heavyRainDays: number; // >0.5"
}

/**
 * Analyze weather patterns from daily reports
 */
export function analyzeWeatherPatterns(
  reports: ProductivityData[]
): WeatherAnalytics {
  const totalDays = reports.length;

  if (totalDays === 0) {
    return getEmptyAnalytics();
  }

  // Condition breakdown
  const conditionBreakdown: Record<WeatherCondition | 'unknown', number> = {
    clear: 0,
    partly_cloudy: 0,
    overcast: 0,
    rain: 0,
    snow: 0,
    fog: 0,
    wind: 0,
    unknown: 0,
  };

  reports.forEach((report) => {
    if (report.condition) {
      conditionBreakdown[report.condition]++;
    } else {
      conditionBreakdown.unknown++;
    }
  });

  // Temperature statistics
  const reportsWithTemp = reports.filter(
    (r) => r.temperatureHigh !== undefined && r.temperatureLow !== undefined
  );
  const averageTemperatureHigh =
    reportsWithTemp.reduce((sum, r) => sum + (r.temperatureHigh || 0), 0) /
      (reportsWithTemp.length || 1);
  const averageTemperatureLow =
    reportsWithTemp.reduce((sum, r) => sum + (r.temperatureLow || 0), 0) /
      (reportsWithTemp.length || 1);

  // Precipitation statistics
  const reportsWithPrecip = reports.filter((r) => r.precipitation !== undefined);
  const totalPrecipitation = reportsWithPrecip.reduce(
    (sum, r) => sum + (r.precipitation || 0),
    0
  );
  const daysWithPrecipitation = reports.filter(
    (r) => (r.precipitation || 0) > 0
  ).length;

  // Workability analysis
  const workableDays = reports.filter((r) => isWorkableDay(r)).length;
  const impactedDays = totalDays - workableDays;
  const workableDaysPercentage = (workableDays / totalDays) * 100;

  // Productivity impact
  const clearDays = reports.filter(
    (r) => r.condition === 'clear' || r.condition === 'partly_cloudy'
  );
  const rainyDays = reports.filter((r) => r.condition === 'rain' || r.condition === 'snow');

  const averageCrewOnClearDays =
    clearDays.reduce((sum, r) => sum + (r.totalCrewCount || 0), 0) /
    (clearDays.length || 1);
  const averageCrewOnRainyDays =
    rainyDays.reduce((sum, r) => sum + (r.totalCrewCount || 0), 0) /
    (rainyDays.length || 1);

  const productivityImpactPercentage =
    ((averageCrewOnClearDays - averageCrewOnRainyDays) / averageCrewOnClearDays) *
    100;

  // Extreme weather
  const extremeHeatDays = reports.filter((r) => (r.temperatureHigh || 0) > 95).length;
  const extremeColdDays = reports.filter((r) => (r.temperatureLow || 0) < 32).length;
  const highWindDays = reports.filter((r) => (r.windSpeed || 0) > 25).length;
  const heavyRainDays = reports.filter((r) => (r.precipitation || 0) > 0.5).length;

  return {
    totalDays,
    workableDays,
    impactedDays,
    workableDaysPercentage,
    conditionBreakdown,
    averageTemperatureHigh,
    averageTemperatureLow,
    totalPrecipitation,
    daysWithPrecipitation,
    averageCrewOnClearDays,
    averageCrewOnRainyDays,
    productivityImpactPercentage: Math.max(0, productivityImpactPercentage),
    extremeHeatDays,
    extremeColdDays,
    highWindDays,
    heavyRainDays,
  };
}

/**
 * Determine if a day was workable based on weather conditions
 */
function isWorkableDay(data: WeatherData): boolean {
  // Heavy rain/snow makes day unworkable
  if ((data.precipitation || 0) > 0.5) {
    return false;
  }

  // Extreme temperatures make day challenging
  if ((data.temperatureHigh || 0) > 105 || (data.temperatureLow || 0) < 15) {
    return false;
  }

  // High winds make day dangerous
  if ((data.windSpeed || 0) > 35) {
    return false;
  }

  return true;
}

/**
 * Get weather impact severity for a specific day
 */
export function getWeatherImpactSeverity(data: WeatherData): {
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
} {
  const reasons: string[] = [];
  let severity: 'none' | 'low' | 'medium' | 'high' | 'critical' = 'none';

  // Check precipitation
  const precip = data.precipitation || 0;
  if (precip > 1.0) {
    reasons.push('Heavy precipitation (>1")');
    severity = 'critical';
  } else if (precip > 0.5) {
    reasons.push('Moderate precipitation (>0.5")');
    severity = severity === 'critical' ? severity : 'high';
  } else if (precip > 0.1) {
    reasons.push('Light precipitation');
    severity = severity === 'none' ? 'low' : severity;
  }

  // Check temperature
  const tempHigh = data.temperatureHigh || 70;
  const tempLow = data.temperatureLow || 50;

  if (tempHigh > 105) {
    reasons.push('Extreme heat (>105°F)');
    severity = 'critical';
  } else if (tempHigh > 95) {
    reasons.push('Very hot (>95°F)');
    severity = severity === 'critical' ? severity : 'high';
  }

  if (tempLow < 15) {
    reasons.push('Extreme cold (<15°F)');
    severity = 'critical';
  } else if (tempLow < 32) {
    reasons.push('Freezing temperatures');
    severity = severity === 'critical' ? severity : 'medium';
  }

  // Check wind
  const wind = data.windSpeed || 0;
  if (wind > 35) {
    reasons.push('Dangerous winds (>35 mph)');
    severity = 'critical';
  } else if (wind > 25) {
    reasons.push('High winds (>25 mph)');
    severity = severity === 'critical' ? severity : 'high';
  } else if (wind > 15) {
    reasons.push('Moderate winds');
    severity = severity === 'none' || severity === 'low' ? 'low' : severity;
  }

  return { severity, reasons };
}

/**
 * Get monthly weather summary
 */
export function getMonthlyWeatherSummary(reports: ProductivityData[]): {
  month: string;
  analytics: WeatherAnalytics;
}[] {
  // Group reports by month
  const reportsByMonth = new Map<string, ProductivityData[]>();

  reports.forEach((report) => {
    const month = new Date(report.date).toISOString().substring(0, 7); // YYYY-MM
    if (!reportsByMonth.has(month)) {
      reportsByMonth.set(month, []);
    }
    reportsByMonth.get(month)!.push(report);
  });

  // Analyze each month
  const monthlySummaries = Array.from(reportsByMonth.entries())
    .map(([month, monthReports]) => ({
      month,
      analytics: analyzeWeatherPatterns(monthReports),
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return monthlySummaries;
}

function getEmptyAnalytics(): WeatherAnalytics {
  return {
    totalDays: 0,
    workableDays: 0,
    impactedDays: 0,
    workableDaysPercentage: 0,
    conditionBreakdown: {
      clear: 0,
      partly_cloudy: 0,
      overcast: 0,
      rain: 0,
      snow: 0,
      fog: 0,
      wind: 0,
      unknown: 0,
    },
    averageTemperatureHigh: 0,
    averageTemperatureLow: 0,
    totalPrecipitation: 0,
    daysWithPrecipitation: 0,
    averageCrewOnClearDays: 0,
    averageCrewOnRainyDays: 0,
    productivityImpactPercentage: 0,
    extremeHeatDays: 0,
    extremeColdDays: 0,
    highWindDays: 0,
    heavyRainDays: 0,
  };
}
