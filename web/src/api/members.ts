import { api } from './client';

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

export interface PaginatedMembersResponse {
  items: Array<{
    memberId: string;
    memberCode: string;
    name: string;
    nameKannada?: string | null;
    mobile?: string | null;
    memberType?: string | null;
    status?: string | null;
    gender?: string | null;
    city?: string | null;
    district?: string | null;
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

export function getMembers(params: MemberQueryParams = {}) {
  return api<{
    success: boolean;
    message: string;
    data: PaginatedMembersResponse;
  }>({
    method: 'GET',
    url: '/members',
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      search: params.search || undefined,
      memberType: params.memberType || undefined,
      status: params.status || undefined,
      gender: params.gender || undefined,
      city: params.city || undefined,
      district: params.district || undefined,
      sortBy: params.sortBy || undefined,
      sortOrder: params.sortOrder || undefined,
    },
  });
}

export function createMember(data: CreateMemberPayload) {
  return api<{ success: boolean; message: string; data?: unknown }>({
    method: 'POST',
    url: '/members',
    data,
  });
}

export function uploadMembersFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  return api<UploadMembersResponse>({
    method: 'POST',
    url: '/members/upload',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
