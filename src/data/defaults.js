import { RECOMMENDED_INVOICE_TEMPLATE_ID } from "./invoiceTemplates";

const today = new Date().toISOString().slice(0, 10);

export const currencyOptions = [
  {
    code: "INR",
    label: "INR",
    locale: "en-IN",
    symbol: "₹",
    rate: 1,
    suffix: "Only"
  },
  {
    code: "USD",
    label: "USD",
    locale: "en-US",
    symbol: "$",
    rate: 83.1,
    suffix: "Only"
  },
  {
    code: "EUR",
    label: "EUR",
    locale: "de-DE",
    symbol: "€",
    rate: 90.4,
    suffix: "Only"
  }
];

export const defaultCompanyProfile = {
  logo: "assets/brs-logo.jpg",
  signature: "",
  qrCode: "assets/payment-qr.jpg",
  name: "BRS CONSULTING",
  tagline: "BUSINESS RISK STRATEGY",
  addressLine1: "8 Deepkunj Society, Opp Novino,",
  addressLine2: "Makarpura Road, Vadodara - 390010, Gujarat.",
  email: "consult@brsconsulting.in",
  phone: "9879671769",
  gst: "24AZLPK3103E1ZV",
  pan: "AZLPK3103E",
  accountType: "Current A/c",
  bankName: "Kotak Mahindra Bank",
  accountNumber: "9150231524",
  branch: "Tarsali",
  ifsc: "KKBK0000843"
};

export const defaultInvoice = {
  id: `INV-${Date.now()}`,
  templateId: RECOMMENDED_INVOICE_TEMPLATE_ID,
  invoiceNumber: "",
  invoiceDate: today,
  dueDate: today,
  supplierRef: "",
  otherRef: "",
  buyerOrderNumber: "",
  dispatchDocNo: "",
  deliveryNoteNo: "",
  dispatchedThrough: "",
  destination: "",
  termsOfDelivery: "Professional consulting services as agreed.",
  paymentStatus: "unpaid",
  paymentMode: "",
  amountPaidInr: 0,
  paymentDate: "",
  paymentReference: "",
  paymentDetails: "",
  currency: "INR",
  gstRate: 18,
  taxMode: "intra",
  buyer: {
    companyName: "MAMO TECHNOLABS LLP",
    addressLine1: "4th Floor, 27, 28 & 29, Raama Emperio",
    addressLine2: "Nr Shell Petrol Pump, Opp Army Campus,",
    addressLine3: "Makarpura Road, Manjalpur, Vadodara - 390011",
    gstNumber: "24ABTFM0075F1Z8",
    email: "",
    phone: ""
  },
  consignee: {
    name: "-",
    addressLine1: "",
    addressLine2: "",
    addressLine3: ""
  },
  remarks: "Being professional services provided for the above mentioned services.",
  declaration:
    "We declare that this invoice shows the actual price of the services described and that all particulars are true and correct.",
  items: [
    {
      id: `item-${Date.now()}`,
      description: "Professional Fees",
      details: "Retainer fees for business consulting, home loan and startup benefits.",
      hsnSac: "998312",
      quantity: 1,
      unit: "Service",
      rateInr: 525000
    }
  ]
};
