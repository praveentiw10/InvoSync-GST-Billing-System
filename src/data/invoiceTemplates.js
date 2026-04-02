export const invoiceTemplates = [
  {
    id: "classic",
    name: "Classic GST",
    description: "Current tax invoice layout with detailed GST breakdown.",
    recommended: true
  },
  {
    id: "modern",
    name: "Modern Blue",
    description: "Card-style sections with a clean contemporary look.",
    recommended: false
  },
  {
    id: "minimal",
    name: "Minimal Mono",
    description: "Simple monochrome layout for concise invoices.",
    recommended: false
  },
  {
    id: "corporate",
    name: "Corporate Accent",
    description: "Strong header bar with premium business styling.",
    recommended: false
  },
  {
    id: "ledger",
    name: "Ledger Grid",
    description: "Accounting-first format focused on tabular clarity.",
    recommended: false
  },
  {
    id: "compact",
    name: "Compact Stripe",
    description: "Space-efficient format for dense one-page invoices.",
    recommended: false
  }
];

export const RECOMMENDED_INVOICE_TEMPLATE_ID =
  invoiceTemplates.find((template) => template.recommended)?.id || invoiceTemplates[0].id;

export function getInvoiceTemplate(templateId) {
  return invoiceTemplates.find((template) => template.id === templateId) || invoiceTemplates[0];
}
