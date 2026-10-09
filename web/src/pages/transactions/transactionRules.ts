import type { TransactionPayload } from '../../api/types';
import {
  PAYMENT_MODES,
  TRANSACTION_AMOUNT_FIELDS,
  TRANSACTION_SUBTYPE_SUGGESTIONS,
  TRANSACTION_TYPES,
} from './transactionConstants';

const ZERO = '0';

export type TransactionAmountField = (typeof TRANSACTION_AMOUNT_FIELDS)[number][0];

export interface TransactionFieldConfig {
  isValid: boolean;
  showTotalAmount: boolean;
  showMember: boolean;
  requiredMember: boolean;
  showParty: boolean;
  requiredParty: boolean;
  showLayout: boolean;
  requiredLayout: boolean;
  amountFields: readonly TransactionAmountField[];
  allowPaymentDetails: boolean;
}

const shareCreditAmounts: readonly TransactionAmountField[] = [
  'shareAmount',
  'shareFeeAmount',
  'membershipFeeAmount',
  'welfareFundAmount',
  'booksFormsAmount',
  'miscellaneousAmount',
  'otherAmount',
];

function normalizedSubtype(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
}

export function getTransactionFormConfig(
  type: TransactionPayload['type'],
  subType: string,
): TransactionFieldConfig {
  const subtype = normalizedSubtype(subType);
  const config = {
    isValid: true,
    showTotalAmount: false,
    showMember: false,
    requiredMember: false,
    showParty: false,
    requiredParty: false,
    showLayout: false,
    requiredLayout: false,
    amountFields: ['otherAmount'] as readonly TransactionAmountField[],
    allowPaymentDetails: true,
  };

  if (type !== 'CREDIT' && type !== 'DEBIT') {
    return { ...config, isValid: false, amountFields: [] };
  }

  if (subtype === 'SHARE') {
    return {
      ...config,
      showTotalAmount: type === 'CREDIT',
      showMember: true,
      requiredMember: true,
      amountFields: type === 'CREDIT' ? shareCreditAmounts : ['shareAmount'],
    };
  }

  if (subtype === 'SITE') {
    return {
      ...config,
      showMember: true,
      requiredMember: true,
      showLayout: true,
      requiredLayout: true,
      amountFields: ['siteDepositAmount'],
    };
  }

  if (subtype === 'ADVANCE') {
    return {
      ...config,
      showParty: true,
      requiredParty: true,
      showLayout: true,
      requiredLayout: true,
    };
  }

  if (subtype === 'BANK' || subtype === 'EXPENSE') {
    if (subtype === 'EXPENSE' && type !== 'DEBIT') {
      return { ...config, isValid: false, amountFields: [] };
    }
    return { ...config, showParty: true, requiredParty: true };
  }

  if (subtype === 'OTHER') {
    return { ...config, showMember: true, showParty: true };
  }

  return { ...config, isValid: false, amountFields: [] };
}

export function getTransactionSubtypes(type: TransactionPayload['type']) {
  return TRANSACTION_SUBTYPE_SUGGESTIONS.filter(
    subtype => subtype !== 'EXPENSE' || type === 'DEBIT',
  );
}

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
  const transactionDate = getLocalDateInputValue();
  return {
    transactionDate,
    cashbookNo: '1',
    cashbookPage: '1',
    type: 'CREDIT',
    subType: '',
    memberId: null,
    partyId: null,
    layoutId: null,
    shareAmount: '',
    shareFeeAmount: '',
    membershipFeeAmount: '',
    siteDepositAmount: '',
    welfareFundAmount: '',
    booksFormsAmount: '',
    miscellaneousAmount: '',
    otherAmount: '',
    totalAmount: ZERO,
    receiptNo: null,
    paymentMode: 'CASH',
    chequeNo: null,
    chequeDate: transactionDate,
    bankReferenceNo: null,
    remarks: null,
    createdBy: memberId || undefined,
  };
}

function normalizePartyType(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[\s_-]+/g, '');
}

function dateOnly(value: string | null | undefined) {
  return value?.slice(0, 10) ?? '';
}

