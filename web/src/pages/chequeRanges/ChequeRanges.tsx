import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { getParties } from '../../api/parties';
import { getTransactions } from '../../api/transactions';
import {
  createCancelledCheque,
  deleteCancelledCheque,
  getCancelledCheques,
  updateCancelledCheque,
} from '../../api/cancelledCheques';
import {
  createCancelledReceipt,
  deleteCancelledReceipt,
  getCancelledReceipts,
  updateCancelledReceipt,
} from '../../api/cancelledReceipts';
import {
  createChequeRange,
  deleteChequeRange,
  getChequeRanges,
  updateChequeRange,
} from '../../api/chequeRanges';
import type {
  CancelledCheque,
  CancelledChequePayload,
  CancelledReceipt,
  CancelledReceiptPayload,
  ChequeRange,
  ChequeRangePayload,
} from '../../api/types';
import { Button } from '@/components/ui/button';
import CancelledChequeForm from '../../components/chequeRanges/CancelledChequeForm';
import CancelledReceiptForm from '../../components/chequeRanges/CancelledReceiptForm';
import ChequeRangeForm from '../../components/chequeRanges/ChequeRangeForm';

type Mode = 'ranges' | 'cancelled' | 'receipts';
type DeleteTarget =
  | { mode: 'ranges'; item: ChequeRange }
  | { mode: 'cancelled'; item: CancelledCheque }
  | { mode: 'receipts'; item: CancelledReceipt };

