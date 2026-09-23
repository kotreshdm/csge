import { api } from './client';

export interface UploadMembersResponse {
  success: boolean;
  message: string;
  data?: {
    filename: string;
    size: number;
    rows?: number;
  };
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
