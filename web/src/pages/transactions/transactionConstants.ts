export const TRANSACTION_TYPES = ['CREDIT', 'DEBIT'] as const;

export const PAYMENT_MODES = ['CASH', 'CHEQUE', 'BANK_TRANSFER', 'UPI', 'OTHER'] as const;

export const TRANSACTION_AMOUNT_FIELDS = [
  ['shareAmount', 'Share amount'],
  ['shareFeeAmount', 'Share fee'],
  ['membershipFeeAmount', 'Membership fee'],
  ['siteDepositAmount', 'Site deposit'],
  ['welfareFundAmount', 'Welfare fund'],
  ['booksFormsAmount', 'Books & forms'],
  ['miscellaneousAmount', 'Miscellaneous'],
  ['otherAmount', 'Other'],
] as const;

export const SHARE_TRANSACTION_AMOUNT_FIELDS = [
  ['shareAmount', 'Share amount'],
  ['shareFeeAmount', 'Share fee'],
  ['membershipFeeAmount', 'Membership fee'],
  ['welfareFundAmount', 'Welfare fund'],
  ['booksFormsAmount', 'Books & forms'],
  ['miscellaneousAmount', 'Miscellaneous'],
] as const;

export const TRANSACTION_SUBTYPE_SUGGESTIONS = [
  'SHARE',
  'SITE',
  'ADVANCE',
  'BANK',
  'EXPENSE',
  'OTHER',
] as const;
