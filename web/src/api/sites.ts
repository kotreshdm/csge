import { api } from './client';
import type { Site, SitePayload } from './types';

type ApiResponse<T> = { success: boolean; message: string; data: T };

export function getSites() {
  return api<ApiResponse<{ items: Site[] }>>({ method: 'GET', url: '/sites' });
}

export function createSite(data: SitePayload) {
  return api<ApiResponse<Site>>({ method: 'POST', url: '/sites', data });
}

export function updateSite(id: string, data: SitePayload) {
  return api<ApiResponse<Site>>({ method: 'PUT', url: `/sites/${id}`, data });
}

export function assignSite(id: string, memberId: string | null) {
  return api<ApiResponse<Site>>({
    method: 'PUT',
    url: `/sites/${id}/assignment`,
    data: { memberId },
  });
}

export function updateSiteStatus(id: string, status: Site['status']) {
  return api<ApiResponse<Site>>({
    method: 'PUT',
    url: `/sites/${id}/status`,
    data: { status },
  });
}
