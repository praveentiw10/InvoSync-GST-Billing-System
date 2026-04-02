import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { currencyOptions } from "../data/defaults";

const SMALL_NUMBERS = [
  "Zero",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen"
];

const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const SCALES = ["", "Thousand", "Million", "Billion"];

function convertHundreds(number) {
  if (number < 20) {
    return SMALL_NUMBERS[number];
  }

  if (number < 100) {
    const remainder = number % 10;
    return `${TENS[Math.floor(number / 10)]}${remainder ? ` ${SMALL_NUMBERS[remainder]}` : ""}`;
  }

  const remainder = number % 100;
  return `${SMALL_NUMBERS[Math.floor(number / 100)]} Hundred${remainder ? ` ${convertHundreds(remainder)}` : ""}`;
}

function integerToWords(number) {
  if (number === 0) {
    return SMALL_NUMBERS[0];
  }

  let remaining = number;
  let scaleIndex = 0;
  const parts = [];

  while (remaining > 0) {
    const chunk = remaining % 1000;

    if (chunk) {
      const label = SCALES[scaleIndex];
      parts.unshift(`${convertHundreds(chunk)}${label ? ` ${label}` : ""}`);
    }

    remaining = Math.floor(remaining / 1000);
    scaleIndex += 1;
  }

  return parts.join(" ").trim();
}

export function getCurrencyConfig(code) {
  return currencyOptions.find((option) => option.code === code) ?? currencyOptions[0];
}

export function convertInrToCurrency(amountInr, currencyCode) {
  const config = getCurrencyConfig(currencyCode);
  return amountInr / config.rate;
}

export function convertCurrencyToInr(amount, currencyCode) {
  const config = getCurrencyConfig(currencyCode);
  return amount * config.rate;
}

export function formatMoney(amountInr, currencyCode) {
  const config = getCurrencyConfig(currencyCode);
  const converted = convertInrToCurrency(amountInr, currencyCode);

  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.code,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  }).format(converted);
}

export function calculateInvoiceTotals(invoice) {
  const subtotalInr = invoice.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.rateInr || 0), 0);
  const gstValueInr = subtotalInr * (Number(invoice.gstRate || 0) / 100);
  const cgstInr = invoice.taxMode === "intra" ? gstValueInr / 2 : 0;
  const sgstInr = invoice.taxMode === "intra" ? gstValueInr / 2 : 0;
  const igstInr = invoice.taxMode === "inter" ? gstValueInr : 0;
  const totalInr = subtotalInr + cgstInr + sgstInr + igstInr;

  return {
    subtotalInr,
    gstValueInr,
    cgstInr,
    sgstInr,
    igstInr,
    totalInr
  };
}

export function amountInWords(amountInr, currencyCode) {
  const config = getCurrencyConfig(currencyCode);
  const converted = convertInrToCurrency(amountInr, currencyCode);
  const wholePart = Math.floor(converted);
  const decimalPart = Math.round((converted - wholePart) * 100);
  const decimalText = decimalPart ? ` and ${integerToWords(decimalPart)} Cents` : "";

  return `${config.code} ${integerToWords(wholePart)}${decimalText} ${config.suffix}`.replace(/\s+/g, " ").trim();
}

export async function buildInvoicePdf(invoiceElement, fileName) {
  // The element lives inside a CSS scale() transform for the sidebar preview.
  // We must remove that transform before capturing so html2canvas sees the
  // full-size 794px layout, then restore it afterwards.
  const scaleParent = invoiceElement.parentElement;
  const prevTransform = scaleParent ? scaleParent.style.transform : "";
  const prevWidth = scaleParent ? scaleParent.style.width : "";
  if (scaleParent) {
    scaleParent.style.transform = "none";
    scaleParent.style.width = `${invoiceElement.scrollWidth}px`;
  }

  const canvas = await html2canvas(invoiceElement, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true,
    width: invoiceElement.scrollWidth,
    height: invoiceElement.scrollHeight,
    windowWidth: invoiceElement.scrollWidth,
    windowHeight: invoiceElement.scrollHeight,
  });

  // Restore the transform
  if (scaleParent) {
    scaleParent.style.transform = prevTransform;
    scaleParent.style.width = prevWidth;
  }

  const imageData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");

  const pageWidth = 210;   // A4 mm
  const pageHeight = 297;  // A4 mm

  // Scale image to fit exactly one A4 page width; shrink height proportionally
  const imgWidthMm = pageWidth;
  const imgHeightMm = (canvas.height * pageWidth) / canvas.width;

  if (imgHeightMm <= pageHeight) {
    // Fits on one page — vertically center if shorter than A4
    const yOffset = (pageHeight - imgHeightMm) / 2;
    pdf.addImage(imageData, "PNG", 0, yOffset, imgWidthMm, imgHeightMm);
  } else {
    // Content taller than one page — scale down to fit height too
    const scale = pageHeight / imgHeightMm;
    const scaledWidth = imgWidthMm * scale;
    const xOffset = (pageWidth - scaledWidth) / 2;
    pdf.addImage(imageData, "PNG", xOffset, 0, scaledWidth, pageHeight);
  }

  const blob = pdf.output("blob");

  if (fileName) {
    pdf.save(fileName);
  }

  return { blob };
}

export async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
