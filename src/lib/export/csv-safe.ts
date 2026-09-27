/**
 * Quote a CSV cell and neutralize spreadsheet formula injection:
 * values starting with = + - @ tab or CR get a leading apostrophe.
 */
export function csvCell(value: unknown): string {
  let s = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export function csvRow(cells: unknown[]): string {
  return cells.map(csvCell).join(',');
}
