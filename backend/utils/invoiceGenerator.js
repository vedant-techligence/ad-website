const puppeteer = require("puppeteer");

/**
 * Formats a number as Indian Rupees.
 * e.g. 28000 → "₹28,000.00"
 */
const formatINR = (paise) =>
  `Rs. ${((paise || 0) / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/**
 * Formats a date string as "20 Jun 2026"
 */
const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

/**
 * Generates a PDF invoice buffer from a populated Payment document.
 * @param {Object} payment - mongoose Payment doc with campaign and advertiser populated
 * @returns {Promise<Buffer>} - PDF as a buffer
 */
const generateInvoicePDF = async (payment) => {
  const html = generateInvoiceHTML(payment);

  const browser = await puppeteer.launch({
    headless: true,
    executablePath:
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });

  try {
    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "15mm",
        right: "15mm",
        bottom: "15mm",
        left: "15mm",
      },
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
};

/**
 * Generates an HTML invoice string from a populated Payment document.
 * Designed to look clean in a browser and print correctly.
 */
const generateInvoiceHTML = (payment) => {
  const { breakdown = {}, campaign = {}, advertiser = {} } = payment;
  const subtotalPaise =
    payment.amount - Math.round((breakdown.gstAmount || 0) * 100);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice ${payment.invoiceNumber || ""}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f0f4f8; color: #111; padding: 2rem; }
    .sheet { background: #fff; max-width: 760px; margin: 0 auto; padding: 3rem; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
    .brand { color: #0055CC; font-size: 1.3rem; font-weight: 700; letter-spacing: 0.06em; }
    .brand-sub { color: #888; font-size: 0.85rem; margin-top: 0.25rem; }
    .invoice-title { text-align: right; }
    .invoice-title h1 { font-size: 1.5rem; color: #111; }
    .invoice-title p { color: #888; font-size: 0.85rem; margin-top: 0.25rem; }
    hr { border: none; border-top: 1px solid #eee; margin: 1.5rem 0; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 1.5rem; }
    .section-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.12em; color: #888; font-weight: 700; margin-bottom: 0.5rem; }
    .section-value { font-size: 1rem; font-weight: 600; color: #111; margin-bottom: 0.2rem; }
    .section-sub { font-size: 0.88rem; color: #555; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; }
    thead th { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.1em; color: #888; font-weight: 700; padding: 0.5rem 0; border-bottom: 2px solid #eee; text-align: left; }
    thead th:last-child { text-align: right; }
    tbody td { padding: 0.75rem 0; border-bottom: 1px solid #f5f5f5; font-size: 0.95rem; color: #333; }
    tbody td:last-child { text-align: right; font-weight: 500; }
    .total-row td { padding-top: 1rem; font-size: 1.1rem; font-weight: 700; color: #0055CC; border-top: 2px solid #0055CC; border-bottom: none; }
    .footer { margin-top: 3rem; text-align: center; font-size: 0.8rem; color: #aaa; line-height: 1.6; }
    .print-btn { display: block; margin: 1.5rem auto 0; padding: 0.75rem 2rem; background: #0055CC; color: #fff; border: none; border-radius: 8px; font-size: 0.95rem; font-weight: 600; cursor: pointer; }
    @media print { body { background: #fff; padding: 0; } .sheet { box-shadow: none; border-radius: 0; padding: 2rem; } .print-btn { display: none; } }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div>
        <div class="brand">TECHLIGENCE ADS PLATFORM</div>
        <div class="brand-sub">techligence.in</div>
      </div>
      <div class="invoice-title">
        <h1>TAX INVOICE</h1>
        <p>Invoice No: <strong>${payment.invoiceNumber || "—"}</strong></p>
        <p>Date: ${formatDate(payment.updatedAt)}</p>
      </div>
    </div>

    <hr />

    <div class="two-col">
      <div>
        <p class="section-label">Billed to</p>
        <p class="section-value">${advertiser.name || "—"}</p>
        <p class="section-sub">${advertiser.email || "—"}<br/>${advertiser.businessName || ""}</p>
      </div>
      <div>
        <p class="section-label">Campaign</p>
        <p class="section-value">${campaign.title || "—"}</p>
        <p class="section-sub">
          Brand: ${campaign.brandName || "—"}<br/>
          Placement: ${campaign.robotPlacement || "—"}<br/>
          Duration: ${formatDate(campaign.startDate)} – ${formatDate(campaign.endDate)}
        </p>
      </div>
    </div>

    <hr />

    <div class="two-col">
      <div>
        <p class="section-label">Payment reference</p>
        <p class="section-sub">
          Order ID: ${payment.razorpayOrderId || "—"}<br/>
          Payment ID: ${payment.razorpayPaymentId || "—"}<br/>
          Status: <strong>${(payment.status || "").toUpperCase()}</strong>
        </p>
      </div>
      <div>
        <p class="section-label">Payment date</p>
        <p class="section-value">${formatDate(payment.updatedAt)}</p>
      </div>
    </div>

    <hr />

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Base rate (₹${breakdown.baseRate || 0}/day × ${breakdown.durationDays || 0} days)</td>
          <td>${formatINR((breakdown.baseRate || 0) * (breakdown.durationDays || 0) * 100)}</td>
        </tr>
        <tr>
          <td>Repeat rate multiplier (×${(breakdown.repeatRateMultiplier || 1).toFixed(2)})</td>
          <td>included</td>
        </tr>
        <tr>
          <td>Platform fee</td>
          <td>${formatINR((breakdown.platformFee || 0) * 100)}</td>
        </tr>
        <tr>
          <td>Subtotal</td>
          <td>${formatINR(subtotalPaise)}</td>
        </tr>
        <tr>
          <td>GST (18%)</td>
          <td>${formatINR(Math.round((breakdown.gstAmount || 0) * 100))}</td>
        </tr>
        <tr class="total-row">
          <td>Total</td>
          <td>${formatINR(payment.amount)}</td>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      <p>This is a computer-generated invoice and does not require a physical signature.</p>
      <p>Techligence Robots Advertisement Platform · techligence.in</p>
    </div>

    <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
  </div>
</body>
</html>`;
};

module.exports = { generateInvoicePDF, generateInvoiceHTML };
