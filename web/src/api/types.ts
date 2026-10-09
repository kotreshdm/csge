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

export interface Site {
  id: string;
  siteNo: string;
  layoutId: string;
  eastWest: string;
  northSouth: string;
  totalSqFeet: string;
  totalPrice: string;
  registeredAmount: string;
  allottedMemberId: string | null;
  allotmentDate: string | null;
  status: 'AVAILABLE' | 'TEMP_ALLOTTED' | 'ALLOTTED' | 'REGISTERED' | 'SETTLED';
  createdAt: string;
  updatedAt: string;
  layout: Pick<Layout, 'id' | 'layoutCode' | 'name'>;
  allottedMember: { memberId: string; memberCode: string; name: string } | null;
}

export interface SitePayload {
  siteNo: string;
  layoutId: string;
  eastWest: string;
  northSouth: string;
  totalSqFeet: string;
  totalPrice: string;
  registeredAmount: string;
  allottedMemberId: string | null;
  allotmentDate: string | null;
  status: Site['status'];
}

export interface LayoutPricePayload {
  pricePerSqFt: string;
  validFrom: string;
  validTo: string;
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
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    district: string | null;
    addressLine1Kannada: string | null;
    addressLine2Kannada: string | null;
    cityKannada: string | null;
    districtKannada: string | null;
    postalCode: string | null;
  };
}

export interface ChequeRange {
  id: string;
  partyId: string;
  startChequeNo: string;
  endChequeNo: string;
  receivedDate: string;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
  party: Pick<Party, 'id' | 'name' | 'partyType'>;
}

export interface ChequeRangePayload {
  partyId: string;
  startChequeNo: string;
  endChequeNo: string;
  receivedDate: string;
  remarks: string;
}

export interface CancelledCheque {
  id: string;
  partyId: string;
  chequeNo: string;
  cancelledDate: string;
  reason: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
  party: Pick<Party, 'id' | 'name' | 'partyType'>;
}

export interface CancelledChequePayload {
  partyId: string;
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
  transactionNo: string;
  transactionDate: string;
  cashbookNo: number | null;
  cashbookPage: number | null;
  type: 'CREDIT' | 'DEBIT' | 'LAYOUT_EXPENSE';
  subType: string;
  memberId: string | null;
  partyId: string | null;
  layoutId: string | null;
  shareAmount: string;
  shareFeeAmount: string;
  membershipFeeAmount: string;
  siteDepositAmount: string;
  welfareFundAmount: string;
  booksFormsAmount: string;
  miscellaneousAmount: string;
  otherAmount: string;
  totalAmount: string;
  receiptNo: string | null;
  paymentMode: 'CASH' | 'CHEQUE' | 'BANK_TRANSFER' | 'UPI' | 'OTHER' | null;
  chequeNo: string | null;
  chequeDate: string | null;
  bankReferenceNo: string | null;
  remarks: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  member?: { memberId: string; memberCode: string; name: string } | null;
  party?: { id: string; name: string; partyType: string } | null;
  layout?: { id: string; layoutCode: string; name: string } | null;
}

