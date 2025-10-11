export function openReceiptPrintWindow(payment, profile) {
  const {
    receipt = '#000000',
    date = new Date().toISOString().split('T')[0],
    amount = 0,
    method = 'UPI'
  } = payment || {};

  const name = profile?.fullName || payment?.member || 'Member';
  const flatNo = profile?.flatNumber || payment?.flat || '';

  const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Receipt ${receipt}</title>
  <style>
    body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; color: #0f172a; margin: 0; padding: 24px; }
    .card { max-width: 720px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; }
    h1 { margin: 0 0 4px 0; font-size: 20px; }
    .muted { color: #64748b; }
    .row { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 16px; }
    .col { flex: 1 1 240px; }
    .label { font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: #64748b; }
    .value { font-weight: 600; margin-top: 4px; }
    .total { font-size: 28px; font-weight: 800; margin-top: 8px; }
    .footer { margin-top: 24px; font-size: 12px; color: #64748b; }
    .brand { display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #e2e8f0; padding-bottom:12px; margin-bottom:12px; }
    .badge { display:inline-block; font-size:12px; padding: 4px 8px; border-radius:999px; background:#ecfeff; color:#0369a1; border:1px solid #bae6fd }
    @media print { .no-print { display:none } }
  </style>
 </head>
 <body>
  <div class="card">
    <div class="brand">
      <div>
        <h1>FlatMate</h1>
        <div class="muted">Society maintenance receipt</div>
      </div>
      <div><span class="badge">${receipt}</span></div>
    </div>
    <div class="row">
      <div class="col">
        <div class="label">Paid by</div>
        <div class="value">${name}${flatNo ? ` • Flat ${flatNo}` : ''}</div>
      </div>
      <div class="col">
        <div class="label">Date</div>
        <div class="value">${date}</div>
      </div>
      <div class="col">
        <div class="label">Method</div>
        <div class="value">${method}</div>
      </div>
    </div>
    <div class="total">₹${Number(amount || 0).toFixed(2)}</div>
    <div class="footer">This is a computer generated receipt. Keep it for your records.</div>
  </div>
  <div class="no-print" style="text-align:center; margin-top:16px">
    <button onclick="window.print()" style="padding:8px 12px; border:1px solid #e5e7eb; border-radius:8px; background:#111827; color:white">Print / Save as PDF</button>
  </div>
 </body>
 </html>
  `;

  const w = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700');
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}
