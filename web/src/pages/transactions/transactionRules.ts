import type { TransactionPayload } from '../../api/types';
import {
  ADVANCE_SUBTYPES_BY_DIRECTION,
  PARTY_TYPE_MATCHERS,
  PAYMENT_MODES,
  REQUIRED_MEMBER_TYPES,
  SHARE_AMOUNT_FIELDS,
  TRANSACTION_SUBTYPES,
  TRANSACTION_TYPES,
  PARTY_VISIBLE_TYPES,
  MEMBER_VISIBLE_TYPES,
  LAYOUT_VISIBLE_TYPES,
  TRANSACTION_DIRECTIONS,
  VALID_DIRECTIONS_BY_TYPE,
  VALID_TYPES_BY_DIRECTION,
} from './transactionConstants';

export { SHARE_AMOUNT_FIELDS };

const ZERO = '0';

export function inputValue(value: string | number | null | undefined) {
  return value === null || value === undefined ? '' : String(value);
}

export function blankTransaction(memberId = ''): TransactionPayload {
  return {
    cashbookNo: '',
    cashbookPage: '',
    transactionDate: new Date().toISOString().slice(0, 10),
    direction: 'IN',
    type: 'SHARE',
    subType: '',
    memberId: null,
    partyId: null,
    layoutId: null,
    fromLayoutId: null,
    toLayoutId: null,
    shareAmount: '0',
    shareFeeAmount: '0',
    membershipFeeAmount: '0',
    siteDepositAmount: '0',
    welfareFundAmount: '0',
    booksFormsAmount: '0',
    miscellaneousAmount: '0',
    otherAmount: '0',
    totalAmount: '0',
    fromAccountId: null,
    toAccountId: null,
    receiptNo: null,
    paymentMode: null,
    chequeNo: null,
    chequeDate: null,
    bankReferenceNo: null,
    referenceTransactionId: null,
    description: null,
    remarks: null,
    createdBy: memberId,
    updatedBy: null,
  };
}

export function getAllowedDirections(type: string): readonly TransactionPayload['direction'][] {
  return (VALID_DIRECTIONS_BY_TYPE[type as keyof typeof VALID_DIRECTIONS_BY_TYPE] ??
    TRANSACTION_DIRECTIONS) as readonly TransactionPayload['direction'][];
}

export function getAllowedTypes(direction: string): readonly TransactionPayload['type'][] {
  return (VALID_TYPES_BY_DIRECTION[direction as keyof typeof VALID_TYPES_BY_DIRECTION] ??
    TRANSACTION_TYPES) as readonly TransactionPayload['type'][];
}

export function getSubtypeOptions(type: string, direction?: TransactionPayload['direction']) {
  const options = TRANSACTION_SUBTYPES[type] ?? [];

  if (type !== 'ADVANCE' || !direction) {
    return options;
  }

  if (direction !== 'IN' && direction !== 'OUT') {
    return options;
  }

  const allowed = ADVANCE_SUBTYPES_BY_DIRECTION[direction] ?? [];
  return options.filter(option => allowed.some(allowedOption => allowedOption === option));
}

export function isSubtypeRequired(type: string) {
  return ['EXPENSE', 'INCOME', 'ADVANCE', 'ASSET', 'OTHER'].includes(type);
}

export function isMemberRequired(type: string) {
  return REQUIRED_MEMBER_TYPES.has(type);
}

export function isMemberVisible(type: string) {
  return MEMBER_VISIBLE_TYPES.has(type);
}

export function isPartyVisible(type: string) {
  return PARTY_VISIBLE_TYPES.has(type);
}

export function isLayoutVisible(type: string) {
  return LAYOUT_VISIBLE_TYPES.has(type);
}

export function isLayoutTransfer(form: TransactionPayload) {
  return form.type === 'LAYOUT' && form.direction === 'TRANSFER';
}

