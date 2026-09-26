import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';

interface PageToolbarProps {
  title: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  secondaryActionLabel?: string;
  secondaryActionVariant?: 'default' | 'outline';
  onSecondaryAction?: () => void;
  primaryActionLabel?: string;
  primaryActionPath?: string;
  primaryActionOnClick?: () => void;
  showLanguageToggle?: boolean;
  languageLabel?: string;
  languageValue?: boolean;
  onToggleLanguage?: () => void;
}

export function PageToolbar({
  title,
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search...',
  secondaryActionLabel,
  secondaryActionVariant = 'outline',
  onSecondaryAction,
  primaryActionLabel,
  primaryActionPath,
  primaryActionOnClick,
  showLanguageToggle = false,
  languageLabel = 'ಕನ್ನಡ',
  languageValue = false,
  onToggleLanguage,
}: PageToolbarProps) {
  return (
    <div className='flex flex-wrap items-center gap-3'>
      <h1 className='mr-auto text-2xl font-semibold text-slate-900'>{title}</h1>

      {onSearchChange && (
        <input
          value={searchValue}
          onChange={event => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          className='w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 sm:w-80'
        />
      )}

      {showLanguageToggle && onToggleLanguage && (
        <Button variant={languageValue ? 'default' : 'outline'} onClick={onToggleLanguage}>
          {languageValue ? 'English' : languageLabel}
        </Button>
      )}

      {secondaryActionLabel && onSecondaryAction && (
        <Button variant={secondaryActionVariant} onClick={onSecondaryAction}>
          {secondaryActionLabel}
        </Button>
      )}

      {primaryActionLabel && (
        <Button onClick={primaryActionOnClick}>
          {primaryActionPath ? (
            <Link to={primaryActionPath}>{primaryActionLabel}</Link>
          ) : (
            primaryActionLabel
          )}
        </Button>
      )}
    </div>
  );
}
