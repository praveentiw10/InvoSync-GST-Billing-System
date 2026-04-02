import { useEffect, useRef, useState } from "react";
import { amountInWords, calculateInvoiceTotals, formatMoney } from "../../utils/invoice";

const PAGE_W = 794; // fixed A4 width in px
const PAYMENT_STATUS_META = {
  paid: { label: "Paid", color: "#0f7b3c", background: "#d9fbe8" },
  partial: { label: "Partial", color: "#8a5200", background: "#fff2d6" },
  unpaid: { label: "Unpaid", color: "#a31313", background: "#ffe2e2" }
};

function getPaymentStatus(status) {
  const normalized = String(status || "").toLowerCase();
  return PAYMENT_STATUS_META[normalized] ? normalized : "unpaid";
}

export default function ClassicInvoicePreview({ invoice, companyProfile, invoiceRef }) {
  const totals = calculateInvoiceTotals(invoice);
  const halfGst = invoice.gstRate / 2;
  const isIntra = invoice.taxMode === "intra";
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
  const paymentMeta = PAYMENT_STATUS_META[paymentStatus];

  const wrapRef = useRef(null);
  const pageRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState("auto");

  useEffect(() => {
    function measure() {
      if (wrapRef.current && pageRef.current) {
        const available = wrapRef.current.offsetWidth;
        const s = available / PAGE_W;
        setScale(s);
        setScaledHeight(pageRef.current.scrollHeight * s);
      }
    }
    measure();
    const ro = new ResizeObserver(measure);
    if (wrapRef.current) ro.observe(wrapRef.current);
    if (pageRef.current) ro.observe(pageRef.current);
    return () => ro.disconnect();
  }, [invoice, companyProfile]);

  return (
    <div className="preview-shell">
      {/* Outer wrapper measures available width */}
      <div ref={wrapRef} style={{ width: "100%", overflow: "hidden", background: "#fff", height: scaledHeight }}>
        {/* Scale container: shrinks the 794px page to fit */}
        <div style={{
          width: PAGE_W,
          transformOrigin: "top left",
          transform: `scale(${scale})`,
        }}>
        <div ref={(el) => { pageRef.current = el; if (invoiceRef) invoiceRef.current = el; }} style={S.page}>

          {/* ── TITLE ── */}
          <div style={S.title}>TAX INVOICE</div>

          {/* ── HEADER: logo/company  |  invoice meta ── */}
          <table style={S.tbl}>
            <tbody>
              <tr>
                {/* Company */}
                <td style={{ ...S.td, width: "36%", padding: "8px" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <img src={companyProfile.logo} alt="" style={S.logo} />
                    <div>
                      <div style={S.coName}>{companyProfile.name}</div>
                      <div style={S.coTag}>({companyProfile.tagline})</div>
                      <div style={S.coAddr}>{companyProfile.addressLine1}</div>
                      <div style={S.coAddr}>{companyProfile.addressLine2}</div>
                      <div style={S.coAddr}>Email - {companyProfile.email}</div>
                      <div style={S.coAddr}>Ph - {companyProfile.phone}</div>
                      <div style={S.coAddr}>GST - {companyProfile.gst}</div>
                    </div>
                  </div>
                </td>

                {/* Meta grid */}
                <td style={{ ...S.td, padding: 0 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tbody>
                      <MetaRow l1="Invoice No" v1={invoice.invoiceNumber} l2="Dated" v2={invoice.invoiceDate} />
                      <MetaRow l1="Supplier's Ref" v1={invoice.supplierRef} l2="Other Ref" v2={invoice.otherRef} />
                      <MetaRow l1="Buyer's Order No" v1={invoice.buyerOrderNumber} l2="Dated" v2="" />
                      <MetaRow l1="Despatch Doc No" v1={invoice.dispatchDocNo} l2="Delivery Note No" v2={invoice.deliveryNoteNo} />
                      <MetaRow l1="Despatched Through" v1={invoice.dispatchedThrough} l2="Destination" v2={invoice.destination} />
                      <tr>
                        <td colSpan={4} style={{ ...S.mCell, padding: "5px 8px" }}>
                          <span style={S.mLabel}>Terms of Delivery&nbsp;&nbsp;</span>
                          <span>{invoice.termsOfDelivery}</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ── BUYER / CONSIGNEE ── */}
          <table style={{ ...S.tbl, borderTop: "none" }}>
            <tbody>
              <tr>
                <td style={{ ...S.td, width: "36%", borderTop: "none", padding: "6px 8px" }}>
                  <div style={S.secLabel}>BUYER (Bill To)</div>
                  <div style={S.buyerName}>{invoice.buyer.companyName}</div>
                  <div style={S.addr}>{invoice.buyer.addressLine1}</div>
                  <div style={S.addr}>{invoice.buyer.addressLine2}</div>
                  <div style={S.addr}>{invoice.buyer.addressLine3}</div>
                  {invoice.buyer.email ? <div style={S.addr}>{invoice.buyer.email}</div> : null}
                  <div style={{ ...S.addr, marginTop: 4 }}>GST NO: {invoice.buyer.gstNumber || "-"}</div>
                </td>
                <td style={{ ...S.td, borderTop: "none", padding: "6px 8px" }}>
                  <div style={S.secLabel}>CONSIGNEE (Ship To)</div>
                  <div style={S.buyerName}>{invoice.consignee.name || "-"}</div>
                  <div style={S.addr}>{invoice.consignee.addressLine1}</div>
                  <div style={S.addr}>{invoice.consignee.addressLine2}</div>
                  <div style={S.addr}>{invoice.consignee.addressLine3}</div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ── ITEMS TABLE ── */}
          <table style={{ ...S.tbl, borderTop: "none" }}>
            <thead>
              <tr style={{ background: "#f0f0f0" }}>
                <th style={{ ...S.th, width: "4%" }}>Sr</th>
                <th style={{ ...S.th, width: "30%" }}>Description of Goods / Services</th>
                <th style={{ ...S.th, width: "9%" }}>HSN/SAC</th>
                <th style={{ ...S.th, width: "5%", textAlign: "center" }}>Qty</th>
                <th style={{ ...S.th, width: "11%", textAlign: "right" }}>Rate</th>
                <th style={{ ...S.th, width: "6%", textAlign: "center" }}>per</th>
                <th style={{ ...S.th, width: "7%", textAlign: "center" }}>Disc%</th>
                <th style={{ ...S.th, width: "12%", textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr key={item.id}>
                  <td style={{ ...S.td, textAlign: "center" }}>{i + 1}</td>
                  <td style={S.td}>
                    <div style={{ fontWeight: 600 }}>{item.description}</div>
                    {item.details && <div style={{ fontSize: 9, color: "#444", marginTop: 1 }}>{item.details}</div>}
                  </td>
                  <td style={{ ...S.td, textAlign: "center" }}>{item.hsnSac}</td>
                  <td style={{ ...S.td, textAlign: "center" }}>{item.quantity}</td>
                  <td style={{ ...S.td, textAlign: "right" }}>{formatMoney(item.rateInr, invoice.currency)}</td>
                  <td style={{ ...S.td, textAlign: "center" }}>{item.unit || "-"}</td>
                  <td style={{ ...S.td, textAlign: "center" }}>-</td>
                  <td style={{ ...S.td, textAlign: "right" }}>{formatMoney(item.quantity * item.rateInr, invoice.currency)}</td>
                </tr>
              ))}

              {/* spacer */}
              <tr><td colSpan={8} style={{ ...S.td, height: 40 }}></td></tr>

              {/* tax lines */}
              {isIntra ? (
                <>
                  <TaxLine label={`CGST @ ${halfGst}%`} value={formatMoney(totals.cgstInr, invoice.currency)} />
                  <TaxLine label={`SGST @ ${halfGst}%`} value={formatMoney(totals.sgstInr, invoice.currency)} />
                  <TaxLine label={`IGST @ ${invoice.gstRate}%`} value="-" />
                </>
              ) : (
                <>
                  <TaxLine label="CGST @ 0%" value="-" />
                  <TaxLine label="SGST @ 0%" value="-" />
                  <TaxLine label={`IGST @ ${invoice.gstRate}%`} value={formatMoney(totals.igstInr, invoice.currency)} />
                </>
              )}

              {/* grand total */}
              <tr style={{ background: "#f0f0f0" }}>
                <td colSpan={7} style={{ ...S.td, textAlign: "center", fontWeight: 700 }}>Total</td>
                <td style={{ ...S.td, textAlign: "right", fontWeight: 700 }}>{formatMoney(totals.totalInr, invoice.currency)}</td>
              </tr>
            </tbody>
          </table>

          {/* ── AMOUNT IN WORDS ── */}
          <table style={{ ...S.tbl, borderTop: "none" }}>
            <tbody>
              <tr>
                <td style={{ ...S.td, borderTop: "none", padding: "4px 8px", width: "70%" }}>
                  <span style={{ fontStyle: "italic", fontWeight: 600, fontSize: 9 }}>Amount Chargeable in Words</span>
                </td>
                <td style={{ ...S.td, borderTop: "none", textAlign: "right", padding: "4px 8px", fontSize: 9, fontStyle: "italic" }}>E. &amp; O.E</td>
              </tr>
              <tr>
                <td colSpan={2} style={{ ...S.td, borderTop: "none", padding: "2px 8px 6px", fontWeight: 700, fontSize: 9 }}>
                  {amountInWords(totals.totalInr, invoice.currency)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* ── HSN TAX BREAKDOWN ── */}
          <table style={{ ...S.tbl, ...S.taxBreakdownTable, borderTop: "none" }}>
            <thead>
              <tr style={{ background: "#f0f0f0" }}>
                <th style={{ ...S.th, ...S.taxHeadMain }} rowSpan={2}>
                  <span style={S.taxHeadLabel}>HSN / SAC</span>
                </th>
                <th style={{ ...S.th, ...S.taxHeadMain }} rowSpan={2}>
                  <span style={S.taxHeadLabel}>Taxable Value</span>
                </th>
                <th style={{ ...S.th, ...S.taxHeadGroup, textAlign: "center" }} colSpan={2}>
                  <span style={S.taxHeadLabel}>CGST</span>
                </th>
                <th style={{ ...S.th, ...S.taxHeadGroup, textAlign: "center" }} colSpan={2}>
                  <span style={S.taxHeadLabel}>SGST</span>
                </th>
                <th style={{ ...S.th, ...S.taxHeadGroup, textAlign: "center" }} colSpan={2}>
                  <span style={S.taxHeadLabel}>IGST</span>
                </th>
              </tr>
              <tr style={{ background: "#f0f0f0" }}>
                <th style={{ ...S.th, ...S.taxHeadSub }}>Rate</th><th style={{ ...S.th, ...S.taxHeadSub }}>Amount</th>
                <th style={{ ...S.th, ...S.taxHeadSub }}>Rate</th><th style={{ ...S.th, ...S.taxHeadSub }}>Amount</th>
                <th style={{ ...S.th, ...S.taxHeadSub }}>Rate</th><th style={{ ...S.th, ...S.taxHeadSub }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => {
                const lineAmt = item.quantity * item.rateInr;
                const lineCgst = isIntra ? (lineAmt * halfGst) / 100 : 0;
                const lineSgst = isIntra ? (lineAmt * halfGst) / 100 : 0;
                const lineIgst = !isIntra ? (lineAmt * invoice.gstRate) / 100 : 0;
                return (
                  <tr key={item.id}>
                    <td style={S.td}>{item.hsnSac}</td>
                    <td style={{ ...S.td, textAlign: "right" }}>{formatMoney(lineAmt, invoice.currency)}</td>
                    <td style={{ ...S.td, textAlign: "center" }}>{isIntra ? `${halfGst}%` : "0%"}</td>
                    <td style={{ ...S.td, textAlign: "right" }}>{isIntra ? formatMoney(lineCgst, invoice.currency) : "-"}</td>
                    <td style={{ ...S.td, textAlign: "center" }}>{isIntra ? `${halfGst}%` : "0%"}</td>
                    <td style={{ ...S.td, textAlign: "right" }}>{isIntra ? formatMoney(lineSgst, invoice.currency) : "-"}</td>
                    <td style={{ ...S.td, textAlign: "center" }}>{!isIntra ? `${invoice.gstRate}%` : "18%"}</td>
                    <td style={{ ...S.td, textAlign: "right" }}>{!isIntra ? formatMoney(lineIgst, invoice.currency) : "-"}</td>
                  </tr>
                );
              })}
              <tr style={{ background: "#f0f0f0", fontWeight: 700 }}>
                <td style={S.td}>TOTAL</td>
                <td style={{ ...S.td, textAlign: "right" }}>{formatMoney(totals.subtotalInr, invoice.currency)}</td>
                <td style={S.td}></td>
                <td style={{ ...S.td, textAlign: "right" }}>{isIntra ? formatMoney(totals.cgstInr, invoice.currency) : "-"}</td>
                <td style={S.td}></td>
                <td style={{ ...S.td, textAlign: "right" }}>{isIntra ? formatMoney(totals.sgstInr, invoice.currency) : "-"}</td>
                <td style={S.td}></td>
                <td style={{ ...S.td, textAlign: "right" }}>{!isIntra ? formatMoney(totals.igstInr, invoice.currency) : "-"}</td>
              </tr>
            </tbody>
          </table>

          {/* ── TAX AMOUNT IN WORDS ── */}
          <table style={{ ...S.tbl, borderTop: "none" }}>
            <tbody>
              <tr>
                <td colSpan={2} style={{ ...S.td, borderTop: "none", padding: "3px 8px" }}>
                  <span style={{ fontStyle: "italic", fontWeight: 600, fontSize: 9 }}>Tax Amount ( In Words)</span>
                </td>
              </tr>
              <tr>
                <td colSpan={2} style={{ ...S.td, borderTop: "none", padding: "2px 8px 5px", fontWeight: 700, fontSize: 9 }}>
                  {amountInWords(totals.gstValueInr, invoice.currency)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* ── FOOTER: remarks + QR  |  bank + signature ── */}
          <table style={{ ...S.tbl, borderTop: "none" }}>
            <tbody>
              <tr>
                {/* Left */}
                <td style={{ ...S.td, borderTop: "none", width: "48%", verticalAlign: "top", padding: "6px 8px" }}>
                  <div style={S.fLabel}>Remarks:</div>
                  <div style={S.fText}>{invoice.remarks}</div>
                  <div style={{ marginTop: 8 }}>
                    <img src={companyProfile.qrCode} alt="QR" style={S.qr} />
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <span style={S.fLabel}>Company's PAN&nbsp;&nbsp;</span>
                    <span style={{ fontWeight: 700, fontSize: 9 }}>{companyProfile.pan}</span>
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <div style={S.fLabel}>Declaration</div>
                    <div style={{ ...S.fText, fontSize: 8 }}>{invoice.declaration}</div>
                  </div>
                </td>

                {/* Right */}
                <td style={{ ...S.td, borderTop: "none", verticalAlign: "top", padding: "6px 8px" }}>
                  <div style={S.fLabel}>Company's Bank Details</div>
                  <table style={{ marginTop: 4, borderCollapse: "collapse", width: "100%" }}>
                    <tbody>
                      <BankRow label="Type of A/c" value={companyProfile.accountType} />
                      <BankRow label="Name of Bank" value={companyProfile.bankName} />
                      <BankRow label="A/c No" value={companyProfile.accountNumber} />
                      <BankRow label="Branch" value={companyProfile.branch} />
                      <BankRow label="IFSC Code" value={companyProfile.ifsc} />
                    </tbody>
                  </table>

                  <div style={{ marginTop: 12 }}>
                    <div style={S.fLabel}>Payment Details</div>
                    <table style={{ marginTop: 4, borderCollapse: "collapse", width: "100%" }}>
                      <tbody>
                        <PaymentRow
                          label="Status"
                          value={
                            <span
                              style={{
                                color: paymentMeta.color,
                                background: paymentMeta.background,
                                borderRadius: 999,
                                padding: "2px 8px",
                                display: "inline-block",
                                fontWeight: 700
                              }}
                            >
                              {paymentMeta.label}
                            </span>
                          }
                        />
                        <PaymentRow label="Mode" value={invoice.paymentMode || "-"} />
                        <PaymentRow label="Amount Paid" value={formatMoney(amountPaidInr, invoice.currency)} />
                        <PaymentRow label="Balance Due" value={formatMoney(balanceDueInr, invoice.currency)} />
                        <PaymentRow label="Payment Date" value={invoice.paymentDate || "-"} />
                        <PaymentRow label="Reference" value={invoice.paymentReference || "-"} />
                      </tbody>
                    </table>
                    {invoice.paymentDetails ? <div style={{ ...S.fText, marginTop: 6 }}>{invoice.paymentDetails}</div> : null}
                  </div>

                  <div style={{ marginTop: 14, textAlign: "right" }}>
                    <div style={{ fontWeight: 700, fontSize: 9 }}>FOR {companyProfile.name}</div>
                    {companyProfile.signature ? <img src={companyProfile.signature} alt="Authorised signature" style={S.signature} /> : <div style={{ height: 36 }}></div>}
                    <div style={{ borderTop: "1px solid #333", paddingTop: 3, fontSize: 8 }}>Authorised Signatory</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ── BOTTOM NOTE ── */}
          <div style={S.bottomNote}>
            <em>Subject to Vadodara Jurisdiction</em>
            <span style={{ marginLeft: 16 }}>This is a Computer Generated Invoice.</span>
          </div>

        </div>
        </div>
      </div>
    </div>
  );
}

