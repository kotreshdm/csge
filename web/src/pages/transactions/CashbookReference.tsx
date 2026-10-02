import { useEffect, useState } from 'react';
import { resolveCashbookImage } from './transactionRules';

interface CashbookReferenceProps {
  cashbookNo: string | number | null;
  cashbookPage: string | number | null;
}

export function CashbookReference({ cashbookNo, cashbookPage }: CashbookReferenceProps) {
  const imageBase = resolveCashbookImage(cashbookNo, cashbookPage);
  const [isMissing, setIsMissing] = useState(false);

  useEffect(() => {
    setIsMissing(false);
  }, [imageBase]);

  if (!imageBase || isMissing) {
    return (
      <p className='flex min-h-48 items-center justify-center rounded border border-dashed border-slate-300 bg-white px-4 text-center text-sm text-slate-500'>
        {isMissing
          ? 'No reference image found for this cashbook page.'
          : 'Enter a cashbook number and page to view the reference image.'}
      </p>
    );
  }

  return (
    <img
      key={imageBase}
      src={`${imageBase}.jpg`}
      alt={`Cashbook ${cashbookNo}, page ${cashbookPage}`}
      onError={event => {
        const image = event.currentTarget;
        if (image.src.endsWith('.jpg')) {
          image.src = `${imageBase}.jpeg`;
        } else {
          setIsMissing(true);
        }
      }}
      className='max-h-[95vh] w-full'
    />
  );
}
