import { useEffect, useRef, useState } from "react";
import { amountInWords, calculateInvoiceTotals, formatMoney } from "../../utils/invoice";

const PAGE_W = 794;

const PAYMENT_STATUS_META = {
  paid: { label: "Paid", color: "#0f7b3c", background: "#d9fbe8" },
  partial: { label: "Partial", color: "#8a5200", background: "#fff2d6" },
  unpaid: { label: "Unpaid", color: "#a31313", background: "#ffe2e2" }
};

const TEMPLATE_PRESETS = {
  modern: {
    title: "Modern Blue",
    fontFamily: '"Segoe UI", "Trebuchet MS", sans-serif',
    accent: "#1d4ed8",
    accentSoft: "#e8efff",
    border: "#d8e4fb",
    pageBackground: "#ffffff",
    tableHeaderBackground: "#eff5ff",
    headerMode: "band"
  },
  minimal: {
    title: "Minimal Mono",
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
    accent: "#1f2937",
    accentSoft: "#f3f4f6",
    border: "#d1d5db",
    pageBackground: "#ffffff",
    tableHeaderBackground: "#f7f7f7",
    headerMode: "split"
  },
  corporate: {
    title: "Corporate Accent",
    fontFamily: '"Georgia", "Times New Roman", serif',
    accent: "#0f355a",
    accentSoft: "#e8eff5",
    border: "#cad8e8",
    pageBackground: "#fbfdff",
    tableHeaderBackground: "#ebf2f9",
    headerMode: "ribbon"
  },
  ledger: {
    title: "Ledger Grid",
    fontFamily: '"Courier New", monospace',
    accent: "#7a5327",
    accentSoft: "#faf1e6",
    border: "#ddc8ae",
    pageBackground: "#fffdf9",
    tableHeaderBackground: "#f9f1e7",
    headerMode: "ledger"
  },
  compact: {
    title: "Compact Stripe",
    fontFamily: '"Tahoma", "Verdana", sans-serif',
    accent: "#0f766e",
    accentSoft: "#e7f8f6",
    border: "#c6ebe8",
    pageBackground: "#ffffff",
    tableHeaderBackground: "#ecfaf8",
    headerMode: "compact"
  }
};

function getPaymentStatus(status) {
  const normalized = String(status || "").toLowerCase();
  return PAYMENT_STATUS_META[normalized] ? normalized : "unpaid";
}

function getPaymentSnapshot(invoice, totals) {
  const paymentStatus = getPaymentStatus(invoice.paymentStatus);
  let amountPaidInr = Math.max(0, Number(invoice.amountPaidInr || 0));
  amountPaidInr = Math.min(amountPaidInr, totals.totalInr);

  if (paymentStatus === "paid") {
    amountPaidInr = totals.totalInr;
  }

  if (paymentStatus === "unpaid") {
    amountPaidInr = 0;
  }

  const balanceDueInr = Math.max(totals.totalInr - amountPaidInr, 0);

  return {
    amountPaidInr,
    balanceDueInr,
    paymentMeta: PAYMENT_STATUS_META[paymentStatus]
  };
}

