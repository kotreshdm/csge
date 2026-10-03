import type { TransactionPayload } from '../../api/types';
import {
  calculateTotalAmount,
  getSubtypeOptions,
  isMemberVisible,
  isPartyVisible,
  isSubtypeRequired,
} from './transactionRules';

export type ValidationErrors = Record<string, string>;

export function validateTransaction(form: TransactionPayload): ValidationErrors {
  const errors: ValidationErrors = {};

  const cashbookNo =
    form.cashbookNo === '' || form.cashbookNo === null ? null : Number(form.cashbookNo);
  const cashbookPage =
    form.cashbookPage === '' || form.cashbookPage === null ? null : Number(form.cashbookPage);

  if (form.cashbookNo === '' || form.cashbookNo === null || form.cashbookNo === undefined) {
    errors.cashbookNo = 'Cashbook number is required.';
  } else if (!Number.isInteger(cashbookNo) || Number(cashbookNo) <= 0) {
    errors.cashbookNo = 'Cashbook number must be a positive integer.';
  }

  if (form.cashbookPage === '' || form.cashbookPage === null || form.cashbookPage === undefined) {
    errors.cashbookPage = 'Cashbook page is required.';
  } else if (!Number.isInteger(cashbookPage) || Number(cashbookPage) <= 0) {
    errors.cashbookPage = 'Cashbook page must be a positive integer.';
  }

  if (!form.transactionDate) {
    errors.transactionDate = 'Transaction date is required.';
  }

  if (!form.direction) {
    errors.direction = 'Direction is required.';
  }

  if (!form.type) {
    errors.type = 'Transaction type is required.';
  }

  if (isSubtypeRequired(form.type) && !form.subType) {
    errors.subType = 'Sub-type is required for this transaction type.';
  }

  if (!isSubtypeRequired(form.type) && form.subType) {
    if (form.type !== 'BANK' && form.type !== 'SHARE' && form.type !== 'LAYOUT') {
      const allowed = getSubtypeOptions(form.type, form.direction);
      if (allowed.length && !allowed.includes(form.subType)) {
        errors.subType = 'Invalid sub-type for this transaction type.';
      }
    }
  }

  if (form.type === 'SHARE' || form.type === 'LAYOUT') {
    if (!form.memberId) {
      errors.memberId = 'Member is required for this transaction type.';
    }
  }

  if (form.type === 'LAYOUT' && !form.layoutId) {
    errors.layoutId = 'Layout is required for this transaction type.';
  }

  if (form.type === 'BANK' && !form.accountId) {
    errors.accountId = 'Account is required for bank transactions.';
  }

  if (form.type === 'SHARE' && form.direction === 'IN' && !form.receiptNo) {
    errors.receiptNo = 'Receipt number is required for share receipts.';
  }

  if (form.type === 'SHARE' && form.direction === 'OUT') {
    if (!form.chequeNo) {
      errors.chequeNo = 'Cheque number is required for share withdrawals.';
    }
    if (!form.chequeDate) {
      errors.chequeDate = 'Cheque date is required for share withdrawals.';
    }
  }

  if (form.type === 'LAYOUT' && form.direction === 'IN' && !form.receiptNo) {
    errors.receiptNo = 'Receipt number is required for layout deposits.';
  }

  if (form.type === 'LAYOUT' && form.direction === 'OUT') {
    if (!form.chequeNo) {
      errors.chequeNo = 'Cheque number is required for layout withdrawals.';
    }
    if (!form.chequeDate) {
      errors.chequeDate = 'Cheque date is required for layout withdrawals.';
    }
  }

  if (form.paymentMode === 'CASH') {
    if (form.chequeNo || form.chequeDate || form.bankReferenceNo) {
      errors.paymentMode = 'Cash payments cannot include cheque or bank reference fields.';
    }
  }

  if (form.paymentMode === 'CHEQUE') {
    if (!form.chequeNo) {
      errors.chequeNo = 'Cheque number is required when payment mode is CHEQUE.';
    }
    if (!form.chequeDate) {
      errors.chequeDate = 'Cheque date is required when payment mode is CHEQUE.';
    }
    if (form.bankReferenceNo) {
      errors.bankReferenceNo = 'Bank reference is not allowed when payment mode is CHEQUE.';
    }
  }

  if (form.paymentMode === 'BANK_TRANSFER' || form.paymentMode === 'UPI') {
    if (!form.bankReferenceNo) {
      errors.bankReferenceNo =
        'Bank reference is required when payment mode is BANK_TRANSFER or UPI.';
    }
    if (form.chequeNo || form.chequeDate) {
      errors.chequeNo = 'Cheque fields must be empty when payment mode is BANK_TRANSFER or UPI.';
      errors.chequeDate = 'Cheque fields must be empty when payment mode is BANK_TRANSFER or UPI.';
    }
  }

  if (isMemberVisible(form.type) && form.memberId === '') {
    errors.memberId = 'Member is required for this transaction type.';
  }

  if (isPartyVisible(form.type) && form.partyId === '') {
    errors.partyId = 'Party is required for this transaction type.';
  }

  const totalValue = Number(calculateTotalAmount(form));
  if (Number(form.totalAmount ?? '0') !== totalValue) {
    errors.totalAmount = 'Total amount must match the sum of applicable fields.';
  }

  if (totalValue < 0) {
    errors.totalAmount = 'Transaction amounts cannot be negative.';
  }

  return errors;
}
