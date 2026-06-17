function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportPDF(title, sections) {
  const styles = `
    @page { margin: 15mm; size: A4; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; padding: 20px; line-height: 1.5; }
    h1 { font-size: 22px; margin: 0 0 4px 0; color: #111827; }
    .subtitle { font-size: 13px; color: #6b7280; margin-bottom: 24px; }
    h2 { font-size: 16px; margin: 24px 0 12px 0; color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; }
    .stats { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
    .stat { background: #f3f4f6; padding: 12px 18px; border-radius: 8px; flex: 1; min-width: 140px; }
    .stat-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .stat-value { font-size: 20px; font-weight: 700; color: #111827; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 12px; }
    th { background: #f3f4f6; text-align: left; padding: 8px 10px; font-weight: 600; color: #374151; border-bottom: 2px solid #d1d5db; font-size: 11px; text-transform: uppercase; letter-spacing: 0.3px; }
    td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; color: #4b5563; }
    tr:hover td { background: #f9fafb; }
    .footer { margin-top: 30px; font-size: 11px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 12px; }
    .page-break { page-break-before: always; }
  `;

  let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>${styles}</style></head><body>`;
  html += `<h1>${title}</h1>`;
  html += `<p class="subtitle">Generated: ${new Date().toLocaleString()} | FleetOps Manager</p>`;

  sections.forEach(section => {
    if (section.type === 'stats') {
      html += '<div class="stats">';
      section.items.forEach(item => {
        html += `<div class="stat"><div class="stat-label">${item.label}</div><div class="stat-value">${item.value}</div></div>`;
      });
      html += '</div>';
    } else if (section.type === 'table') {
      html += `<h2>${section.title}</h2>`;
      if (section.rows.length === 0) {
        html += '<p style="color: #9ca3af; font-style: italic;">No data available</p>';
      } else {
        html += '<table><thead><tr>';
        section.columns.forEach(col => { html += `<th>${col}</th>`; });
        html += '</tr></thead><tbody>';
        section.rows.forEach(row => {
          html += '<tr>';
          section.columns.forEach((_, i) => {
            html += `<td>${row[i] !== undefined && row[i] !== null ? row[i] : '—'}</td>`;
          });
          html += '</tr>';
        });
        html += '</tbody></table>';
      }
    }
  });

  html += `<div class="footer">FleetOps Manager — ${title} — Page 1 of 1</div>`;
  html += '</body></html>';

  const w = window.open('', '_blank', 'width=900,height=700,scrollbars=yes');
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 500);
}

export function exportExcel(title, sections) {
  let xls = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
  xls += '<head><meta charset="UTF-8"><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Report</x:Name></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml>';
  xls += `<style>td,th{padding:6px 10px;border:1px solid #ccc;font-family:Calibri,Arial,sans-serif;font-size:11pt}th{background:#f0f0f0;font-weight:700}table{border-collapse:collapse}</style></head><body>`;
  xls += `<h2>${title}</h2>`;
  xls += `<p>Generated: ${new Date().toLocaleString()}</p>`;

  sections.forEach(section => {
    if (section.type === 'stats') {
      xls += '<table>';
      for (let i = 0; i < section.items.length; i += 2) {
        xls += '<tr>';
        const item = section.items[i];
        xls += `<td style="font-weight:700;background:#f9fafb">${item.label}</td><td>${item.value}</td>`;
        if (i + 1 < section.items.length) {
          const next = section.items[i + 1];
          xls += `<td style="font-weight:700;background:#f9fafb">${next.label}</td><td>${next.value}</td>`;
        } else {
          xls += '<td></td><td></td>';
        }
        xls += '</tr>';
      }
      xls += '</table><br/>';
    } else if (section.type === 'table') {
      xls += `<h3>${section.title}</h3>`;
      if (section.rows.length === 0) {
        xls += '<p>No data available</p>';
      } else {
        xls += '<table><thead><tr>';
        section.columns.forEach(col => { xls += `<th>${col}</th>`; });
        xls += '</tr></thead><tbody>';
        section.rows.forEach(row => {
          xls += '<tr>';
          section.columns.forEach((_, i) => {
            xls += `<td>${row[i] !== undefined && row[i] !== null ? row[i] : '—'}</td>`;
          });
          xls += '</tr>';
        });
        xls += '</tbody></table>';
      }
      xls += '<br/>';
    }
  });

  xls += '</body></html>';
  downloadBlob(xls, `${title.replace(/\s+/g, '_')}.xls`, 'application/vnd.ms-excel');
}
