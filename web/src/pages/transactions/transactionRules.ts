import type { TransactionPayload } from '../../api/types';
import {
  PAYMENT_MODES,
  TRANSACTION_AMOUNT_FIELDS,
  TRANSACTION_SUBTYPE_SUGGESTIONS,
  TRANSACTION_TYPES,
} from './transactionConstants';

const ZERO = '0';
const amountKeys = TRANSACTION_AMOUNT_FIELDS.map(([field]) => field);

export function inputValue(value: string | number | null | undefined) {
  return value === null || value === undefined ? '' : String(value);
}

export function getLocalDateInputValue(date: Date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function blankTransaction(memberId = ''): TransactionPayload {
  return {
    transactionDate: getLocalDateInputValue(),
    cashbookNo: '',
    cashbookPage: '',
    type: 'CREDIT',
    subType: '',
    memberId: null,
    partyId: null,
    layoutId: null,
    shareAmount: ZERO,
    shareFeeAmount: ZERO,
    applicationFeeAmount: ZERO,
    admissionFeeAmount: ZERO,
    membershipFeeAmount: ZERO,
    siteDepositAmount: ZERO,
    welfareFundAmount: ZERO,
    booksFormsAmount: ZERO,
    miscellaneousAmount: ZERO,
    otherAmount: ZERO,
    totalAmount: ZERO,
    receiptNo: null,
    paymentMode: null,
    chequeNo: null,
    chequeDate: null,
    bankReferenceNo: null,
    remarks: null,
    createdBy: memberId || undefined,
  };
}

function subtypeKey(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[\\s-]+/g, '_');
}

export function isMemberVisible(subType: string) {
  const subtype = subtypeKey(subType);
  return subtype.includes('SHARE') || subtype.includes('SITE') || subtype === 'LAYOUT_TRANSFER';
}

export function isPartyVisible(subType: string) {
  const subtype = subtypeKey(subType);
  return (
    subtype.includes('ADVANCE') ||
    subtype === 'SALARY' ||
    subtype === 'RENT' ||
    subtype.startsWith('BANK_')
  );
}

export function isLayoutVisible(subType: string) {
  const subtype = subtypeKey(subType);
  return subtype.includes('SITE') || subtype.includes('LAYOUT') || subtype.includes('ADVANCE');
}

function normalizePartyType(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[\\s_-]+/g, '');
}

export function getFilteredParties(
  parties: Array<{ id: string; name: string; partyType: string }>,
  form: TransactionPayload,
) {
  const subtype = subtypeKey(form.subType);
  if (!isPartyVisible(subtype)) return [];
  const allowedType =
    subtype === 'SALARY'
      ? 'EMPLOYEE'
      : subtype === 'RENT'
        ? 'LANDLORD'
        : subtype.startsWith('BANK_')
          ? 'BANK'
          : null;
  return allowedType
    ? parties.filter(party => normalizePartyType(party.partyType) === allowedType)
    : parties;
}

function toMinorUnits(value: string | number | null | undefined) {
  const text = inputValue(value).trim();
  if (!text) return 0n;
  const match = /^(\\d+)(?:\\.(\\d{0,2}))?$/.exec(text);
  if (!match) return 0n;
  return BigInt(match[1]) * 100n + BigInt((match[2] ?? '').padEnd(2, '0'));
}

function fromMinorUnits(value: bigint) {
  return `${value / 100n}.${String(value % 100n).padStart(2, '0')}`;
}

export function calculateTotalAmount(form: TransactionPayload) {
  const total = amountKeys.reduce((sum, field) => sum + toMinorUnits(form[field]), 0n);
  return fromMinorUnits(total);
}

export function normalizeTransaction(form: TransactionPayload): TransactionPayload {
  const next: TransactionPayload = {
    ...blankTransaction(),
    ...form,
    transactionDate:
      typeof form.transactionDate === 'string' && form.transactionDate.length >= 10
        ? form.transactionDate.slice(0, 10)
        : getLocalDateInputValue(),
    subType: typeof form.subType === 'string' ? form.subType : '',
  };

  if (!TRANSACTION_TYPES.includes(next.type)) next.type = 'CREDIT';
  for (const field of amountKeys) {
    if (next[field] === '') next[field] = ZERO;
  }
  next.totalAmount = calculateTotalAmount(next);
  return next;
}

export function buildTransactionPayload(
  form: TransactionPayload,
  actorMemberId: string,
  isEditing: boolean,
): TransactionPayload {
  const next = normalizeTransaction(form);
  return {
    transactionDate: next.transactionDate,
    cashbookNo: next.cashbookNo === '' || next.cashbookNo === null ? null : Number(next.cashbookNo),
    cashbookPage:
      next.cashbookPage === '' || next.cashbookPage === null ? null : Number(next.cashbookPage),
    type: next.type,
    subType: next.subType.trim(),
    memberId: next.memberId || null,
    partyId: next.partyId || null,
    layoutId: next.layoutId || null,
    shareAmount: next.shareAmount || ZERO,
    shareFeeAmount: next.shareFeeAmount || ZERO,
    applicationFeeAmount: next.applicationFeeAmount || ZERO,
    admissionFeeAmount: next.admissionFeeAmount || ZERO,
    membershipFeeAmount: next.membershipFeeAmount || ZERO,
    siteDepositAmount: next.siteDepositAmount || ZERO,
    welfareFundAmount: next.welfareFundAmount || ZERO,
    booksFormsAmount: next.booksFormsAmount || ZERO,
    miscellaneousAmount: next.miscellaneousAmount || ZERO,
    otherAmount: next.otherAmount || ZERO,
    totalAmount: calculateTotalAmount(next),
    receiptNo: next.receiptNo || null,
    paymentMode: next.paymentMode || null,
    chequeNo: next.chequeNo || null,
    chequeDate: next.chequeDate || null,
    bankReferenceNo: next.bankReferenceNo || null,
    remarks: next.remarks || null,
    ...(isEditing ? { updatedBy: actorMemberId } : { createdBy: actorMemberId }),
  };
}

export function getPaymentModeOptions() {
  return [...PAYMENT_MODES];
}

export function resolveCashbookImage(
  cashbookNo: string | number | null,
  cashbookPage: string | number | null,
) {
  const number = inputValue(cashbookNo);
  const page = inputValue(cashbookPage);

  if (!/^\d+$/.test(number) || !/^\d+$/.test(page)) return null;
  return `/cashbook/${number}/${page}`;
}

export function getTransactionTypes() {
  return [...TRANSACTION_TYPES];
}

export function getTransactionSubtypeSuggestions() {
  return [...TRANSACTION_SUBTYPE_SUGGESTIONS];
}