/* ── helpers ── */
function MetaRow({ l1, v1, l2, v2 }) {
  return (
    <tr>
      <td style={{ ...S.mCell, width: "22%", fontWeight: 600 }}>{l1}</td>
      <td style={{ ...S.mCell, width: "28%" }}>{v1 || ""}</td>
      <td style={{ ...S.mCell, width: "22%", fontWeight: 600 }}>{l2}</td>
      <td style={{ ...S.mCell, width: "28%" }}>{v2 || ""}</td>
    </tr>
  );
}

function TaxLine({ label, value }) {
  return (
    <tr>
      <td colSpan={7} style={{ ...S.td, textAlign: "right", fontWeight: 600 }}>{label}</td>
      <td style={{ ...S.td, textAlign: "right" }}>{value}</td>
    </tr>
  );
}

function BankRow({ label, value }) {
  return (
    <tr>
      <td style={{ fontSize: 9, padding: "2px 0", color: "#444", width: "42%" }}>{label}</td>
      <td style={{ fontSize: 9, padding: "2px 0", fontWeight: 700 }}>{value}</td>
    </tr>
  );
}

function PaymentRow({ label, value }) {
  return (
    <tr>
      <td style={{ fontSize: 9, padding: "2px 0", color: "#444", width: "42%" }}>{label}</td>
      <td style={{ fontSize: 9, padding: "2px 0", fontWeight: 700 }}>{value}</td>
    </tr>
  );
}

