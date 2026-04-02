import { convertCurrencyToInr, convertInrToCurrency, formatMoney, getCurrencyConfig } from "../utils/invoice";
import { currencyOptions } from "../data/defaults";
import { invoiceTemplates } from "../data/invoiceTemplates";

function InvoiceItemRow({ invoice, item, index, onItemChange, onRemoveItem }) {
  const currencyConfig = getCurrencyConfig(invoice.currency);

  return (
    <div className="item-card">
      <div className="item-card-header">
        <strong>Line item {index + 1}</strong>
        {invoice.items.length > 1 ? (
          <button className="ghost-button" type="button" onClick={() => onRemoveItem(item.id)}>
            Remove
          </button>
        ) : null}
      </div>

      <div className="field-grid">
        <label className="field field-span-2">
          <span>Description</span>
          <input value={item.description} onChange={(event) => onItemChange(item.id, "description", event.target.value)} />
        </label>
        <label className="field field-span-2">
          <span>Details</span>
          <textarea rows="3" value={item.details} onChange={(event) => onItemChange(item.id, "details", event.target.value)} />
        </label>
        <label className="field">
          <span>HSN / SAC</span>
          <input value={item.hsnSac} onChange={(event) => onItemChange(item.id, "hsnSac", event.target.value)} />
        </label>
        <label className="field">
          <span>Quantity</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={item.quantity}
            onChange={(event) => onItemChange(item.id, "quantity", Number(event.target.value))}
          />
        </label>
        <label className="field">
          <span>Unit</span>
          <input value={item.unit} onChange={(event) => onItemChange(item.id, "unit", event.target.value)} />
        </label>
        <label className="field">
          <span>Rate ({currencyConfig.code})</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={Number(convertInrToCurrency(item.rateInr, invoice.currency).toFixed(2))}
            onChange={(event) => onItemChange(item.id, "rateInr", convertCurrencyToInr(Number(event.target.value), invoice.currency))}
          />
        </label>
      </div>

      <p className="item-total">Line total: {formatMoney(item.quantity * item.rateInr, invoice.currency)}</p>
    </div>
  );
}

