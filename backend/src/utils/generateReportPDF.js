const PDFDocument = require('pdfkit');

/**
 * generateReportPDF
 * Builds a generic tabular PDF report in memory and returns a Buffer.
 *
 * @param {Object} opts
 * @param {string} opts.title         - Report title (e.g. "Sales Report")
 * @param {string} opts.subtitle      - e.g. company name or "Platform-Wide"
 * @param {string} opts.dateRange     - e.g. "01 Jan 2025 – 31 Jan 2025"
 * @param {string[]} opts.columns     - Column header labels
 * @param {number[]} opts.colWidths   - Width for each column in pts
 * @param {string[][]} opts.rows      - 2D array of cell values
 * @param {Object[]} opts.summaryRows - [{ label, value }] summary shown at bottom
 * @returns {Promise<Buffer>}
 */
const generateReportPDF = ({ title, subtitle, dateRange, columns, colWidths, rows, summaryRows = [] }) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers = [];

    doc.on('data',  (chunk) => buffers.push(chunk));
    doc.on('end',   () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const PRIMARY   = '#4f52e6';
    const DARK      = '#1a1a2e';
    const ACCENT    = '#fb923c';
    const TEXT_DARK = '#1e293b';
    const TEXT_GRAY = '#64748b';
    const LIGHT_BG  = '#f8f9ff';
    const SUCCESS   = '#16a34a';
    const W         = 495; // A4 595 - 2*50 margin

    // ── Header ────────────────────────────────────────────────────────────────
    doc.rect(0, 0, 595, 90).fill(DARK);

    doc.fillColor('#ffffff')
       .fontSize(26).font('Helvetica-Bold')
       .text('FlatSell', 50, 24);

    doc.fillColor(ACCENT)
       .fontSize(9).font('Helvetica')
       .text('Real Estate Marketplace', 50, 52);

    doc.fillColor('rgba(255,255,255,0.5)')
       .fontSize(8)
       .text('01611-652333  |  House No. 2, Road No. 11, Block F, Banani, Dhaka-1213', 50, 66);

    // ── Title Block ───────────────────────────────────────────────────────────
    const tY = 108;
    doc.fillColor(TEXT_DARK).fontSize(18).font('Helvetica-Bold').text(title, 50, tY);

    doc.fillColor(TEXT_GRAY).fontSize(10).font('Helvetica');
    if (subtitle)   doc.text(subtitle, 50, tY + 24);
    if (dateRange)  doc.text(`Period: ${dateRange}`, 50, tY + (subtitle ? 38 : 24));

    doc.fillColor(TEXT_GRAY).fontSize(8)
       .text(`Generated: ${new Date().toLocaleString('en-BD')}`, 50, tY + 54, { align: 'right', width: W });

    doc.moveTo(50, tY + 68).lineTo(545, tY + 68).strokeColor('#e2e8f0').lineWidth(1).stroke();

    // ── Table ─────────────────────────────────────────────────────────────────
    let tableY = tY + 80;

    // Header row
    doc.rect(50, tableY, W, 22).fill(PRIMARY);
    let xCursor = 50;
    columns.forEach((col, i) => {
      doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold')
         .text(col, xCursor + 4, tableY + 6, { width: colWidths[i] - 4, ellipsis: true });
      xCursor += colWidths[i];
    });

    tableY += 22;

    // Data rows
    if (rows.length === 0) {
      doc.rect(50, tableY, W, 30).fill(LIGHT_BG).stroke('#e2e8f0');
      doc.fillColor(TEXT_GRAY).fontSize(9).font('Helvetica')
         .text('No data available for the selected period.', 50, tableY + 10, { align: 'center', width: W });
      tableY += 30;
    } else {
      rows.forEach((row, rowIdx) => {
        const rowH = 22;
        const fill = rowIdx % 2 === 0 ? '#ffffff' : LIGHT_BG;
        doc.rect(50, tableY, W, rowH).fill(fill).stroke('#e2e8f0');

        xCursor = 50;
        row.forEach((cell, colIdx) => {
          doc.fillColor(TEXT_DARK).fontSize(8).font('Helvetica')
             .text(String(cell ?? '—'), xCursor + 4, tableY + 6, {
               width: colWidths[colIdx] - 8,
               ellipsis: true,
               lineBreak: false,
             });
          xCursor += colWidths[colIdx];
        });

        tableY += rowH;

        // Page break guard
        if (tableY > 720) {
          doc.addPage();
          tableY = 50;
        }
      });
    }

    // ── Summary Footer ─────────────────────────────────────────────────────────
    if (summaryRows.length > 0) {
      tableY += 16;
      doc.moveTo(50, tableY).lineTo(545, tableY).strokeColor('#e2e8f0').stroke();
      tableY += 10;

      summaryRows.forEach(({ label, value }) => {
        doc.rect(350, tableY, W - 300, 24).fill(PRIMARY);
        doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold')
           .text(label, 358, tableY + 7)
           .text(String(value), 460, tableY + 7, { align: 'right', width: 77 });
        tableY += 26;
      });
    }

    // ── Page Footer ───────────────────────────────────────────────────────────
    const footY = 790;
    doc.fillColor(TEXT_GRAY).fontSize(7).font('Helvetica')
       .text(`© ${new Date().getFullYear()} FlatSell. Confidential Report. All Rights Reserved.`,
         50, footY, { align: 'center', width: W });

    doc.end();
  });
};

module.exports = generateReportPDF;
