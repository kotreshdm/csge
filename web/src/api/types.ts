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
