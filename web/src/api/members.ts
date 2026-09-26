import { api } from './client';
import type {
  CreateMemberPayload,
  MemberQueryParams,
  PaginatedMembersResponse,
  UploadMembersResponse,
} from './types';

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