export default function InvoiceEditor({
  invoice,
  onInvoiceChange,
  onBuyerChange,
  onConsigneeChange,
  onItemChange,
  onAddItem,
  onRemoveItem
}) {
  const currencyConfig = getCurrencyConfig(invoice.currency);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Invoice Builder</p>
          <h2>Dynamic fields</h2>
        </div>
      </div>

      <div className="field-grid">
        <label className="field field-span-2">
          <span>Invoice template</span>
          <select value={invoice.templateId || invoiceTemplates[0].id} onChange={(event) => onInvoiceChange("templateId", event.target.value)}>
            {invoiceTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
                {template.recommended ? " (Recommended)" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Invoice no.</span>
          <input value={invoice.invoiceNumber} onChange={(event) => onInvoiceChange("invoiceNumber", event.target.value)} />
        </label>
        <label className="field">
          <span>Invoice date</span>
          <input type="date" value={invoice.invoiceDate} onChange={(event) => onInvoiceChange("invoiceDate", event.target.value)} />
        </label>
        <label className="field">
          <span>Due date</span>
          <input type="date" value={invoice.dueDate} onChange={(event) => onInvoiceChange("dueDate", event.target.value)} />
        </label>
        <label className="field">
          <span>Currency</span>
          <select value={invoice.currency} onChange={(event) => onInvoiceChange("currency", event.target.value)}>
            {currencyOptions.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>GST rate (%)</span>
          <input type="number" min="0" step="0.01" value={invoice.gstRate} onChange={(event) => onInvoiceChange("gstRate", Number(event.target.value))} />
        </label>
        <label className="field">
          <span>Tax mode</span>
          <select value={invoice.taxMode} onChange={(event) => onInvoiceChange("taxMode", event.target.value)}>
            <option value="intra">Intra-state (CGST + SGST)</option>
            <option value="inter">Inter-state (IGST)</option>
          </select>
        </label>
        <label className="field">
          <span>Supplier ref</span>
          <input value={invoice.supplierRef} onChange={(event) => onInvoiceChange("supplierRef", event.target.value)} />
        </label>
        <label className="field">
          <span>Other ref</span>
          <input value={invoice.otherRef} onChange={(event) => onInvoiceChange("otherRef", event.target.value)} />
        </label>
        <label className="field">
          <span>Buyer order no.</span>
          <input value={invoice.buyerOrderNumber} onChange={(event) => onInvoiceChange("buyerOrderNumber", event.target.value)} />
        </label>
        <label className="field">
          <span>Dispatch doc no.</span>
          <input value={invoice.dispatchDocNo} onChange={(event) => onInvoiceChange("dispatchDocNo", event.target.value)} />
        </label>
        <label className="field">
          <span>Delivery note no.</span>
          <input value={invoice.deliveryNoteNo} onChange={(event) => onInvoiceChange("deliveryNoteNo", event.target.value)} />
        </label>
        <label className="field">
          <span>Destination</span>
          <input value={invoice.destination} onChange={(event) => onInvoiceChange("destination", event.target.value)} />
        </label>
        <label className="field field-span-2">
          <span>Terms of delivery</span>
          <textarea rows="2" value={invoice.termsOfDelivery} onChange={(event) => onInvoiceChange("termsOfDelivery", event.target.value)} />
        </label>
        <label className="field field-span-2">
          <span>Remarks</span>
          <textarea rows="3" value={invoice.remarks} onChange={(event) => onInvoiceChange("remarks", event.target.value)} />
        </label>
        <label className="field field-span-2">
          <span>Declaration</span>
          <textarea rows="3" value={invoice.declaration} onChange={(event) => onInvoiceChange("declaration", event.target.value)} />
        </label>
      </div>

      <div className="editor-section">
        <div className="section-header">
          <h3>Payment</h3>
        </div>
        <div className="field-grid">
          <label className="field">
            <span>Payment status</span>
            <select value={invoice.paymentStatus || "unpaid"} onChange={(event) => onInvoiceChange("paymentStatus", event.target.value)}>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>
          </label>
          <label className="field">
            <span>Payment mode</span>
            <select value={invoice.paymentMode || ""} onChange={(event) => onInvoiceChange("paymentMode", event.target.value)}>
              <option value="">Select mode</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="UPI">UPI</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="Card">Card</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <label className="field">
            <span>Amount paid ({currencyConfig.code})</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={Number(convertInrToCurrency(Number(invoice.amountPaidInr || 0), invoice.currency).toFixed(2))}
              onChange={(event) => onInvoiceChange("amountPaidInr", convertCurrencyToInr(Number(event.target.value || 0), invoice.currency))}
            />
          </label>
          <label className="field">
            <span>Payment date</span>
            <input type="date" value={invoice.paymentDate || ""} onChange={(event) => onInvoiceChange("paymentDate", event.target.value)} />
          </label>
          <label className="field field-span-2">
            <span>Payment reference</span>
            <input
              value={invoice.paymentReference || ""}
              onChange={(event) => onInvoiceChange("paymentReference", event.target.value)}
              placeholder="UTR / Transaction ID / Cheque No"
            />
          </label>
          <label className="field field-span-2">
            <span>Payment details</span>
            <textarea
              rows="3"
              value={invoice.paymentDetails || ""}
              onChange={(event) => onInvoiceChange("paymentDetails", event.target.value)}
              placeholder="Any additional payment notes"
            />
          </label>
        </div>
      </div>

      <div className="editor-section">
        <div className="section-header">
          <h3>Buyer</h3>
        </div>
        <div className="field-grid">
          <label className="field field-span-2">
            <span>Company name</span>
            <input value={invoice.buyer.companyName} onChange={(event) => onBuyerChange("companyName", event.target.value)} />
          </label>
          <label className="field field-span-2">
            <span>Address line 1</span>
            <input value={invoice.buyer.addressLine1} onChange={(event) => onBuyerChange("addressLine1", event.target.value)} />
          </label>
          <label className="field field-span-2">
            <span>Address line 2</span>
            <input value={invoice.buyer.addressLine2} onChange={(event) => onBuyerChange("addressLine2", event.target.value)} />
          </label>
          <label className="field field-span-2">
            <span>Address line 3</span>
            <input value={invoice.buyer.addressLine3} onChange={(event) => onBuyerChange("addressLine3", event.target.value)} />
          </label>
          <label className="field">
            <span>GST no.</span>
            <input value={invoice.buyer.gstNumber} onChange={(event) => onBuyerChange("gstNumber", event.target.value)} />
          </label>
          <label className="field">
            <span>Email</span>
            <input value={invoice.buyer.email} onChange={(event) => onBuyerChange("email", event.target.value)} />
          </label>
        </div>
      </div>

      <div className="editor-section">
        <div className="section-header">
          <h3>Consignee</h3>
        </div>
        <div className="field-grid">
          <label className="field">
            <span>Name</span>
            <input value={invoice.consignee.name} onChange={(event) => onConsigneeChange("name", event.target.value)} />
          </label>
          <label className="field">
            <span>Address line 1</span>
            <input value={invoice.consignee.addressLine1} onChange={(event) => onConsigneeChange("addressLine1", event.target.value)} />
          </label>
          <label className="field">
            <span>Address line 2</span>
            <input value={invoice.consignee.addressLine2} onChange={(event) => onConsigneeChange("addressLine2", event.target.value)} />
          </label>
          <label className="field">
            <span>Address line 3</span>
            <input value={invoice.consignee.addressLine3} onChange={(event) => onConsigneeChange("addressLine3", event.target.value)} />
          </label>
        </div>
      </div>

      <div className="editor-section">
        <div className="section-header">
          <h3>Items</h3>
          <button className="primary-button" type="button" onClick={onAddItem}>
            Add item
          </button>
        </div>
        <div className="stack">
          {invoice.items.map((item, index) => (
            <InvoiceItemRow
              key={item.id}
              invoice={invoice}
              item={item}
              index={index}
              onItemChange={onItemChange}
              onRemoveItem={onRemoveItem}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
