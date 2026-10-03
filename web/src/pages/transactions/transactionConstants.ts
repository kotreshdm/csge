export const TRANSACTION_TYPES = [
  'SHARE',
  'LAYOUT',
  'BANK',
  'EXPENSE',
  'INCOME',
  'ADVANCE',
  'ASSET',
  'OTHER',
] as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const TRANSACTION_DIRECTIONS = ['IN', 'OUT', 'TRANSFER'] as const;
export type TransactionDirection = (typeof TRANSACTION_DIRECTIONS)[number];

export const PAYMENT_MODES = ['CASH', 'CHEQUE', 'BANK_TRANSFER', 'UPI', 'OTHER'] as const;

export const VALID_DIRECTIONS_BY_TYPE: Record<TransactionType, readonly TransactionDirection[]> = {
  SHARE: ['IN', 'OUT'],
  LAYOUT: ['IN', 'OUT', 'TRANSFER'],
  BANK: ['IN', 'OUT'],
  EXPENSE: ['OUT'],
  INCOME: ['IN'],
  ADVANCE: ['IN', 'OUT'],
  ASSET: ['IN', 'OUT'],
  OTHER: ['IN', 'OUT'],
};

export const VALID_TYPES_BY_DIRECTION: Record<TransactionDirection, readonly TransactionType[]> = {
  IN: ['SHARE', 'LAYOUT', 'BANK', 'INCOME', 'ADVANCE', 'ASSET', 'OTHER'],
  OUT: ['SHARE', 'LAYOUT', 'BANK', 'EXPENSE', 'ADVANCE', 'ASSET', 'OTHER'],
  TRANSFER: ['LAYOUT', 'BANK'],
};

export const SHARE_AMOUNT_FIELDS = [
  ['shareAmount', 'Share amount'],
  ['shareFeeAmount', 'Share fee'],
  ['membershipFeeAmount', 'Membership fee'],
  ['welfareFundAmount', 'Welfare fund'],
  ['booksFormsAmount', 'Books/forms'],
  ['miscellaneousAmount', 'Miscellaneous'],
] as const;

export const ADVANCE_SUBTYPES_BY_DIRECTION = {
  IN: [
    'DIRECTOR_ADVANCE',
    'DEVELOPER_ADVANCE',
    'EMPLOYEE_SECURITY_DEPOSIT',
    'PRESIDENT_ADVANCE',
    'SECRETARY_ADVANCE',
    'OTHER_ADVANCE',
  ],
  OUT: [
    'DIRECTOR_ADVANCE_RETURN',
    'DEVELOPER_ADVANCE_RETURN',
    'EMPLOYEE_SECURITY_DEPOSIT_RETURN',
    'PRESIDENT_ADVANCE_RETURN',
    'SECRETARY_ADVANCE_RETURN',
    'OTHER_ADVANCE_RETURN',
  ],
} as const;

export const TRANSACTION_SUBTYPES: Record<string, string[]> = {
  SHARE: [],
  LAYOUT: [],
  BANK: [],
  EXPENSE: [
    'SALARY',
    'RENT',
    'CLEANING',
    'WATER',
    'ELECTRICITY',
    'TELEPHONE',
    'TRAVEL',
    'FURNITURE',
    'OFFICE',
    'PRINTING',
    'MAINTENANCE',
    'MEETING',
    'AUDITOR',
    'GBM',
    'OTHER',
  ],
  INCOME: ['BANK_INTEREST', 'DEVELOPER_INTEREST', 'SITE_SALE_INCOME', 'DONATION', 'OTHER_INCOME'],
  ADVANCE: [
    'DIRECTOR_ADVANCE',
    'DIRECTOR_ADVANCE_RETURN',
    'DEVELOPER_ADVANCE',
    'DEVELOPER_ADVANCE_RETURN',
    'EMPLOYEE_SECURITY_DEPOSIT',
    'EMPLOYEE_SECURITY_DEPOSIT_RETURN',
    'PRESIDENT_ADVANCE',
    'PRESIDENT_ADVANCE_RETURN',
    'SECRETARY_ADVANCE',
    'SECRETARY_ADVANCE_RETURN',
    'OTHER_ADVANCE',
    'OTHER_ADVANCE_RETURN',
  ],
  ASSET: ['BUILDING_ADVANCE', 'FURNITURE', 'TELEPHONE_ADVANCE', 'OTHER_ASSET'],
  OTHER: ['OTHER'],
};

export const REQUIRED_MEMBER_TYPES = new Set(['SHARE', 'LAYOUT']);
export const MEMBER_VISIBLE_TYPES = new Set(['SHARE', 'LAYOUT']);
export const PARTY_VISIBLE_TYPES = new Set(['EXPENSE', 'ADVANCE', 'ASSET', 'OTHER']);
export const LAYOUT_VISIBLE_TYPES = new Set(['LAYOUT', 'ADVANCE', 'ASSET', 'OTHER']);

export const PARTY_TYPE_MATCHERS: Record<string, string[]> = {
  EXPENSE_RENT: ['LANDLORD'],
  EXPENSE_SALARY: ['EMPLOYEE'],
  EXPENSE_FURNITURE: ['VENDOR'],
  ADVANCE_DIRECTOR_ADVANCE: ['DIRECTOR', 'PRESIDENT', 'CHIEF PROMOTER', 'SECRETARY'],
  ADVANCE_DEVELOPER_ADVANCE: ['DEVELOPER'],
  ADVANCE_EMPLOYEE_ADVANCE: ['EMPLOYEE'],
  ADVANCE_OTHER: [
    'DIRECTOR',
    'PRESIDENT',
    'CHIEF PROMOTER',
    'SECRETARY',
    'DEVELOPER',
    'VENDOR',
    'BUILDING_OWNER',
  ],
  ASSET_BUILDING_ADVANCE: ['BUILDING_OWNER'],
  ASSET_FURNITURE: ['VENDOR'],
  OTHER: [
    'VENDOR',
    'LANDLORD',
    'EMPLOYEE',
    'DIRECTOR',
    'PRESIDENT',
    'SECRETARY',
    'DEVELOPER',
    'BUILDING_OWNER',
  ],
};
