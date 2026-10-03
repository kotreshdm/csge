export interface MemberQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  memberType?: string;
  status?: string;
  gender?: string;
  city?: string;
  district?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface Party {
  id: string;
  name: string;
  partyType: string;
  status: string;
  mobile: string | null;
  address: string | null;
  details: string | null;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PartiesResponse {
  success: boolean;
  message: string;
  data: {
    items: Party[];
  };
}

export interface PartyPayload {
  name: string;
  partyType: string;
  status: string;
  mobile: string;
  address: string;
  details: string;
  startDate: string;
  endDate: string;
}

export interface LayoutPrice {
  id: string;
  layoutId: string;
  pricePerSqFt: string;
  validFrom: string;
  validTo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Layout {
  id: string;
  layoutCode: string;
  name: string;
  location: string | null;
  address: string | null;
  surveyNumbers: string | null;
  developerIds: string[];
  description: string | null;
  otherDetails: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  prices: LayoutPrice[];
}

export interface LayoutPayload {
  layoutCode: string;
  name: string;
  location: string;
  address: string;
  surveyNumbers: string;
  developerIds: string[];
  description: string;
  otherDetails: string;
  status: string;
}

export interface LayoutPricePayload {
  pricePerSqFt: string;
  validFrom: string;
  validTo: string;
}

export interface Account {
  id: string;
  accountCode: string;
  name: string;
  accountType: string;
  accountNumber: string | null;
  bankName: string | null;
  openingBalance: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AccountPayload {
  accountCode: string;
  name: string;
  accountType: string;
  accountNumber: string;
  bankName: string;
  openingBalance: string;
  isActive: boolean;
}

export interface Director {
  id: string;
  memberId: string;
  position: string;
  quota: string;
  term: number;
  fromDate: string;
  toDate: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
  member: {
    memberId: string;
    memberCode: string;
    name: string;
    nameKannada: string | null;
    status: string;
  };
}

export interface DirectorPayload {
  memberId: string;
  position: string;
  quota: string;
  term: number;
  fromDate: string;
  toDate: string;
  remarks: string;
}

export interface GbmLetterReturn {
  id: string;
  memberId: string;
  gbmDate: string;
  letterDate: string | null;
  returnDate: string;
  returnReason: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
  member: {
    memberId: string;
    memberCode: string;
    name: string;
    nameKannada: string | null;
    status: string;
  };
}

export interface GbmLetterReturnPayload {
  memberId: string;
  gbmDate: string;
  letterDate: string;
  returnDate: string;
  returnReason: string;
  remarks: string;
}

export interface MemberAddressHistory {
  id: string;
  memberId: string;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  district: string | null;
  addressLine1Kannada: string | null;
  addressLine2Kannada: string | null;
  cityKannada: string | null;
  districtKannada: string | null;
  postalCode: string | null;
  fromDate: string;
  toDate: string | null;
  createdAt: string;
  member: {
    memberId: string;
    memberCode: string;
    name: string;
    nameKannada: string | null;
  };
}

export interface ChequeRange {
  id: string;
  accountId: string;
  startChequeNo: string;
  endChequeNo: string;
  receivedDate: string;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
  account: Pick<Account, 'id' | 'accountCode' | 'name'>;
}

export interface ChequeRangePayload {
  accountId: string;
  startChequeNo: string;
  endChequeNo: string;
  receivedDate: string;
  remarks: string;
}

export interface CancelledCheque {
  id: string;
  accountId: string;
  chequeNo: string;
  cancelledDate: string;
  reason: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
  account: Pick<Account, 'id' | 'accountCode' | 'name'>;
}

export interface CancelledChequePayload {
  accountId: string;
  chequeNo: string;
  cancelledDate: string;
  reason: string;
  remarks: string;
}

export interface CancelledReceipt {
  id: string;
  receiptNo: string;
  cancelledDate: string;
  reason: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CancelledReceiptPayload {
  receiptNo: string;
  cancelledDate: string;
  reason: string;
  remarks: string;
}

export interface Transaction {
  id: string;
  cashbookNo: number | null;
  cashbookPage: number | null;
  transactionDate: string;
  direction: 'IN' | 'OUT' | 'TRANSFER';
  type: 'SHARE' | 'LAYOUT' | 'BANK' | 'EXPENSE' | 'INCOME' | 'ADVANCE' | 'ASSET' | 'OTHER';
  subType: string;
  memberId: string | null;
  partyId: string | null;
  layoutId: string | null;
  fromLayoutId: string | null;
  toLayoutId: string | null;
  shareAmount: string;
  shareFeeAmount: string;
  membershipFeeAmount: string;
  siteDepositAmount: string;
  welfareFundAmount: string;
  booksFormsAmount: string;
  miscellaneousAmount: string;
  otherAmount: string;
  totalAmount: string;
  fromAccountId: string | null;
  toAccountId: string | null;
  receiptNo: string | null;
  paymentMode: 'CASH' | 'CHEQUE' | 'BANK_TRANSFER' | 'UPI' | 'OTHER' | null;
  chequeNo: string | null;
  chequeDate: string | null;
  bankReferenceNo: string | null;
  referenceTransactionId: string | null;
  description: string | null;
  remarks: string | null;
  createdBy: string;
  updatedBy: string | null;
}

export type TransactionPayload = Omit<
  Transaction,
  'id' | 'createdBy' | 'updatedBy' | 'cashbookNo' | 'cashbookPage'
> & {
  cashbookNo: number | string | null;
  cashbookPage: number | string | null;
  createdBy?: string;
  updatedBy?: string | null;
};

export interface PaginatedMembersResponse {
  items: Array<{
    memberId: string;
    memberCode: string;
    recieptNo?: string | null;
    name: string;
    nameKannada?: string | null;
    careOfName: string;
    careOfNameKannada?: string | null;
    mobile?: string | null;
    memberType?: string | null;
    status?: string | null;
    gender?: string | null;
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    district?: string | null;
    addressLine1Kannada?: string | null;
    addressLine2Kannada?: string | null;
    cityKannada?: string | null;
    districtKannada?: string | null;
    postalCode?: string | null;
    joinDate?: string | null;
    createdAt?: string;
  }>;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CreateMemberPayload {
  memberCode?: string;
  recieptNo?: string;
  joinDate?: string;
  name?: string;
  nameKannada?: string;
  careOfName?: string;
  careOfNameKannada?: string;
  mobile?: string;
  memberType?: string;
  status?: string;
  gender?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  district?: string;
  addressLine1Kannada?: string;
  addressLine2Kannada?: string;
  cityKannada?: string;
  districtKannada?: string;
  postalCode?: string;
  fatherName?: string;
  fatherNameKannada?: string;
  spouseName?: string;
  spouseNameKannada?: string;
  dob?: string;
  alternateMobile?: string;
  email?: string;
  aadhaarNumber?: string;
  panNumber?: string;
  otherId?: string;
  nomineeName?: string;
  nomineeRelation?: string;
  nomineeMobile?: string;
  nomineeEmail?: string;
  nomineeAddress?: string;
  nomineeDateOfBirth?: string;
  occupation?: string;
  permanentAddress?: string;
  officeAddress?: string;
  remarks?: string;
}

export interface UploadMembersResponse {
  success: boolean;
  message: string;
  data?: {
    filename: string;
    size: number;
    totalRows?: number;
    createdRows?: number;
    failedRows?: number;
    created?: Array<{
      row: number;
      memberId: string;
      memberCode: string;
      name: string;
    }>;
    failed?: Array<{
      row: number;
      memberCode: string;
      name: string;
      error: string;
    }>;
  };
}
