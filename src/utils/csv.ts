export function downloadCSV(data, columns, filename) {
  const headers = columns.map(c => c.label).join(',');
  const rows = data.map(row =>
    columns.map(col => {
      let val = col.render ? col.render(row) : row[col.key];
      if (val === null || val === undefined) val = '';
      val = String(val).replace(/,/g, ' ').replace(/"/g, '""');
      return `"${val}"`;
    }).join(',')
  );
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
