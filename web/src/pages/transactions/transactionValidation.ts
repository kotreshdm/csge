import type { TransactionPayload } from '../../api/types';
import { TRANSACTION_AMOUNT_FIELDS, TRANSACTION_TYPES } from './transactionConstants';
import { calculateTotalAmount } from './transactionRules';

export type ValidationErrors = Record<string, string>;

export function validateTransaction(form: TransactionPayload): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!form.transactionDate) {
    errors.transactionDate = 'Transaction date is required.';
  }

  const cashbookNo = String(form.cashbookNo ?? '').trim();
  const cashbookPage = String(form.cashbookPage ?? '').trim();
  if (cashbookNo && (!/^\d+$/.test(cashbookNo) || Number(cashbookNo) <= 0)) {
    errors.cashbookNo = 'Cashbook number must be a positive whole number.';
  }
  if (cashbookPage && (!/^\d+$/.test(cashbookPage) || Number(cashbookPage) <= 0)) {
    errors.cashbookPage = 'Cashbook page must be a positive whole number.';
  }
  if (Boolean(cashbookNo) !== Boolean(cashbookPage)) {
    errors.cashbookNo = 'Enter both cashbook number and page to save a reference.';
    errors.cashbookPage = 'Enter both cashbook number and page to save a reference.';
  }

  if (!TRANSACTION_TYPES.includes(form.type)) {
    errors.type = 'Transaction type is required.';
  }

  if (!form.subType.trim()) {
    errors.subType = 'Sub-type is required.';
  }

  let invalidAmount = false;
  for (const [field, label] of TRANSACTION_AMOUNT_FIELDS) {
    const value = form[field]?.trim() ?? '';
    if (value && !/^\d+(?:\.\d{1,2})?$/.test(value)) {
      errors[field] = `${label} must be a non-negative amount with at most 2 decimal places.`;
      invalidAmount = true;
    }
  }

  if (!form.totalAmount || !/^\d+(?:\.\d{1,2})?$/.test(form.totalAmount)) {
    errors.totalAmount = 'Total amount must be a non-negative amount.';
  } else if (!invalidAmount && form.totalAmount !== calculateTotalAmount(form)) {
    errors.totalAmount = 'Total amount must match the sum of the amount fields.';
  }

  return errors;
}
