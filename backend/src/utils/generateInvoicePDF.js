const PDFDocument = require('pdfkit');

/**
 * generateInvoicePDF
 * Generates a styled invoice PDF in memory and returns a Buffer.
 *
 * @param {Object} opts
 * @param {Object} opts.booking     - Booking document (populated)
 * @param {Object} opts.property    - Property document
 * @param {Object} opts.company     - Company document
 * @param {Object} opts.customer    - User (customer) document
 * @returns {Promise<Buffer>}
 */
const generateInvoicePDF = ({ booking, property, company, customer }) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const PRIMARY   = '#4f52e6';
    const DARK      = '#1a1a2e';
    const LIGHT_BG  = '#f8f9ff';
    const TEXT_DARK = '#1e293b';
    const TEXT_GRAY = '#64748b';
    const ACCENT    = '#fb923c';
    const SUCCESS   = '#16a34a';

    const fmt = (n) => `BDT ${Number(n || 0).toLocaleString('en-BD')}`;
    const W   = 595 - 100; // usable width (A4 595pt minus margins)

    // ── Header Band ─────────────────────────────────────────────────────────
    doc.rect(0, 0, 595, 100).fill(DARK);

    doc.fillColor('#ffffff')
       .fontSize(28).font('Helvetica-Bold')
       .text('FlatSell', 50, 30);

    doc.fillColor(ACCENT)
       .fontSize(10).font('Helvetica')
       .text('Real Estate Marketplace', 50, 60);

    doc.fillColor('rgba(255,255,255,0.6)')
       .fontSize(9)
       .text('House No. 2, Road No. 11, Block F, Banani, Dhaka-1213', 50, 76);

    // Invoice label (top right)
    doc.fillColor('#ffffff')
       .fontSize(22).font('Helvetica-Bold')
       .text('INVOICE', 400, 32, { align: 'right', width: 145 });

    doc.fillColor('rgba(255,255,255,0.6)')
       .fontSize(9).font('Helvetica')
       .text(`Invoice #: ${booking._id.toString().slice(-8).toUpperCase()}`, 400, 60, { align: 'right', width: 145 })
       .text(`Date: ${new Date().toLocaleDateString('en-BD', { year: 'numeric', month: 'long', day: 'numeric' })}`, 400, 74, { align: 'right', width: 145 });

    // ── Bill To / From Section ───────────────────────────────────────────────
    doc.fillColor(TEXT_DARK);
    const topY = 120;

    // Left: Billed To
    doc.rect(50, topY, (W / 2) - 10, 90).fill(LIGHT_BG).stroke('#e2e8f0');
    doc.fillColor(TEXT_GRAY).fontSize(8).font('Helvetica-Bold')
       .text('BILLED TO', 62, topY + 10, { characterSpacing: 1 });
    doc.fillColor(TEXT_DARK).fontSize(12).font('Helvetica-Bold')
       .text(customer?.name || 'Customer', 62, topY + 24);
    doc.fillColor(TEXT_GRAY).fontSize(9).font('Helvetica')
       .text(customer?.email || '', 62, topY + 40)
       .text(customer?.phone || 'N/A', 62, topY + 54);

    // Right: Vendor
    const rX = 50 + (W / 2) + 10;
    doc.rect(rX, topY, (W / 2) - 10, 90).fill(LIGHT_BG).stroke('#e2e8f0');
    doc.fillColor(TEXT_GRAY).fontSize(8).font('Helvetica-Bold')
       .text('VENDOR (COMPANY)', rX + 12, topY + 10, { characterSpacing: 1 });
    doc.fillColor(TEXT_DARK).fontSize(12).font('Helvetica-Bold')
       .text(company?.name || 'Company', rX + 12, topY + 24);
    doc.fillColor(TEXT_GRAY).fontSize(9).font('Helvetica')
       .text(company?.email || '', rX + 12, topY + 40)
       .text(company?.phone || 'N/A', rX + 12, topY + 54);

    // ── Property Details Section ─────────────────────────────────────────────
    const secY = topY + 110;
    doc.fillColor(PRIMARY).fontSize(12).font('Helvetica-Bold')
       .text('Property Details', 50, secY);
    doc.moveTo(50, secY + 16).lineTo(545, secY + 16).strokeColor('#e2e8f0').lineWidth(1).stroke();

    const rows1 = [
      ['Property Title',  property?.title || '—'],
      ['Category',        (property?.category || '—').toUpperCase()],
      ['Location',        property?.city || property?.address || '—'],
    ];
    rows1.forEach(([label, value], i) => {
      const y = secY + 24 + i * 22;
      doc.fillColor(TEXT_GRAY).fontSize(9).font('Helvetica').text(label, 50, y);
      doc.fillColor(TEXT_DARK).fontSize(9).font('Helvetica-Bold').text(value, 220, y);
    });

    // ── Financial Summary Table ──────────────────────────────────────────────
    const tY = secY + 110;
    doc.fillColor(PRIMARY).fontSize(12).font('Helvetica-Bold')
       .text('Payment Summary', 50, tY);
    doc.moveTo(50, tY + 16).lineTo(545, tY + 16).strokeColor('#e2e8f0').lineWidth(1).stroke();

    // Table header
    const hY = tY + 24;
    doc.rect(50, hY, W, 22).fill(PRIMARY);
    doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold')
       .text('Description',          62,  hY + 6)
       .text('Amount',               400, hY + 6, { width: 95, align: 'right' });

    // Table rows
    const dueAmount   = (booking.totalPrice || 0) - (booking.bookingAmount || 0);
    const tableRows   = [
      ['Total Property Price',       fmt(booking.totalPrice)],
      [`Booking Money (${booking.bookingMoneyPercentage || 20}% paid)`, fmt(booking.bookingAmount)],
      ['Remaining Due Amount',       fmt(dueAmount)],
    ];

    tableRows.forEach(([desc, amt], i) => {
      const ry = hY + 22 + i * 24;
      const fill = i % 2 === 0 ? '#ffffff' : LIGHT_BG;
      doc.rect(50, ry, W, 24).fill(fill).stroke('#e2e8f0');
      doc.fillColor(TEXT_DARK).fontSize(9).font('Helvetica')
         .text(desc, 62, ry + 7);
      doc.fillColor(TEXT_DARK).fontSize(9).font('Helvetica-Bold')
         .text(amt, 400, ry + 7, { width: 95, align: 'right' });
    });

    // Total paid row
    const tPaidY = hY + 22 + tableRows.length * 24;
    const paid   = booking.paymentStatus === 'fully_paid'
      ? booking.totalPrice
      : booking.bookingAmount;
    const paidLabel = booking.paymentStatus === 'fully_paid' ? 'TOTAL PAID' : 'BOOKING FEE PAID';

    doc.rect(50, tPaidY, W, 28).fill(SUCCESS);
    doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold')
       .text(paidLabel, 62, tPaidY + 8)
       .text(fmt(paid), 400, tPaidY + 8, { width: 95, align: 'right' });

    // ── Status Badge ─────────────────────────────────────────────────────────
    const badgeY = tPaidY + 50;
    const statusColors = {
      fully_paid:   [SUCCESS, 'FULLY PAID'],
      booking_paid: ['#2563eb', 'BOOKING PAID'],
      unpaid:       ['#d97706', 'PENDING'],
    };
    const [badgeColor, badgeLabel] = statusColors[booking.paymentStatus] || statusColors.unpaid;
    doc.roundedRect(50, badgeY, 120, 24, 4).fill(badgeColor);
    doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold')
       .text(badgeLabel, 50, badgeY + 7, { width: 120, align: 'center' });

    // ── Footer ──────────────────────────────────────────────────────────────
    const footY = 750;
    doc.moveTo(50, footY).lineTo(545, footY).strokeColor('#e2e8f0').lineWidth(1).stroke();
    doc.fillColor(TEXT_GRAY).fontSize(8).font('Helvetica')
       .text('Thank you for choosing FlatSell. For queries, contact us at support@flatsell.com', 50, footY + 10, { align: 'center', width: W })
       .text('01611-652333  |  House No. 2, Road No. 11, Block F, Banani, Dhaka-1213', 50, footY + 22, { align: 'center', width: W });

    doc.fillColor(TEXT_GRAY).fontSize(7)
       .text(`© ${new Date().getFullYear()} FlatSell. All Rights Reserved.`, 50, footY + 36, { align: 'center', width: W });

    doc.end();
  });
};

module.exports = generateInvoicePDF;
