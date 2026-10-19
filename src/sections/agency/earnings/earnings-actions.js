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

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
    [title],
    ['Period', periodLabel || ''],
    [],
    ['Summary'],
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
            Number(worker.amount || 0).toFixed(2),
            Number(worker.share || 0).toFixed(1),
          ]),
        ]
      : []),
    [],
    ['Completed shifts'],
    columns.map((column) => column.label),
    ...rows.map((row) => columns.map((column) => column.value(row))),
  ];

  const csv = lines.map((line) => line.map(csvCell).join(',')).join('\n');
  downloadTextFile(csv, filename);
}

/**
 * Opens a clean print window with summary + table so layout chrome / charts
 * do not blank out the report.
 */
export function printEarningsReport({
  title = 'Earnings',
  periodLabel = '',
  summaryRows = [],
  topWorkers = [],
  columns = [],
  rows = [],
} = {}) {
  const hasStructured =
    summaryRows.length || columns.length || rows.length || topWorkers.length;

  if (!hasStructured) {
    window.print();
    return;
  }

  const summaryHtml = summaryRows.length
    ? `<table class="summary">
        <thead><tr><th colspan="2">Summary</th></tr></thead>
        <tbody>
          ${summaryRows
            .map(
              ([label, value]) =>
                `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`
            )
            .join('')}
        </tbody>
      </table>`
    : '';

  const workersHtml = topWorkers.length
    ? `<h2>Staff who earned the most</h2>
      <table>
        <thead>
          <tr>
            <th>Rank</th><th>Name</th><th>Role</th><th>Shifts</th><th>Hours</th><th>Amount (£)</th><th>Share %</th>
          </tr>
        </thead>
        <tbody>
          ${topWorkers
            .map(
              (worker) => `<tr>
                <td>${escapeHtml(worker.rank)}</td>
                <td>${escapeHtml(worker.name)}</td>
                <td>${escapeHtml(worker.jobRole)}</td>
                <td>${escapeHtml(worker.bookings)}</td>
                <td>${escapeHtml(worker.hours)}</td>
                <td>${escapeHtml(Number(worker.amount || 0).toFixed(2))}</td>
                <td>${escapeHtml(Number(worker.share || 0).toFixed(1))}</td>
              </tr>`
            )
            .join('')}
        </tbody>
      </table>`
    : '';

  const tableHtml = columns.length
    ? `<h2>Completed shifts${rows.length ? ` (${rows.length})` : ''}</h2>
      ${
        rows.length
          ? `<table>
              <thead>
                <tr>${columns.map((col) => `<th>${escapeHtml(col.label)}</th>`).join('')}</tr>
              </thead>
              <tbody>
                ${rows
                  .map(
                    (row) =>
                      `<tr>${columns
                        .map((col) => `<td>${escapeHtml(col.value(row))}</td>`)
                        .join('')}</tr>`
                  )
                  .join('')}
              </tbody>
            </table>`
          : '<p class="empty">No completed shifts in this period.</p>'
      }`
    : '';

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)} report</title>
    <style>
      * { box-sizing: border-box; }
      body {
        font-family: "Public Sans", Arial, Helvetica, sans-serif;
        color: #1c252e;
        margin: 24px;
        font-size: 12px;
        line-height: 1.45;
      }
      h1 { font-size: 20px; margin: 0 0 4px; }
      .period { color: #637381; margin: 0 0 20px; }
      h2 { font-size: 14px; margin: 24px 0 8px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
      th, td { border: 1px solid #dfe3e8; padding: 8px 10px; text-align: left; vertical-align: top; }
      th { background: #f4f6f8; font-weight: 700; }
      table.summary td:last-child { text-align: right; font-variant-numeric: tabular-nums; }
      .empty { color: #637381; }
      @media print {
        body { margin: 12px; }
        h2 { break-after: avoid; }
        tr { break-inside: avoid; }
      }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(title)}</h1>
    ${periodLabel ? `<p class="period">${escapeHtml(periodLabel)}</p>` : ''}
    ${summaryHtml}
    ${workersHtml}
    ${tableHtml}
  </body>
</html>`;

  const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=960,height=720');
  if (!printWindow) {
    window.print();
    return;
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  const triggerPrint = () => {
    try {
      printWindow.print();
    } catch {
      // ignore
    }
  };

  if (printWindow.document.readyState === 'complete') {
    setTimeout(triggerPrint, 100);
  } else {
    printWindow.onload = () => setTimeout(triggerPrint, 100);
  }
}
