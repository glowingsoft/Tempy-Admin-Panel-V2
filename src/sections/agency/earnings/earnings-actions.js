function csvCell(value) {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadTextFile(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * CSV of the Earnings screen: summary rows, top workers (if any), then the history rows.
 * `columns`: [{ label, value: (row) => cell }].
 */
export function exportEarningsReport({
  title = 'Earnings',
  periodLabel,
  summaryRows = [],
  topWorkers = [],
  columns = [],
  rows = [],
  filename = 'earnings-report.csv',
}) {
  const lines = [
    ['Summary'],
    ['Period', periodLabel],
    ...summaryRows,
    ...(topWorkers.length
      ? [
          [],
          ['Staff who earned the most'],
          ['Rank', 'Name', 'Role', 'Shifts', 'Hours', 'Amount (£)', 'Share %'],
          ...topWorkers.map((worker) => [
            worker.rank,
            worker.name,
            worker.jobRole,
            worker.bookings,
            worker.hours,
            Number(worker.amount).toFixed(2),
            Number(worker.share).toFixed(1),
          ]),
        ]
      : []),
    [],
    [title],
    columns.map((column) => column.label),
    ...rows.map((row) => columns.map((column) => column.value(row))),
  ];

  const csv = lines.map((line) => line.map(csvCell).join(',')).join('\n');
  downloadTextFile(csv, filename);
}

export function printEarningsReport() {
  window.print();
}
