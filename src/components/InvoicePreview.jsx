import ClassicInvoicePreview from "./invoiceTemplates/ClassicInvoicePreview";
import TemplateVariantsPreview from "./invoiceTemplates/TemplateVariantsPreview";
import { getInvoiceTemplate } from "../data/invoiceTemplates";

export default function InvoicePreview({ invoice, companyProfile, invoiceRef }) {
  const template = getInvoiceTemplate(invoice?.templateId);

  if (template.id === "classic") {
    return <ClassicInvoicePreview invoice={invoice} companyProfile={companyProfile} invoiceRef={invoiceRef} />;
  }

  return (
    <TemplateVariantsPreview
      invoice={invoice}
      companyProfile={companyProfile}
      invoiceRef={invoiceRef}
      templateId={template.id}
    />
  );
}
