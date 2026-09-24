import { api } from './client';

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