export default function ChequeRanges() {
  const [mode, setMode] = useState<Mode>('cancelled');
  const [rangeFormOpen, setRangeFormOpen] = useState(false);
  const [cancelledFormOpen, setCancelledFormOpen] = useState(false);
  const [receiptFormOpen, setReceiptFormOpen] = useState(false);
  const [editingRange, setEditingRange] = useState<ChequeRange | null>(null);
  const [editingCancelled, setEditingCancelled] = useState<CancelledCheque | null>(null);
  const [editingReceipt, setEditingReceipt] = useState<CancelledReceipt | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const queryClient = useQueryClient();
  const rangesQuery = useQuery({
    queryKey: ['cheque-ranges'],
    queryFn: getChequeRanges,
  });
  const cancelledQuery = useQuery({
    queryKey: ['cancelled-cheques'],
    queryFn: getCancelledCheques,
  });
  const receiptsQuery = useQuery({
    queryKey: ['cancelled-receipts'],
    queryFn: getCancelledReceipts,
  });
  const partiesQuery = useQuery({ queryKey: ['parties'], queryFn: getParties });
  const transactionsQuery = useQuery({ queryKey: ['transactions'], queryFn: getTransactions });
  const ranges = rangesQuery.data?.data.items ?? [];
  const cancelledCheques = cancelledQuery.data?.data.items ?? [];
  const cancelledReceipts = receiptsQuery.data?.data.items ?? [];
  const parties = partiesQuery.data?.data.items ?? [];
  const transactions = transactionsQuery.data?.data.items ?? [];
  const lastTransaction = transactions.reduce<(typeof transactions)[number] | null>(
    (latest, transaction) =>
      latest === null || BigInt(transaction.id) > BigInt(latest.id) ? transaction : latest,
    null,
  );
  const defaultCancelledDate =
    lastTransaction?.transactionDate.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
  const clearEditor = () => {
    setRangeFormOpen(false);
    setCancelledFormOpen(false);
    setReceiptFormOpen(false);
    setEditingRange(null);
    setEditingCancelled(null);
    setEditingReceipt(null);
    setSubmitError('');
  };

  const changeMode = (nextMode: Mode) => {
    clearEditor();
    setMode(nextMode);
  };

  const saveRange = async (payload: ChequeRangePayload) => {
    setIsSaving(true);
    setSubmitError('');
    try {
      const response = editingRange
        ? await updateChequeRange(editingRange.id, payload)
        : await createChequeRange(payload);
      await queryClient.invalidateQueries({ queryKey: ['cheque-ranges'] });
      clearEditor();
      toast.success(response.message);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to save cheque range.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveCancelledCheque = async (payload: CancelledChequePayload) => {
    setIsSaving(true);
    setSubmitError('');
    try {
      const response = editingCancelled
        ? await updateCancelledCheque(editingCancelled.id, payload)
        : await createCancelledCheque(payload);
      await queryClient.invalidateQueries({ queryKey: ['cancelled-cheques'] });
      clearEditor();
      toast.success(response.message);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to save cancelled cheque.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveCancelledReceipt = async (payload: CancelledReceiptPayload) => {
    setIsSaving(true);
    setSubmitError('');
    try {
      const response = editingReceipt
        ? await updateCancelledReceipt(editingReceipt.id, payload)
        : await createCancelledReceipt(payload);
      await queryClient.invalidateQueries({ queryKey: ['cancelled-receipts'] });
      clearEditor();
      toast.success(response.message);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to save cancelled receipt.');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const response =
        deleteTarget.mode === 'ranges'
          ? await deleteChequeRange(deleteTarget.item.id)
          : deleteTarget.mode === 'cancelled'
            ? await deleteCancelledCheque(deleteTarget.item.id)
            : await deleteCancelledReceipt(deleteTarget.item.id);
      await queryClient.invalidateQueries({
        queryKey:
          deleteTarget.mode === 'ranges'
            ? ['cheque-ranges']
            : deleteTarget.mode === 'cancelled'
              ? ['cancelled-cheques']
              : ['cancelled-receipts'],
      });
      setDeleteTarget(null);
      toast.success(response.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to delete record.');
    }
  };

  const currentIsLoading =
    mode === 'ranges'
      ? rangesQuery.isLoading
      : mode === 'cancelled'
        ? cancelledQuery.isLoading
        : receiptsQuery.isLoading;
  const currentError =
    mode === 'ranges' ? rangesQuery.error : mode === 'cancelled' ? cancelledQuery.error : receiptsQuery.error;
  const currentCount =
    mode === 'ranges' ? ranges.length : mode === 'cancelled' ? cancelledCheques.length : cancelledReceipts.length;
  const formOpen =
    mode === 'ranges' ? rangeFormOpen : mode === 'cancelled' ? cancelledFormOpen : receiptFormOpen;

  return (
    <main className='min-h-screen bg-slate-50 p-6'>
      <div className='mx-auto max-w-7xl'>
        <div className='flex flex-wrap items-end gap-3'>
          <div className='mr-auto'>
            <h1 className='text-2xl font-semibold text-slate-900'>Cheque and receipt records</h1>
            <p className='mt-1 text-sm text-slate-500'>
              Manage cheque books and cancelled cheques and receipts.
            </p>
          </div>
          <div
            role='group'
            aria-label='Cheque record type'
            className='flex rounded-md border border-slate-300 bg-white p-1'
          >
            <Button
              type='button'
              variant={mode === 'ranges' ? 'default' : 'ghost'}
              aria-pressed={mode === 'ranges'}
              onClick={() => changeMode('ranges')}
            >
              Ranges ({ranges.length})
            </Button>
            <Button
              type='button'
              variant={mode === 'cancelled' ? 'default' : 'ghost'}
              aria-pressed={mode === 'cancelled'}
              onClick={() => changeMode('cancelled')}
            >
              Cancelled ({cancelledCheques.length})
            </Button>
            <Button
              type='button'
              variant={mode === 'receipts' ? 'default' : 'ghost'}
              aria-pressed={mode === 'receipts'}
              onClick={() => changeMode('receipts')}
            >
              Receipts ({cancelledReceipts.length})
            </Button>
          </div>
          <Button
            type='button'
            onClick={() => {
              clearEditor();
              if (mode === 'ranges') setRangeFormOpen(true);
              else if (mode === 'cancelled') setCancelledFormOpen(true);
              else setReceiptFormOpen(true);
            }}
          >
            <Plus /> Add {mode === 'ranges' ? 'range' : mode === 'cancelled' ? 'cheque' : 'receipt'}
          </Button>
        </div>

        {formOpen && (
          <section className='mt-4'>
            <h2 className='mb-3 text-lg font-semibold text-slate-900'>
              {mode === 'ranges'
                ? editingRange
                  ? 'Edit cheque range'
                  : 'Add cheque range'
                : mode === 'cancelled'
                  ? editingCancelled
                    ? 'Edit cancelled cheque'
                    : 'Record cancelled cheque'
                  : editingReceipt
                    ? 'Edit cancelled receipt'
                    : 'Record cancelled receipt'}
            </h2>
            {(mode === 'cancelled' && !editingCancelled && transactionsQuery.isLoading) ||
            (mode === 'receipts' && !editingReceipt && transactionsQuery.isLoading) ? (
              <p className='rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500'>
                Loading latest transaction date...
              </p>
            ) : mode !== 'receipts' && partiesQuery.isLoading ? (
              <p className='rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-500'>
                Loading parties...
              </p>
            ) : mode !== 'receipts' && partiesQuery.error ? (
              <p
                role='alert'
                className='rounded-lg border border-slate-200 bg-white p-5 text-sm text-rose-700'
              >
                Unable to load parties.
              </p>
            ) : mode === 'ranges' ? (
              <ChequeRangeForm
                key={editingRange?.id ?? 'new-range'}
                parties={parties}
                defaultValues={
                  editingRange
                    ? {
                        partyId: editingRange.partyId,
                        startChequeNo: editingRange.startChequeNo,
                        endChequeNo: editingRange.endChequeNo,
                        receivedDate: editingRange.receivedDate.slice(0, 10),
                        remarks: editingRange.remarks ?? '',
                      }
                    : undefined
                }
                isSubmitting={isSaving}
                submitLabel={editingRange ? 'Save changes' : 'Create range'}
                submitMessage={submitError}
                onSubmit={saveRange}
                onCancel={clearEditor}
              />
            ) : mode === 'cancelled' ? (
              <CancelledChequeForm
                key={editingCancelled?.id ?? 'new-cancelled-cheque'}
                parties={parties}
                defaultValues={
                  editingCancelled
                    ? {
                        partyId: editingCancelled.partyId,
                        chequeNo: editingCancelled.chequeNo,
                        cancelledDate: editingCancelled.cancelledDate.slice(0, 10),
                        reason: editingCancelled.reason ?? '',
                        remarks: editingCancelled.remarks ?? '',
                      }
                    : {
                        partyId: '',
                        chequeNo: '',
                        cancelledDate: defaultCancelledDate,
                        reason: '',
                        remarks: '',
                      }
                }
                isSubmitting={isSaving}
                submitLabel={editingCancelled ? 'Save changes' : 'Record cheque'}
                submitMessage={submitError}
                onSubmit={saveCancelledCheque}
                onCancel={clearEditor}
              />
            ) : (
              <CancelledReceiptForm
                key={editingReceipt?.id ?? 'new-cancelled-receipt'}
                defaultValues={
                  editingReceipt
                    ? {
                        receiptNo: editingReceipt.receiptNo,
                        cancelledDate: editingReceipt.cancelledDate.slice(0, 10),
                        reason: editingReceipt.reason ?? '',
                        remarks: editingReceipt.remarks ?? '',
                      }
                    : {
                        receiptNo: '',
                        cancelledDate: defaultCancelledDate,
                        reason: '',
                        remarks: '',
                      }
                }
                isSubmitting={isSaving}
                submitLabel={editingReceipt ? 'Save changes' : 'Record receipt'}
                submitMessage={submitError}
                onSubmit={saveCancelledReceipt}
                onCancel={clearEditor}
              />
            )}
          </section>
        )}

        <section className='mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white'>
          <div className='border-b border-slate-200 px-4 py-3 text-sm text-slate-500'>
            {currentCount}{' '}
            {mode === 'ranges'
              ? 'cheque ranges'
              : mode === 'cancelled'
                ? 'cancelled cheques'
                : 'cancelled receipts'}
          </div>
          {currentIsLoading ? (
            <p className='p-6 text-sm text-slate-500'>Loading records...</p>
          ) : currentError ? (
            <p role='alert' className='p-6 text-sm text-rose-700'>
              {currentError instanceof Error ? currentError.message : 'Failed to load records.'}
            </p>
          ) : currentCount === 0 ? (
            <p className='p-6 text-sm text-slate-500'>
              {mode === 'ranges'
                ? 'No cheque ranges have been recorded.'
                : mode === 'cancelled'
                  ? 'No cancelled cheques have been recorded.'
                  : 'No cancelled receipts have been recorded.'}
            </p>
          ) : mode === 'ranges' ? (
            <div className='overflow-x-auto'>
              <table className='min-w-full text-left text-sm'>
                <thead className='bg-slate-50 text-slate-600'>
                  <tr className='border-b border-slate-200'>
                    <th className='px-4 py-3'>Party</th>
                    <th className='px-4 py-3'>Cheque range</th>
                    <th className='px-4 py-3'>Received date</th>
                    <th className='px-4 py-3'>Remarks</th>
                    <th className='px-4 py-3 text-right'>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ranges.map(range => (
                    <tr
                      key={range.id}
                      className='border-b border-slate-100 last:border-0 hover:bg-slate-50'
                    >
                      <td className='px-4 py-3 font-medium'>
                        {range.party.name} · {range.party.partyType}
                      </td>
                      <td className='whitespace-nowrap px-4 py-3'>
                        {range.startChequeNo} – {range.endChequeNo}
                      </td>
                      <td className='whitespace-nowrap px-4 py-3'>
                        {range.receivedDate.slice(0, 10)}
                      </td>
                      <td className='max-w-xs truncate px-4 py-3'>{range.remarks || '-'}</td>
                      <td className='px-4 py-3'>
                        <div className='flex justify-end gap-1'>
                          <Button
                            variant='ghost'
                            size='icon-sm'
                            aria-label='Edit cheque range'
                            title='Edit range'
                            onClick={() => {
                              setEditingRange(range);
                              setRangeFormOpen(true);
                              setCancelledFormOpen(false);
                              setReceiptFormOpen(false);
                              setEditingCancelled(null);
                              setEditingReceipt(null);
                              setSubmitError('');
                            }}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant='destructive'
                            size='icon-sm'
                            aria-label='Delete cheque range'
                            title='Delete range'
                            onClick={() => setDeleteTarget({ mode: 'ranges', item: range })}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : mode === 'cancelled' ? (
            <div className='overflow-x-auto'>
              <table className='min-w-full text-left text-sm'>
                <thead className='bg-slate-50 text-slate-600'>
                  <tr className='border-b border-slate-200'>
                    <th className='px-4 py-3'>Party</th>
                    <th className='px-4 py-3'>Cheque number</th>
                    <th className='px-4 py-3'>Cancelled date</th>
                    <th className='px-4 py-3'>Reason</th>
                    <th className='px-4 py-3'>Remarks</th>
                    <th className='px-4 py-3 text-right'>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cancelledCheques.map(cheque => (
                    <tr
                      key={cheque.id}
                      className='border-b border-slate-100 last:border-0 hover:bg-slate-50'
                    >
                      <td className='px-4 py-3 font-medium'>
                        {cheque.party.name} · {cheque.party.partyType}
                      </td>
                      <td className='whitespace-nowrap px-4 py-3'>{cheque.chequeNo}</td>
                      <td className='whitespace-nowrap px-4 py-3'>
                        {cheque.cancelledDate.slice(0, 10)}
                      </td>
                      <td className='max-w-xs truncate px-4 py-3'>{cheque.reason || '-'}</td>
                      <td className='max-w-xs truncate px-4 py-3'>{cheque.remarks || '-'}</td>
                      <td className='px-4 py-3'>
                        <div className='flex justify-end gap-1'>
                          <Button
                            variant='ghost'
                            size='icon-sm'
                            aria-label={`Edit cancelled cheque ${cheque.chequeNo}`}
                            title='Edit cancelled cheque'
                            onClick={() => {
                              setEditingCancelled(cheque);
                              setCancelledFormOpen(true);
                              setRangeFormOpen(false);
                              setReceiptFormOpen(false);
                              setEditingRange(null);
                              setEditingReceipt(null);
                              setSubmitError('');
                            }}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant='destructive'
                            size='icon-sm'
                            onClick={() => setDeleteTarget({ mode: 'cancelled', item: cheque })}
                            aria-label={`Delete cancelled cheque ${cheque.chequeNo}`}
                            title='Delete cancelled cheque'
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='min-w-full text-left text-sm'>
                <thead className='bg-slate-50 text-slate-600'>
                  <tr className='border-b border-slate-200'>
                    <th className='px-4 py-3'>Receipt number</th>
                    <th className='px-4 py-3'>Cancelled date</th>
                    <th className='px-4 py-3'>Reason</th>
                    <th className='px-4 py-3'>Remarks</th>
                    <th className='px-4 py-3 text-right'>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {cancelledReceipts.map(receipt => (
                    <tr
                      key={receipt.id}
                      className='border-b border-slate-100 last:border-0 hover:bg-slate-50'
                    >
                      <td className='whitespace-nowrap px-4 py-3 font-medium'>
                        {receipt.receiptNo}
                      </td>
                      <td className='whitespace-nowrap px-4 py-3'>
                        {receipt.cancelledDate.slice(0, 10)}
                      </td>
                      <td className='max-w-xs truncate px-4 py-3'>{receipt.reason || '-'}</td>
                      <td className='max-w-xs truncate px-4 py-3'>{receipt.remarks || '-'}</td>
                      <td className='px-4 py-3'>
                        <div className='flex justify-end gap-1'>
                          <Button
                            variant='ghost'
                            size='icon-sm'
                            aria-label={`Edit cancelled receipt ${receipt.receiptNo}`}
                            title='Edit cancelled receipt'
                            onClick={() => {
                              setEditingReceipt(receipt);
                              setReceiptFormOpen(true);
                              setRangeFormOpen(false);
                              setCancelledFormOpen(false);
                              setEditingRange(null);
                              setEditingCancelled(null);
                              setSubmitError('');
                            }}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant='destructive'
                            size='icon-sm'
                            aria-label={`Delete cancelled receipt ${receipt.receiptNo}`}
                            title='Delete cancelled receipt'
                            onClick={() => setDeleteTarget({ mode: 'receipts', item: receipt })}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
      {deleteTarget && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4'>
          <section
            role='alertdialog'
            aria-modal='true'
            aria-labelledby='delete-cheque-range-title'
            className='w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl'
          >
            <h2 id='delete-cheque-range-title' className='text-lg font-semibold text-slate-900'>
              Delete{' '}
              {deleteTarget.mode === 'ranges'
                ? 'cheque range'
                : deleteTarget.mode === 'cancelled'
                  ? 'cancelled cheque'
                  : 'cancelled receipt'}?
            </h2>
            <p className='mt-2 text-sm text-slate-600'>
              {deleteTarget.mode === 'ranges'
                ? `Remove cheque numbers ${deleteTarget.item.startChequeNo}–${deleteTarget.item.endChequeNo}?`
                : deleteTarget.mode === 'cancelled'
                  ? `Remove cancelled cheque number ${deleteTarget.item.chequeNo}?`
                  : `Remove cancelled receipt number ${deleteTarget.item.receiptNo}?`}
            </p>
            <div className='mt-6 flex justify-end gap-2'>
              <Button variant='outline' onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button variant='destructive' onClick={confirmDelete}>
                Delete
              </Button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
