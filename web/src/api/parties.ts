import { api } from './client';
import type { PartiesResponse, PartyPayload } from './types';

export function getParties() {
  return api<PartiesResponse>({
    method: 'GET',
    url: '/parties',
  });
}

export async function getPartyTypes() {
  const response = await getParties();
  const partyTypes = new Set<string>();

  for (const party of response.data.items) {
    const type = party.partyType.trim();

    if (type) {
      partyTypes.add(type);
    }
  }

  return [...partyTypes];
}

export function createParty(data: PartyPayload) {
  return api<{ success: boolean; message: string; data?: unknown }>({
    method: 'POST',
    url: '/parties',
    data,
  });
}

export function updateParty(id: string, data: PartyPayload) {
  return api<{ success: boolean; message: string; data?: unknown }>({
    method: 'PUT',
    url: `/parties/${id}`,
    data,
  });
}

export function deleteParty(id: string) {
  return api<{ success: boolean; message: string; data?: unknown }>({
    method: 'DELETE',
    url: `/parties/${id}`,
  });
}