export function getFilteredParties(
  parties: Array<{
    id: string;
    name: string;
    partyType: string;
    startDate: string;
    endDate: string | null;
  }>,
  form: TransactionPayload,
) {
  const subtype = normalizedSubtype(form.subType);
  if (!getTransactionFormConfig(form.type, subtype).showParty) return [];
  const allowedType = subtype === 'BANK' || subtype === 'EXPENSE' ? subtype : null;
  const transactionDate = dateOnly(form.transactionDate);
  return parties.filter(party => {
    const startDate = dateOnly(party.startDate);
    const endDate = dateOnly(party.endDate);
    const isActiveOnTransactionDate =
      Boolean(transactionDate && startDate) &&
      startDate <= transactionDate &&
      (!endDate || transactionDate <= endDate);
    const hasAllowedType = !allowedType || normalizePartyType(party.partyType) === allowedType;
    return isActiveOnTransactionDate && hasAllowedType;
  });
}

function toMinorUnits(value: string | number | null | undefined) {
  const text = inputValue(value).trim();
  if (!text) return 0n;
  const match = /^(\d+)(?:\.(\d{0,2}))?$/.exec(text);
  if (!match) return 0n;
  return BigInt(match[1]) * 100n + BigInt((match[2] ?? '').padEnd(2, '0'));
}

function fromMinorUnits(value: bigint) {
  return `${value / 100n}.${String(value % 100n).padStart(2, '0')}`;
}

export function calculateTotalAmount(form: TransactionPayload) {
  const config = getTransactionFormConfig(form.type, form.subType);
  const total = config.amountFields.reduce((sum, field) => sum + toMinorUnits(form[field]), 0n);
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

  if (next.type !== 'CREDIT' && next.type !== 'DEBIT') next.type = 'CREDIT';
  next.totalAmount = calculateTotalAmount(next);
  return next;
}

export function buildTransactionPayload(
  form: TransactionPayload,
  actorMemberId: string,
  isEditing: boolean,
): TransactionPayload {
  const next = normalizeTransaction(form);
  const config = getTransactionFormConfig(next.type, next.subType);
  const activeAmounts = new Set(config.amountFields);
  const chequePayment = next.paymentMode === 'CHEQUE';
  const bankTransfer = next.paymentMode === 'BANK_TRANSFER';
  return {
    transactionDate: next.transactionDate,
    cashbookNo: next.cashbookNo === '' || next.cashbookNo === null ? null : Number(next.cashbookNo),
    cashbookPage:
      next.cashbookPage === '' || next.cashbookPage === null ? null : Number(next.cashbookPage),
    type: next.type,
    subType: next.subType.trim(),
    memberId: config.showMember ? next.memberId || null : null,
    partyId: config.showParty ? next.partyId || null : null,
    layoutId: config.showLayout ? next.layoutId || null : null,
    shareAmount: activeAmounts.has('shareAmount') ? next.shareAmount || ZERO : ZERO,
    shareFeeAmount: activeAmounts.has('shareFeeAmount') ? next.shareFeeAmount || ZERO : ZERO,
    membershipFeeAmount: activeAmounts.has('membershipFeeAmount')
      ? next.membershipFeeAmount || ZERO
      : ZERO,
    siteDepositAmount: activeAmounts.has('siteDepositAmount')
      ? next.siteDepositAmount || ZERO
      : ZERO,
    welfareFundAmount: activeAmounts.has('welfareFundAmount')
      ? next.welfareFundAmount || ZERO
      : ZERO,
    booksFormsAmount: activeAmounts.has('booksFormsAmount') ? next.booksFormsAmount || ZERO : ZERO,
    miscellaneousAmount: activeAmounts.has('miscellaneousAmount')
      ? next.miscellaneousAmount || ZERO
      : ZERO,
    otherAmount: activeAmounts.has('otherAmount') ? next.otherAmount || ZERO : ZERO,
    totalAmount: calculateTotalAmount(next),
    receiptNo: config.showTotalAmount ? next.receiptNo || null : null,
    paymentMode: next.paymentMode || null,
    chequeNo: chequePayment ? next.chequeNo || null : null,
    chequeDate: chequePayment ? next.chequeDate || null : null,
    bankReferenceNo: bankTransfer ? next.bankReferenceNo || null : null,
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
