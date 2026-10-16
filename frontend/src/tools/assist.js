// Local "AI assist" helpers — deterministic text generators (no network needed).
export const invoiceTerms = (d) => ({
  notes: `Thank you for your business. Please quote invoice ${d.invoiceNo || ''} on all payments and correspondence.`,
  terms: `Payment is due within 15 days of the invoice date.\nPay via bank transfer to ${d.company || 'our account'}.\nA 2% monthly charge may apply to overdue balances.\nGoods remain the property of ${d.company || 'the seller'} until paid in full.`,
});

export const voucherInstructions = (d) => ({
  instructions: `Pay the full amount before ${d.dueDate || 'the due date'} to avoid a late fee.\nKeep this voucher safe — bring it when paying at the bank.\nFees once paid are non-refundable.\nFor any query, contact the school accounts office.`,
});

export const datesheetInstructions = (d) => ({
  instructions: `Bring this date sheet and your admit card to every paper.\nReach the exam center at least 30 minutes before the start time.\nMobile phones and smart devices are not allowed in the exam hall.\nUse only blue or black ink and write your roll number clearly.`,
});