export function getFilteredParties(
  parties: Array<{ id: string; name: string; partyType: string }>,
  form: TransactionPayload,
) {
  if (!isPartyVisible(form.type)) {
    return [];
  }

  const preferred = (() => {
    if (form.type === 'EXPENSE' && form.subType === 'RENT') return PARTY_TYPE_MATCHERS.EXPENSE_RENT;
    if (form.type === 'EXPENSE' && form.subType === 'SALARY')
      return PARTY_TYPE_MATCHERS.EXPENSE_SALARY;
    if (form.type === 'EXPENSE' && form.subType === 'FURNITURE')
      return PARTY_TYPE_MATCHERS.EXPENSE_FURNITURE;
    if (form.type === 'ADVANCE' && form.subType === 'DIRECTOR_ADVANCE')
      return PARTY_TYPE_MATCHERS.ADVANCE_DIRECTOR_ADVANCE;
    if (form.type === 'ADVANCE' && form.subType === 'DIRECTOR_ADVANCE_RETURN')
      return PARTY_TYPE_MATCHERS.ADVANCE_DIRECTOR_ADVANCE;
    if (form.type === 'ADVANCE' && form.subType === 'DEVELOPER_ADVANCE')
      return PARTY_TYPE_MATCHERS.ADVANCE_DEVELOPER_ADVANCE;
    if (form.type === 'ADVANCE' && form.subType === 'DEVELOPER_ADVANCE_RETURN')
      return PARTY_TYPE_MATCHERS.ADVANCE_DEVELOPER_ADVANCE;
    if (form.type === 'ADVANCE' && form.subType === 'PRESIDENT_ADVANCE')
      return PARTY_TYPE_MATCHERS.ADVANCE_DIRECTOR_ADVANCE;
    if (form.type === 'ADVANCE' && form.subType === 'PRESIDENT_ADVANCE_RETURN')
      return PARTY_TYPE_MATCHERS.ADVANCE_DIRECTOR_ADVANCE;
    if (form.type === 'ADVANCE' && form.subType === 'SECRETARY_ADVANCE')
      return PARTY_TYPE_MATCHERS.ADVANCE_DIRECTOR_ADVANCE;
    if (form.type === 'ADVANCE' && form.subType === 'SECRETARY_ADVANCE_RETURN')
      return PARTY_TYPE_MATCHERS.ADVANCE_DIRECTOR_ADVANCE;
    if (
      form.type === 'ADVANCE' &&
      (form.subType === 'OTHER_ADVANCE' || form.subType === 'OTHER_ADVANCE_RETURN')
    )
      return PARTY_TYPE_MATCHERS.ADVANCE_OTHER;
    if (form.type === 'ASSET' && form.subType === 'BUILDING_ADVANCE')
      return PARTY_TYPE_MATCHERS.ASSET_BUILDING_ADVANCE;
    if (form.type === 'ASSET' && form.subType === 'FURNITURE')
      return PARTY_TYPE_MATCHERS.ASSET_FURNITURE;
    return PARTY_TYPE_MATCHERS.OTHER;
  })();

  const allowed = new Set(preferred);
  return parties.filter(party => !allowed.size || allowed.has(party.partyType));
}

