export const TRANSACTION_TYPES = ['CREDIT', 'DEBIT'] as const;

export const PAYMENT_MODES = ['CASH', 'CHEQUE', 'BANK_TRANSFER', 'UPI', 'OTHER'] as const;

export const TRANSACTION_AMOUNT_FIELDS = [
  ['shareAmount', 'Share amount'],
  ['shareFeeAmount', 'Share fee'],
  ['applicationFeeAmount', 'Application fee'],
  ['admissionFeeAmount', 'Admission fee'],
  ['membershipFeeAmount', 'Membership fee'],
  ['siteDepositAmount', 'Site deposit'],
  ['welfareFundAmount', 'Welfare fund'],
  ['booksFormsAmount', 'Books & forms'],
  ['miscellaneousAmount', 'Miscellaneous'],
  ['otherAmount', 'Other'],
] as const;

export const TRANSACTION_SUBTYPE_SUGGESTIONS = [
  'SHARE_PAYMENT',
  'SHARE_WITHDRAWAL',
  'SITE_DEPOSIT',
  'SITE_WITHDRAWAL',
  'LAYOUT_TRANSFER',
  'ADVANCE',
  'ADVANCE_RETURN',
  'SALARY',
  'RENT',
  'BANK_WITHDRAWAL',
  'BANK_DEPOSIT',
  'AUDIT_FEES',
  'ACCOUNT_MAINTENANCE',
  'MAINTENANCE',
  'CLEANING',
  'TRAVEL',
  'ELECTRICITY',
  'TELEPHONE',
  'OFFICE_EXPENSE',
  'MISCELLANEOUS',
] as const;
