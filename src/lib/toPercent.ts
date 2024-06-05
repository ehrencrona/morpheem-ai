export const toPercent = (n: number | null) => (n != null ? Math.round(n * 100) + '%' : '-');