/* ── styles ── */
const B = "1px solid #999";

const S = {
  page: {
    width: 794,
    background: "#fff",
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: 10,
    color: "#111",
    padding: "14px 16px",
    boxSizing: "border-box",
  },
  title: {
    textAlign: "center",
    fontWeight: 700,
    fontSize: 12,
    border: B,
    padding: "5px",
    letterSpacing: "0.06em",
  },
  tbl: {
    width: "100%",
    borderCollapse: "collapse",
    border: B,
  },
  taxBreakdownTable: {
    tableLayout: "fixed",
  },
  td: {
    border: B,
    padding: "5px 7px",
    verticalAlign: "top",
    fontSize: 10,
  },
  th: {
    border: B,
    padding: "4px 6px",
    fontWeight: 700,
    fontSize: 9,
    textAlign: "left",
    verticalAlign: "middle",
  },
  taxHeadMain: {
    verticalAlign: "top",
    lineHeight: 1.3,
    paddingTop: "8px",
    paddingBottom: "8px",
    minHeight: 30,
  },
  taxHeadGroup: {
    lineHeight: 1.3,
    paddingTop: "7px",
    paddingBottom: "7px",
  },
  taxHeadSub: {
    lineHeight: 1.3,
    paddingTop: "6px",
    paddingBottom: "6px",
    minHeight: 24,
  },
  taxHeadLabel: {
    display: "inline-block",
    transform: "translateY(1px)",
  },
  logo: {
    width: 64,
    height: 64,
    objectFit: "cover",
    borderRadius: 4,
    flexShrink: 0,
  },
  coName: { fontWeight: 700, fontSize: 11 },
  coTag:  { fontSize: 8, color: "#444" },
  coAddr: { fontSize: 8, lineHeight: 1.5 },
  mCell: {
    border: B,
    padding: "4px 7px",
    fontSize: 9,
    verticalAlign: "top",
  },
  mLabel: { fontWeight: 600 },
  secLabel: { fontWeight: 700, fontSize: 9, marginBottom: 3 },
  buyerName: { fontWeight: 700, fontSize: 10, marginBottom: 2 },
  addr: { fontSize: 9, lineHeight: 1.5 },
  fLabel: { fontWeight: 700, fontSize: 9, marginBottom: 2 },
  fText:  { fontSize: 9, lineHeight: 1.5 },
  qr: { width: 70, height: 70, objectFit: "cover" },
  signature: {
    display: "block",
    width: 150,
    height: 44,
    objectFit: "contain",
    margin: "6px 0 6px auto"
  },
  bottomNote: {
    textAlign: "center",
    fontSize: 8,
    marginTop: 6,
    lineHeight: 1.8,
  },
};
