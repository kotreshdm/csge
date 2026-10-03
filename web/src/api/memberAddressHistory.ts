import { api } from './client';
import type { MemberAddressHistory } from './types';

export function getMemberAddressHistory() {
  return api<{
    success: boolean;
    message: string;
    data: { items: MemberAddressHistory[] };
  }>({ method: 'GET', url: '/members/address-history' });
}