export function calculateTotalAmount(form: TransactionPayload) {
  const amountFields = getApplicableAmountFields(form) as Array<keyof TransactionPayload>;
  return amountFields
    .reduce((sum, field) => {
      const value = Number(form[field] ?? '0');
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0)
    .toString();
}

export function getApplicableAmountFields(form: TransactionPayload) {
  if (form.type === 'SHARE') {
    return form.direction === 'IN'
      ? (SHARE_AMOUNT_FIELDS.map(([name]) => name) as Array<keyof TransactionPayload>)
      : (['shareAmount'] as Array<keyof TransactionPayload>);
  }

  if (form.type === 'LAYOUT') {
    return ['siteDepositAmount'] as Array<keyof TransactionPayload>;
  }

  return ['otherAmount'] as Array<keyof TransactionPayload>;
}

function zeroUnrelatedAmountFields(next: TransactionPayload) {
  const allAmountFields = [
    'shareAmount',
    'shareFeeAmount',
    'membershipFeeAmount',
    'siteDepositAmount',
    'welfareFundAmount',
    'booksFormsAmount',
    'miscellaneousAmount',
    'otherAmount',
  ] as const;

  const applicable = new Set(getApplicableAmountFields(next));

  for (const field of allAmountFields) {
    if (!applicable.has(field)) {
      next[field] = ZERO;
    }
  }

  next.totalAmount = calculateTotalAmount(next);
}

function normalizePaymentFields(next: TransactionPayload) {
  if (next.type === 'LAYOUT' && next.direction === 'TRANSFER') {
    next.paymentMode = null;
    next.receiptNo = null;
    next.chequeNo = null;
    next.chequeDate = null;
    next.bankReferenceNo = null;
    return;
  }

  if (next.paymentMode === 'CASH') {
    next.chequeNo = null;
    next.chequeDate = null;
    next.bankReferenceNo = null;
    return;
  }

  if (next.paymentMode === 'CHEQUE') {
    next.bankReferenceNo = null;
    return;
  }

  if (next.paymentMode === 'BANK_TRANSFER' || next.paymentMode === 'UPI') {
    next.chequeNo = null;
    next.chequeDate = null;
    return;
  }

  if (next.paymentMode === 'OTHER') {
    next.chequeNo = null;
    next.chequeDate = null;
  }
}

function normalizeAccountFields(next: TransactionPayload) {
  if (next.direction === 'IN') {
    next.fromAccountId = null;
  }

  if (next.direction === 'OUT') {
    next.toAccountId = null;
  }

  if (next.direction === 'TRANSFER') {
    if (next.fromAccountId === next.toAccountId) {
      next.toAccountId = null;
    }
  }
}

function normalizeLayoutFields(next: TransactionPayload) {
  if (next.type !== 'LAYOUT') {
    next.layoutId = null;
    next.fromLayoutId = null;
    next.toLayoutId = null;
    return;
  }

  if (next.direction === 'TRANSFER') {
    next.layoutId = null;
    next.fromLayoutId = next.fromLayoutId ?? null;
    next.toLayoutId = next.toLayoutId ?? null;
    return;
  }

  next.fromLayoutId = null;
  next.toLayoutId = null;
  next.layoutId = next.layoutId ?? null;
}

function normalizeMemberAndPartyFields(next: TransactionPayload) {
  if (!isMemberVisible(next.type)) {
    next.memberId = null;
  }

  if (!isPartyVisible(next.type)) {
    next.partyId = null;
  }

  if (!isLayoutVisible(next.type)) {
    next.layoutId = null;
  }
}

export function normalizeTransaction(form: TransactionPayload): TransactionPayload {
  const next: TransactionPayload = {
    ...blankTransaction(),
    ...form,
  };

  if (!TRANSACTION_TYPES.includes(next.type as (typeof TRANSACTION_TYPES)[number])) {
    next.type = 'OTHER';
  }

  const allowedDirections = getAllowedDirections(next.type);
  if (!allowedDirections.includes(next.direction)) {
    next.direction = allowedDirections[0] ?? 'IN';
  }

  const allowedTypes = getAllowedTypes(next.direction);
  if (!allowedTypes.includes(next.type)) {
    next.type = allowedTypes[0] ?? 'SHARE';
  }

  if (next.type === 'BANK') {
    next.subType = '';
  } else if (!isSubtypeRequired(next.type)) {
    next.subType = '';
  } else if (!getSubtypeOptions(next.type, next.direction).includes(next.subType)) {
    next.subType = '';
  }

  if (next.type === 'SHARE') {
    next.partyId = null;
    next.layoutId = null;
    next.fromLayoutId = null;
    next.toLayoutId = null;
    next.siteDepositAmount = ZERO;
    next.otherAmount = ZERO;
    next.shareAmount = next.shareAmount || ZERO;
    if (next.direction !== 'IN') {
      next.shareFeeAmount = ZERO;
      next.membershipFeeAmount = ZERO;
      next.welfareFundAmount = ZERO;
      next.booksFormsAmount = ZERO;
      next.miscellaneousAmount = ZERO;
    }
  }

  if (next.type === 'LAYOUT') {
    next.partyId = null;
    next.shareAmount = ZERO;
    next.shareFeeAmount = ZERO;
    next.membershipFeeAmount = ZERO;
    next.welfareFundAmount = ZERO;
    next.booksFormsAmount = ZERO;
    next.miscellaneousAmount = ZERO;
    next.otherAmount = ZERO;
    if (next.direction !== 'TRANSFER') {
      next.fromLayoutId = null;
      next.toLayoutId = null;
    }
  }

  if (next.type === 'BANK') {
    next.memberId = null;
    next.partyId = null;
    next.layoutId = null;
    next.fromLayoutId = null;
    next.toLayoutId = null;
    next.subType = '';
    next.shareAmount = ZERO;
    next.shareFeeAmount = ZERO;
    next.membershipFeeAmount = ZERO;
    next.siteDepositAmount = ZERO;
    next.welfareFundAmount = ZERO;
    next.booksFormsAmount = ZERO;
    next.miscellaneousAmount = ZERO;
    next.otherAmount = next.otherAmount || ZERO;
  }

  if (['EXPENSE', 'INCOME', 'ADVANCE', 'ASSET', 'OTHER'].includes(next.type)) {
    next.shareAmount = ZERO;
    next.shareFeeAmount = ZERO;
    next.membershipFeeAmount = ZERO;
    next.welfareFundAmount = ZERO;
    next.booksFormsAmount = ZERO;
    next.miscellaneousAmount = ZERO;
    next.siteDepositAmount = ZERO;
    next.otherAmount = next.otherAmount || ZERO;
  }

  if (!isMemberVisible(next.type)) {
    next.memberId = null;
  }

  if (!isPartyVisible(next.type)) {
    next.partyId = null;
  }

  if (!isLayoutVisible(next.type)) {
    next.layoutId = null;
  }

  normalizeMemberAndPartyFields(next);
  normalizeLayoutFields(next);
  normalizeAccountFields(next);
  normalizePaymentFields(next);
  zeroUnrelatedAmountFields(next);

  return next;
}

export function buildTransactionPayload(
  form: TransactionPayload,
  actorMemberId: string,
  isEditing: boolean,
) {
  const next = normalizeTransaction(form);

  const payload: TransactionPayload = {
    ...next,
    cashbookNo: next.cashbookNo === '' || next.cashbookNo === null ? null : Number(next.cashbookNo),
    cashbookPage:
      next.cashbookPage === '' || next.cashbookPage === null ? null : Number(next.cashbookPage),
    memberId: isMemberVisible(next.type) ? next.memberId || null : null,
    partyId: isPartyVisible(next.type) ? next.partyId || null : null,
    layoutId: isLayoutVisible(next.type) ? next.layoutId || null : null,
    fromLayoutId:
      next.type === 'LAYOUT' && next.direction === 'TRANSFER' ? next.fromLayoutId || null : null,
    toLayoutId:
      next.type === 'LAYOUT' && next.direction === 'TRANSFER' ? next.toLayoutId || null : null,
    shareAmount: next.type === 'SHARE' ? next.shareAmount : '0',
    shareFeeAmount: next.type === 'SHARE' && next.direction === 'IN' ? next.shareFeeAmount : '0',
    membershipFeeAmount:
      next.type === 'SHARE' && next.direction === 'IN' ? next.membershipFeeAmount : '0',
    siteDepositAmount: next.type === 'LAYOUT' ? next.siteDepositAmount : '0',
    welfareFundAmount:
      next.type === 'SHARE' && next.direction === 'IN' ? next.welfareFundAmount : '0',
    booksFormsAmount:
      next.type === 'SHARE' && next.direction === 'IN' ? next.booksFormsAmount : '0',
    miscellaneousAmount:
      next.type === 'SHARE' && next.direction === 'IN' ? next.miscellaneousAmount : '0',
    otherAmount: ['BANK', 'EXPENSE', 'INCOME', 'ADVANCE', 'ASSET', 'OTHER'].includes(next.type)
      ? next.otherAmount
      : '0',
    totalAmount: calculateTotalAmount(next),
    fromAccountId: next.direction === 'IN' ? null : next.fromAccountId || null,
    toAccountId: next.direction === 'OUT' ? null : next.toAccountId || null,
    receiptNo:
      next.type === 'LAYOUT' && next.direction === 'TRANSFER' ? null : next.receiptNo || null,
    paymentMode:
      next.type === 'LAYOUT' && next.direction === 'TRANSFER' ? null : next.paymentMode || null,
    chequeNo:
      next.type === 'LAYOUT' && next.direction === 'TRANSFER' ? null : next.chequeNo || null,
    chequeDate:
      next.type === 'LAYOUT' && next.direction === 'TRANSFER' ? null : next.chequeDate || null,
    bankReferenceNo:
      next.type === 'LAYOUT' && next.direction === 'TRANSFER' ? null : next.bankReferenceNo || null,
    referenceTransactionId: next.referenceTransactionId || null,
    description: next.description || null,
    remarks: next.remarks || null,
    ...(isEditing ? { updatedBy: actorMemberId } : { createdBy: actorMemberId }),
  };

  if (next.type === 'LAYOUT' && next.direction === 'TRANSFER') {
    payload.paymentMode = null;
    payload.receiptNo = null;
    payload.chequeNo = null;
    payload.chequeDate = null;
    payload.bankReferenceNo = null;
  }

  return payload;
}

export function resolveCashbookImage(
  cashbookNo: string | number | null,
  cashbookPage: string | number | null,
) {
  const no = inputValue(cashbookNo);
  const page = inputValue(cashbookPage);

  if (!/^\d+$/.test(no) || !/^\d+$/.test(page)) {
    return null;
  }

  return `/cashbook/${no}/${page}`;
}

export function getPaymentModeOptions() {
  return [...PAYMENT_MODES];
}
