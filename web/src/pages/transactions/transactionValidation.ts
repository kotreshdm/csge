import type { TransactionPayload } from '../../api/types';
import { TRANSACTION_AMOUNT_FIELDS } from './transactionConstants';
import { calculateTotalAmount, getTransactionFormConfig } from './transactionRules';

export type ValidationErrors = Record<string, string>;

export function validateTransaction(
  form: TransactionPayload,
  memberJoinDate?: string | null,
): ValidationErrors {
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

  if (form.type !== 'CREDIT' && form.type !== 'DEBIT') {
    errors.type = 'Transaction type is required.';
  }

  const config = getTransactionFormConfig(form.type, form.subType);
  if (!form.subType.trim() || !config.isValid) {
    errors.subType = 'Select a valid sub-type for this transaction type.';
  }
  if (config.requiredMember && !form.memberId) {
    errors.memberId = 'Select a member for this transaction subtype.';
  }
  if (form.memberId) {
    const joinDate = memberJoinDate?.slice(0, 10);
    const transactionDate = form.transactionDate.slice(0, 10);
    if (!joinDate) {
      errors.memberId = 'The selected member has no joining date and cannot be used.';
    } else if (joinDate > transactionDate) {
      errors.memberId = 'The selected member joined after the transaction date.';
    }
  }
  if (config.requiredParty && !form.partyId) {
    errors.partyId = 'Select a party for this transaction subtype.';
  }
  if (config.requiredLayout && !form.layoutId) {
    errors.layoutId = 'Select a layout for this transaction.';
  }

  let invalidAmount = false;
  const amountLabels = new Map(TRANSACTION_AMOUNT_FIELDS);
  for (const field of config.amountFields) {
    const label = amountLabels.get(field) ?? field;
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
  } else if (Number(form.totalAmount) <= 0) {
    errors.totalAmount = 'Total amount must be greater than zero.';
  }

  if (form.paymentMode === 'CHEQUE') {
    if (!form.chequeNo?.trim()) errors.chequeNo = 'Cheque number is required for cheque payment.';
    if (!form.chequeDate) errors.chequeDate = 'Cheque date is required for cheque payment.';
  }
  if (form.paymentMode === 'BANK_TRANSFER' && !form.bankReferenceNo?.trim()) {
    errors.bankReferenceNo = 'Bank reference is required for bank transfer.';
  }

  return errors;
}
