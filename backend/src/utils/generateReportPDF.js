const PDFDocument = require('pdfkit');

/**
 * generateReportPDF
 * Builds a generic tabular PDF report in memory and returns a Buffer.
 *
 * @param {Object}   opts
 * @param {string}   opts.title        - Report title
 * @param {string}   opts.subtitle     - Company name or scope label
 * @param {string}   opts.dateRange    - Human-readable date range string
 * @param {string[]} opts.columns      - Column header labels
 * @param {number[]} opts.colWidths    - Width for each column (must sum to 495)
 * @param {Array[]}  opts.rows         - 2D array of cell values
 * @param {Object[]} opts.summaryRows  - [{ label, value }] shown at the bottom
 * @param {Object[]} opts.summaryBox   - [{ label, value }] 3-metric card row below the title
 * @returns {Promise<Buffer>}
 */
const generateReportPDF = ({
  title,
  subtitle,
  dateRange,
  columns,
  colWidths,
  rows,
  summaryRows = [],
  summaryBox  = [],
}) => {
  return new Promise((resolve, reject) => {
    const doc     = new PDFDocument({ margin: 50, size: 'A4' });
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
    const W         = 495; // A4 (595) - 2 × 50 margin

    // ── Page Header ───────────────────────────────────────────────────────────
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

    // ── Report Title Block ────────────────────────────────────────────────────
    const tY = 108;
    doc.fillColor(TEXT_DARK).fontSize(18).font('Helvetica-Bold').text(title, 50, tY);

    doc.fillColor(TEXT_GRAY).fontSize(10).font('Helvetica');
    if (subtitle)   doc.text(subtitle,              50, tY + 24);
    if (dateRange)  doc.text(`Period: ${dateRange}`, 50, tY + (subtitle ? 38 : 24));

    doc.fillColor(TEXT_GRAY).fontSize(8)
       .text(
         `Generated: ${new Date().toLocaleString('en-BD')}`,
         50, tY + 54,
         { align: 'right', width: W }
       );

    doc.moveTo(50, tY + 68).lineTo(545, tY + 68)
       .strokeColor('#e2e8f0').lineWidth(1).stroke();

    // ── Summary Metric Cards ──────────────────────────────────────────────────
    let tableY = tY + 80;

    if (summaryBox.length > 0) {
      const BOX_COLORS  = ['#eef2ff', '#f0fdf4', '#fff7ed'];
      const ACCENT_BARS = ['#4f52e6', '#16a34a', '#d97706'];
      const VAL_COLORS  = ['#4f52e6', '#16a34a', '#d97706'];
      const boxStartY   = tY + 78;
      const boxH        = 60;
      const n           = summaryBox.length;

      summaryBox.forEach(({ label, value }, i) => {
        const boxW   = Math.floor(W / n);
        const bx     = 50 + i * boxW;
        // Last card absorbs any rounding remainder
        const actualW = i === n - 1 ? W - i * boxW : boxW;

        doc.rect(bx, boxStartY, actualW, boxH).fill(BOX_COLORS[i % BOX_COLORS.length]);
        doc.rect(bx, boxStartY, 3, boxH).fill(ACCENT_BARS[i % ACCENT_BARS.length]);

        doc.fillColor(TEXT_GRAY).fontSize(7.5).font('Helvetica')
           .text(label, bx + 10, boxStartY + 10, { width: actualW - 14 });

        doc.fillColor(VAL_COLORS[i % VAL_COLORS.length]).fontSize(14).font('Helvetica-Bold')
           .text(String(value), bx + 10, boxStartY + 28, { width: actualW - 14 });
      });

      tableY = boxStartY + boxH + 18;
    }

    // ── Table Header Row ──────────────────────────────────────────────────────
    doc.rect(50, tableY, W, 22).fill(PRIMARY);

    let xCursor = 50;
    columns.forEach((col, i) => {
      doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold')
         .text(col, xCursor + 4, tableY + 6, { width: colWidths[i] - 4, ellipsis: true });
      xCursor += colWidths[i];
    });
    tableY += 22;

    // ── Data Rows ─────────────────────────────────────────────────────────────
    if (rows.length === 0) {
      doc.rect(50, tableY, W, 30).fill(LIGHT_BG).stroke('#e2e8f0');
      doc.fillColor(TEXT_GRAY).fontSize(9).font('Helvetica')
         .text('No data available for the selected period.', 50, tableY + 10, {
           align: 'center', width: W,
         });
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

        if (tableY > 720) {
          doc.addPage();
          tableY = 50;
        }
      });
    }

    // ── Summary Footer ────────────────────────────────────────────────────────
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
    doc.fillColor(TEXT_GRAY).fontSize(7).font('Helvetica')
       .text(
         `© ${new Date().getFullYear()} FlatSell. Confidential Report. All Rights Reserved.`,
         50, 790,
         { align: 'center', width: W }
       );

    doc.end();
  });
};

module.exports = generateReportPDF;
