import { api } from './client';
import type { Layout, LayoutPayload, LayoutPricePayload } from './types';

type ApiResponse<T> = { success: boolean; message: string; data: T };

export function getLayouts() {
  return api<ApiResponse<{ items: Layout[] }>>({ method: 'GET', url: '/layouts' });
}

export function getLayout(id: string) {
  return api<ApiResponse<Layout>>({ method: 'GET', url: `/layouts/${id}` });
}

export function createLayout(data: LayoutPayload) {
  return api<ApiResponse<Layout>>({ method: 'POST', url: '/layouts', data });
}

export function updateLayout(id: string, data: LayoutPayload) {
  return api<ApiResponse<Layout>>({ method: 'PUT', url: `/layouts/${id}`, data });
}

export function deleteLayout(id: string) {
  return api<ApiResponse<{ id: string; layoutCode: string; name: string }>>({
    method: 'DELETE',
    url: `/layouts/${id}`,
  });
}

export function createLayoutPrice(layoutId: string, data: LayoutPricePayload) {
  return api<ApiResponse<Layout['prices'][number]>>({
    method: 'POST',
    url: `/layouts/${layoutId}/prices`,
    data,
  });
}

export function updateLayoutPrice(layoutId: string, priceId: string, data: LayoutPricePayload) {
  return api<ApiResponse<Layout['prices'][number]>>({
    method: 'PUT',
    url: `/layouts/${layoutId}/prices/${priceId}`,
    data,
  });
}

export function deleteLayoutPrice(layoutId: string, priceId: string) {
  return api<ApiResponse<{ id: string; layoutId: string }>>({
    method: 'DELETE',
    url: `/layouts/${layoutId}/prices/${priceId}`,
  });
}
