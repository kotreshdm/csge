export type FinancialPeriodMode = 'financialYear' | 'custom';

export type FinancialPeriod = {
  mode: FinancialPeriodMode;
  financialYear: string;
  fromDate: string;
  toDate: string;
};

export function getCurrentFinancialYear() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const yearStart = today.getMonth() >= 3 ? currentYear : currentYear - 1;
  return `${yearStart}-${yearStart + 1}`;
}

export function getFinancialYearRange(value: string) {
  const startYear = Number(value.slice(0, 4));
  return {
    fromDate: `${startYear}-04-01`,
    toDate: `${startYear + 1}-03-31`,
  };
}

export function createDefaultPeriod(): FinancialPeriod {
  const financialYear = getCurrentFinancialYear();
  const range = getFinancialYearRange(financialYear);
  return {
    mode: 'financialYear',
    financialYear,
    fromDate: range.fromDate,
    toDate: range.toDate,
  };
}

export function getPeriodParams(period: FinancialPeriod) {
  if (period.mode === 'financialYear') {
    return { financialYear: period.financialYear };
  }

  return {
    fromDate: period.fromDate,
    toDate: period.toDate,
  };
}

export function formatPeriodLabel(period: FinancialPeriod) {
  if (period.mode === 'financialYear') {
    return `FY ${period.financialYear}`;
  }

  return `${period.fromDate} → ${period.toDate}`;
}