export interface TransactionPayload {
  transactionDate: string;
  cashbookNo: number | string | null;
  cashbookPage: number | string | null;
  type: Transaction['type'];
  subType: string;
  memberId: string | null;
  partyId: string | null;
  layoutId: string | null;
  shareAmount: string;
  shareFeeAmount: string;
  membershipFeeAmount: string;
  siteDepositAmount: string;
  welfareFundAmount: string;
  booksFormsAmount: string;
  miscellaneousAmount: string;
  otherAmount: string;
  totalAmount: string;
  receiptNo: string | null;
  paymentMode: Transaction['paymentMode'];
  chequeNo: string | null;
  chequeDate: string | null;
  bankReferenceNo: string | null;
  remarks: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface DashboardSummaryMonthlyEntry {
  key: string;
  label: string;
  income: string;
  expense: string;
  profitLoss: string;
}

export interface DashboardPositions {
  share: {
    totalAmount: string;
    totalInAmount: string;
    totalOutAmount: string;
    memberAmount: string;
    associateAmount: string;
    regularShareInAmount: string;
    regularShareOutAmount: string;
    associateShareInAmount: string;
    associateShareOutAmount: string;
    totalMemberCount: number;
    regularMemberCount: number;
    associateMemberCount: number;
    regularActiveMemberCount: number;
    regularInactiveMemberCount: number;
    associateActiveMemberCount: number;
    associateInactiveMemberCount: number;
  };
  siteDeposit: {
    totalAmount: string;
    totalInAmount: string;
    totalOutAmount: string;
    uniqueMemberCount: number;
    allottedMemberCount: number;
    registeredMemberCount: number;
    settledMemberCount: number;
    notAllottedMemberCount: number;
    layouts: Array<{
      id: string;
      name: string;
      layoutCode: string;
      amount: string;
      totalInAmount: string;
      totalOutAmount: string;
      uniqueMemberCount: number;
      allottedMemberCount: number;
      registeredMemberCount: number;
      settledMemberCount: number;
      notAllottedMemberCount: number;
    }>;
  };
}

export interface LayoutPaymentDashboard {
  layouts: Array<Pick<Layout, 'id' | 'layoutCode' | 'name'>>;
  selectedLayout: Pick<Layout, 'id' | 'layoutCode' | 'name'> | null;
  totals: {
    paid: string;
    returned: string;
    balance: string;
    memberCount: number;
  };
  items: Array<{
    memberId: string;
    memberCode: string;
    name: string;
    memberType: 'MEMBER' | 'ASSOCIATE' | 'SUPERUSER';
    status: string;
    paid: string;
    returned: string;
    balance: string;
  }>;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface LayoutMemberTransactionPage {
  items: Array<{
    id: string;
    transactionNo: string;
    transactionDate: string;
    type: 'CREDIT' | 'DEBIT';
    siteDepositAmount: string;
    totalAmount: string;
    receiptNo: string | null;
    paymentMode: Transaction['paymentMode'];
    chequeNo: string | null;
    remarks: string | null;
  }>;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DashboardRecentTransaction {
  id: string;
  transactionDate: string;
  totalAmount: string;
  type: 'CREDIT' | 'DEBIT' | 'LAYOUT_EXPENSE';
  subType: string;
  paymentMode: 'CASH' | 'CHEQUE' | 'BANK_TRANSFER' | 'UPI' | 'OTHER' | null;
  member?: { memberCode: string; name: string } | null;
  party?: { name: string } | null;
  layout?: { layoutCode: string; name: string } | null;
}

export interface DashboardAmountItem {
  label: string;
  amount: string;
}

export interface DashboardLayoutDeposit {
  id: string;
  label: string;
  amount: string;
  memberCount: number;
  received: string;
  withdrawn: string;
  transferIn: string;
  transferOut: string;
}

export interface DashboardAdvanceSubtype {
  subType: string;
  received: string;
  paid: string;
  net: string;
}

export interface DashboardAdvanceParty {
  id: string;
  name: string;
  partyType: string;
  given: string;
  received: string;
  balance: string;
}

export interface DashboardTransactionTypeSummary {
  type: Transaction['type'];
  count: number;
  amount: string;
}

export interface DashboardTransaction extends Omit<Transaction, 'member' | 'party' | 'layout'> {
  member: { memberCode: string; name: string } | null;
  party: { name: string; partyType: string } | null;
  layout: { layoutCode: string; name: string } | null;
}

export interface DashboardTransactionsPage {
  financialYear: string;
  items: DashboardTransaction[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DashboardMemberSummary {
  memberId: string;
  memberCode: string;
  name: string;
  memberType: 'MEMBER' | 'ASSOCIATE' | 'SUPERUSER';
  shareBalance: string;
  siteDepositBalance: string;
}

export interface DashboardSummary {
  financialYear: string;
  summary: {
    totalIncome: string;
    totalExpense: string;
    profitLoss: string;
    totalLiability: string;
    memberShareLiability: string;
    siteDepositLiability: string;
    advanceLiability: string;
    advanceReceivable: string;
    advancesGiven: string;
    advancesReceived: string;
    netAdvanceBalance: string;
    totalMemberShare: string;
    memberShare: string;
    associateShare: string;
    memberShareCount: number;
    associateShareCount: number;
    totalSiteDeposit: string;
    welfareFund: string;
    welfareFundReceived: string;
    welfareFundUsed: string;
    welfareFundCurrentBalance: string;
    welfareContributorCount: number;
    activeMembers: number;
    shareMemberCount: number;
    siteDepositMemberCount: number;
  };
  monthly: DashboardSummaryMonthlyEntry[];
  incomeBreakdown: DashboardAmountItem[];
  expenseBreakdown: DashboardAmountItem[];
  layoutDeposits: DashboardLayoutDeposit[];
  advanceSubtypeBreakdown: DashboardAdvanceSubtype[];
  advancePartyBreakdown: DashboardAdvanceParty[];
  transactionTypeSummary: DashboardTransactionTypeSummary[];
  transactionSubtypes: Array<{ type: Transaction['type']; subType: string }>;
  members: DashboardMemberSummary[];
  recentTransactions: DashboardRecentTransaction[];
}

export interface MemberTransactionDetailsItem {
  id: string;
  transactionNo: string;
  transactionDate: string;
  type: 'CREDIT' | 'DEBIT' | 'LAYOUT_EXPENSE';
  subType: string;
  paymentMode: 'CASH' | 'CHEQUE' | 'BANK_TRANSFER' | 'UPI' | 'OTHER' | null;
  receiptNo: string | null;
  chequeNo: string | null;
  remarks: string | null;
  memberId: string | null;
  partyId: string | null;
  layoutId: string | null;
  totalAmount: string;
  shareAmount: string;
  shareFeeAmount: string;
  membershipFeeAmount: string;
  siteDepositAmount: string;
  welfareFundAmount: string;
  booksFormsAmount: string;
  miscellaneousAmount: string;
  otherAmount: string;
  party?: { name: string; partyType: string } | null;
  layout?: { name: string; layoutCode: string } | null;
}

export interface MemberTransactionReport {
  financialYear: string;
  balance: {
    share: string;
    siteDeposit: string;
  };
  items: MemberTransactionDetailsItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

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