function HeaderBlock({ invoice, companyProfile, theme }) {
  if (theme.headerMode === "band") {
    return (
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            background: theme.accent,
            color: "#ffffff",
            borderRadius: 12,
            padding: "12px 14px"
          }}
        >
          <div style={{ fontWeight: 700, letterSpacing: "0.08em" }}>TAX INVOICE</div>
          <div style={{ fontSize: 12 }}>Invoice #{invoice.invoiceNumber || "-"}</div>
        </div>
      </div>
    );
  }

  if (theme.headerMode === "ribbon") {
    return (
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            border: `1px solid ${theme.border}`,
            borderRadius: 12,
            overflow: "hidden"
          }}
        >
          <div style={{ background: theme.accent, color: "#ffffff", padding: "8px 14px", fontWeight: 700, letterSpacing: "0.06em" }}>
            CORPORATE TAX INVOICE
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 14px", background: "#ffffff" }}>
            <div style={{ fontSize: 11 }}>Issue Date: {invoice.invoiceDate || "-"}</div>
            <div style={{ fontSize: 11 }}>Due Date: {invoice.dueDate || "-"}</div>
            <div style={{ fontSize: 11 }}>Invoice: {invoice.invoiceNumber || "-"}</div>
          </div>
        </div>
      </div>
    );
  }

  if (theme.headerMode === "ledger") {
    return (
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            border: `2px solid ${theme.accent}`,
            borderRadius: 8,
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 10,
            padding: "10px 12px",
            background: theme.accentSoft
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>LEDGER INVOICE</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>{companyProfile.name}</div>
          </div>
          <div style={{ textAlign: "right", fontSize: 10, lineHeight: 1.6 }}>
            <div>No: {invoice.invoiceNumber || "-"}</div>
            <div>Date: {invoice.invoiceDate || "-"}</div>
          </div>
        </div>
      </div>
    );
  }

  if (theme.headerMode === "compact") {
    return (
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            borderTop: `5px solid ${theme.accent}`,
            borderBottom: `1px solid ${theme.border}`,
            padding: "8px 2px"
          }}
        >
          <div style={{ fontWeight: 700 }}>TAX INVOICE</div>
          <div style={{ fontSize: 11 }}>
            {invoice.invoiceNumber || "-"} | {invoice.invoiceDate || "-"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 12,
          border: `1px solid ${theme.border}`,
          borderRadius: 12,
          padding: "12px 14px",
          background: theme.accentSoft
        }}
      >
        <div>
          <div style={{ fontWeight: 700 }}>TAX INVOICE</div>
          <div style={{ fontSize: 11, marginTop: 2 }}>{companyProfile.name}</div>
        </div>
        <div style={{ textAlign: "right", fontSize: 11, lineHeight: 1.5 }}>
          <div>Invoice: {invoice.invoiceNumber || "-"}</div>
          <div>Date: {invoice.invoiceDate || "-"}</div>
          <div>Due: {invoice.dueDate || "-"}</div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ title, rows, theme }) {
  return (
    <div style={{ border: `1px solid ${theme.border}`, borderRadius: 10, padding: "10px 12px", background: "#ffffff" }}>
      <div style={{ fontWeight: 700, fontSize: 10, color: theme.accent, letterSpacing: "0.05em" }}>{title}</div>
      <div style={{ marginTop: 6, fontSize: 10, lineHeight: 1.55 }}>
        {rows.map((row) => (
          <div key={`${title}-${row.label}`} style={{ display: "flex", gap: 8, marginBottom: 2 }}>
            <span style={{ minWidth: 92, color: "#5b6472" }}>{row.label}</span>
            <span style={{ fontWeight: 600 }}>{row.value || "-"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddressCard({ title, lines, theme }) {
  return (
    <div style={{ border: `1px solid ${theme.border}`, borderRadius: 10, padding: "10px 12px", background: "#ffffff" }}>
      <div style={{ fontWeight: 700, fontSize: 10, color: theme.accent, letterSpacing: "0.05em", marginBottom: 6 }}>{title}</div>
      {lines.map((line, index) =>
        line ? (
          <div key={`${title}-${index}`} style={{ fontSize: 10, lineHeight: 1.55 }}>
            {line}
          </div>
        ) : null
      )}
    </div>
  );
}

function ItemsTable({ invoice, theme }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 14, fontSize: 10 }}>
      <thead>
        <tr style={{ background: theme.tableHeaderBackground }}>
          <th style={{ ...tableHeadCell(theme), width: "6%" }}>#</th>
          <th style={{ ...tableHeadCell(theme), width: "36%" }}>Description</th>
          <th style={{ ...tableHeadCell(theme), width: "12%" }}>HSN/SAC</th>
          <th style={{ ...tableHeadCell(theme), width: "8%" }}>Qty</th>
          <th style={{ ...tableHeadCell(theme), width: "13%", textAlign: "right" }}>Rate</th>
          <th style={{ ...tableHeadCell(theme), width: "12%", textAlign: "right" }}>Amount</th>
          <th style={{ ...tableHeadCell(theme), width: "13%", textAlign: "right" }}>Tax</th>
        </tr>
      </thead>
      <tbody>
        {invoice.items.map((item, index) => {
          const taxableAmount = Number(item.quantity || 0) * Number(item.rateInr || 0);
          const taxAmount = taxableAmount * (Number(invoice.gstRate || 0) / 100);

          return (
            <tr key={item.id}>
              <td style={tableBodyCell(theme)}>{index + 1}</td>
              <td style={tableBodyCell(theme)}>
                <div style={{ fontWeight: 600 }}>{item.description || "-"}</div>
                {item.details ? <div style={{ fontSize: 9, color: "#5f6673", marginTop: 1 }}>{item.details}</div> : null}
              </td>
              <td style={tableBodyCell(theme)}>{item.hsnSac || "-"}</td>
              <td style={tableBodyCell(theme)}>{item.quantity || 0}</td>
              <td style={{ ...tableBodyCell(theme), textAlign: "right" }}>{formatMoney(item.rateInr, invoice.currency)}</td>
              <td style={{ ...tableBodyCell(theme), textAlign: "right" }}>{formatMoney(taxableAmount, invoice.currency)}</td>
              <td style={{ ...tableBodyCell(theme), textAlign: "right" }}>{formatMoney(taxAmount, invoice.currency)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function tableHeadCell(theme) {
  return {
    border: `1px solid ${theme.border}`,
    padding: "8px 7px",
    textAlign: "left",
    fontWeight: 700,
    color: "#243041"
  };
}

function tableBodyCell(theme) {
  return {
    border: `1px solid ${theme.border}`,
    padding: "7px",
    verticalAlign: "top"
  };
}

function TotalsBlock({ invoice, totals, theme, paymentSnapshot }) {
  const isIntra = invoice.taxMode === "intra";
  const halfGst = Number(invoice.gstRate || 0) / 2;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 12, marginTop: 14 }}>
      <div style={{ border: `1px solid ${theme.border}`, borderRadius: 10, padding: "10px 12px", background: "#ffffff" }}>
        <div style={{ fontWeight: 700, fontSize: 10, color: theme.accent, letterSpacing: "0.05em", marginBottom: 6 }}>AMOUNT IN WORDS</div>
        <div style={{ fontSize: 10, lineHeight: 1.6 }}>{amountInWords(totals.totalInr, invoice.currency)}</div>
        <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div style={{ border: `1px solid ${theme.border}`, borderRadius: 8, padding: "8px 10px", background: theme.accentSoft }}>
            <div style={{ fontSize: 9, color: "#5f6673" }}>Payment Status</div>
            <div style={{ marginTop: 5 }}>
              <span
                style={{
                  color: paymentSnapshot.paymentMeta.color,
                  background: paymentSnapshot.paymentMeta.background,
                  borderRadius: 999,
                  padding: "2px 8px",
                  display: "inline-block",
                  fontWeight: 700,
                  fontSize: 9
                }}
              >
                {paymentSnapshot.paymentMeta.label}
              </span>
            </div>
          </div>
          <div style={{ border: `1px solid ${theme.border}`, borderRadius: 8, padding: "8px 10px", background: theme.accentSoft }}>
            <div style={{ fontSize: 9, color: "#5f6673" }}>Balance Due</div>
            <div style={{ marginTop: 5, fontSize: 12, fontWeight: 700 }}>{formatMoney(paymentSnapshot.balanceDueInr, invoice.currency)}</div>
          </div>
        </div>
      </div>

      <div style={{ border: `1px solid ${theme.border}`, borderRadius: 10, padding: "10px 12px", background: "#ffffff" }}>
        <TotalLine label="Subtotal" value={formatMoney(totals.subtotalInr, invoice.currency)} theme={theme} />
        {isIntra ? (
          <>
            <TotalLine label={`CGST @ ${halfGst}%`} value={formatMoney(totals.cgstInr, invoice.currency)} theme={theme} />
            <TotalLine label={`SGST @ ${halfGst}%`} value={formatMoney(totals.sgstInr, invoice.currency)} theme={theme} />
          </>
        ) : (
          <TotalLine label={`IGST @ ${invoice.gstRate}%`} value={formatMoney(totals.igstInr, invoice.currency)} theme={theme} />
        )}
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${theme.border}` }}>
          <TotalLine label="Grand Total" value={formatMoney(totals.totalInr, invoice.currency)} bold theme={theme} />
        </div>
      </div>
    </div>
  );
}

function TotalLine({ label, value, theme, bold = false }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "3px 0", fontSize: bold ? 12 : 10, fontWeight: bold ? 700 : 500 }}>
      <span style={{ color: bold ? theme.accent : "#445064" }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function FooterBlock({ invoice, companyProfile, theme, paymentSnapshot }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 12, marginTop: 14 }}>
      <div style={{ border: `1px solid ${theme.border}`, borderRadius: 10, padding: "10px 12px", background: "#ffffff" }}>
        <div style={{ fontWeight: 700, fontSize: 10, color: theme.accent, letterSpacing: "0.05em" }}>REMARKS & DECLARATION</div>
        <div style={{ marginTop: 6, fontSize: 10, lineHeight: 1.6 }}>{invoice.remarks || "-"}</div>
        <div style={{ marginTop: 8, fontSize: 9, lineHeight: 1.6, color: "#495364" }}>{invoice.declaration || "-"}</div>
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ fontSize: 9, color: "#566072" }}>PAN: {companyProfile.pan || "-"}</div>
          {companyProfile.qrCode ? <img src={companyProfile.qrCode} alt="QR" style={{ width: 58, height: 58, objectFit: "cover", borderRadius: 8 }} /> : null}
        </div>
      </div>

      <div style={{ border: `1px solid ${theme.border}`, borderRadius: 10, padding: "10px 12px", background: "#ffffff" }}>
        <div style={{ fontWeight: 700, fontSize: 10, color: theme.accent, letterSpacing: "0.05em", marginBottom: 6 }}>BANK & PAYMENT</div>
        <SmallRow label="Bank" value={companyProfile.bankName || "-"} />
        <SmallRow label="A/C No" value={companyProfile.accountNumber || "-"} />
        <SmallRow label="IFSC" value={companyProfile.ifsc || "-"} />
        <SmallRow label="Mode" value={invoice.paymentMode || "-"} />
        <SmallRow label="Paid" value={formatMoney(paymentSnapshot.amountPaidInr, invoice.currency)} />
        <SmallRow label="Reference" value={invoice.paymentReference || "-"} />

        <div style={{ marginTop: 12, textAlign: "right" }}>
          <div style={{ fontWeight: 700, fontSize: 10 }}>For {companyProfile.name}</div>
          {companyProfile.signature ? <img src={companyProfile.signature} alt="Authorised signature" style={{ width: 130, height: 40, objectFit: "contain", margin: "6px 0 6px auto" }} /> : null}
          <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 4, fontSize: 9 }}>Authorised Signatory</div>
        </div>
      </div>
    </div>
  );
}

function SmallRow({ label, value }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "72px 1fr", gap: 8, fontSize: 9, marginBottom: 4 }}>
      <span style={{ color: "#5f6877" }}>{label}</span>
      <span style={{ fontWeight: 600, wordBreak: "break-word" }}>{value}</span>
    </div>
  );
}

export default function TemplateVariantsPreview({ invoice, companyProfile, invoiceRef, templateId }) {
  const totals = calculateInvoiceTotals(invoice);
  const paymentSnapshot = getPaymentSnapshot(invoice, totals);
  const theme = TEMPLATE_PRESETS[templateId] || TEMPLATE_PRESETS.modern;

  const wrapRef = useRef(null);
  const pageRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState("auto");

  useEffect(() => {
    function measure() {
      if (!wrapRef.current || !pageRef.current) {
        return;
      }

      const available = wrapRef.current.offsetWidth;
      const nextScale = available / PAGE_W;
      setScale(nextScale);
      setScaledHeight(pageRef.current.scrollHeight * nextScale);
    }

    measure();
    const ro = new ResizeObserver(measure);

    if (wrapRef.current) {
      ro.observe(wrapRef.current);
    }

    if (pageRef.current) {
      ro.observe(pageRef.current);
    }

    return () => ro.disconnect();
  }, [invoice, companyProfile, templateId]);

  return (
    <div className="preview-shell">
      <div ref={wrapRef} style={{ width: "100%", overflow: "hidden", background: "#fff", height: scaledHeight }}>
        <div
          style={{
            width: PAGE_W,
            transformOrigin: "top left",
            transform: `scale(${scale})`
          }}
        >
          <div
            ref={(element) => {
              pageRef.current = element;

              if (invoiceRef) {
                invoiceRef.current = element;
              }
            }}
            style={{
              width: PAGE_W,
              background: theme.pageBackground,
              fontFamily: theme.fontFamily,
              fontSize: 10,
              color: "#13212f",
              padding: "16px 18px",
              boxSizing: "border-box"
            }}
          >
            <HeaderBlock invoice={invoice} companyProfile={companyProfile} theme={theme} />

            <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 12 }}>
              <InfoCard
                title="COMPANY"
                theme={theme}
                rows={[
                  { label: "Name", value: companyProfile.name },
                  { label: "GST", value: companyProfile.gst },
                  { label: "Email", value: companyProfile.email },
                  { label: "Phone", value: companyProfile.phone }
                ]}
              />
              <InfoCard
                title="INVOICE DETAILS"
                theme={theme}
                rows={[
                  { label: "Invoice No", value: invoice.invoiceNumber },
                  { label: "Invoice Date", value: invoice.invoiceDate },
                  { label: "Due Date", value: invoice.dueDate },
                  { label: "Tax Mode", value: invoice.taxMode === "intra" ? "Intra-state" : "Inter-state" }
                ]}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
              <AddressCard
                title="BILL TO"
                theme={theme}
                lines={[
                  invoice.buyer.companyName,
                  invoice.buyer.addressLine1,
                  invoice.buyer.addressLine2,
                  invoice.buyer.addressLine3,
                  invoice.buyer.email,
                  invoice.buyer.gstNumber ? `GST: ${invoice.buyer.gstNumber}` : ""
                ]}
              />
              <AddressCard
                title="SHIP TO"
                theme={theme}
                lines={[
                  invoice.consignee.name,
                  invoice.consignee.addressLine1,
                  invoice.consignee.addressLine2,
                  invoice.consignee.addressLine3,
                  invoice.destination ? `Destination: ${invoice.destination}` : ""
                ]}
              />
            </div>

            <ItemsTable invoice={invoice} theme={theme} />
            <TotalsBlock invoice={invoice} totals={totals} theme={theme} paymentSnapshot={paymentSnapshot} />
            <FooterBlock invoice={invoice} companyProfile={companyProfile} theme={theme} paymentSnapshot={paymentSnapshot} />

            <div style={{ marginTop: 12, textAlign: "center", fontSize: 8.5, color: "#586274" }}>
              Subject to Vadodara Jurisdiction | This is a computer generated invoice.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
