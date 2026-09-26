import type { ReactNode } from 'react';

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const highlightText = (text: string | null | undefined, query: string): ReactNode => {
  const value = String(text ?? '');
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return value;
  }

  const pattern = new RegExp(`(${escapeRegExp(trimmedQuery)})`, 'gi');
  const parts = value.split(pattern);

  return parts.map((part, index) => {
    const isMatch = part.toLowerCase() === trimmedQuery.toLowerCase();

    return isMatch ? (
      <mark key={`${part}-${index}`} className='rounded bg-yellow-300  text-yellow-900'>
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    );
  });
};
