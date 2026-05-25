export function getInvoiceFilename(invoiceNumber: string | undefined): string {
  if (!invoiceNumber) {
    return "Sri_Swathi_Tyres_Invoice.pdf";
  }
  const cleanNumber = invoiceNumber.replace(/[^a-zA-Z0-9_-]/g, "");
  return `Sri_Swathi_Tyres_${cleanNumber}`;
}
