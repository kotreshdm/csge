import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileSpreadsheet, Upload, UserPlus } from 'lucide-react';
import * as XLSX from 'xlsx';

import { createMember, uploadMembersFile } from '../../api/members';
import { ROUTES } from '../../const/routs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import MemberForm, {
  memberFormDefaultValues,
  type MemberFormValues,
} from '../../components/members/MemberForm';

export default function AddMember() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'single' | 'excel'>('single');
  const [excelUploadMessage, setExcelUploadMessage] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [submitMessage, setSubmitMessage] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [uploadedExcelRows, setUploadedExcelRows] = useState(0);
  const [selectedExcelFile, setSelectedExcelFile] = useState<File | null>(null);
  const [isSubmittingExcel, setIsSubmittingExcel] = useState(false);
  const [isSubmittingMember, setIsSubmittingMember] = useState(false);

  const handleCreateMember = async (values: MemberFormValues) => {
    setSubmitMessage(null);
    setIsSubmittingMember(true);

    try {
      const response = await createMember(values);
      setSubmitMessage({
        type: 'success',
        message: response.message || 'Member created successfully.',
      });
      navigate(ROUTES.ADMIN.MEMBERS);
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: string }).message)
          : 'Unable to create member.';

      setSubmitMessage({
        type: 'error',
        message,
      });
    } finally {
      setIsSubmittingMember(false);
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const isExcelFile =
      file.type === 'application/vnd.ms-excel' ||
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'text/csv' ||
      /\.(xlsx|xls|csv)$/i.test(file.name);

    if (!isExcelFile) {
      setSelectedExcelFile(null);
      setExcelUploadMessage({
        type: 'error',
        message: 'Please upload a valid Excel or CSV file.',
      });
      e.target.value = '';
      return;
    }

    try {
      const workbook = XLSX.read(await file.arrayBuffer(), {
        type: 'array',
      });

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, {
        defval: '',
        raw: false,
      });

      if (!rows.length) {
        setSelectedExcelFile(null);
        setExcelUploadMessage({
          type: 'error',
          message: 'The uploaded file is empty or does not contain any records.',
        });
        e.target.value = '';
        return;
      }

      setSelectedExcelFile(file);
      setUploadedExcelRows(rows.length);
      setExcelUploadMessage({
        type: 'success',
        message: `${file.name} uploaded successfully. ${rows.length} record(s) read.`,
      });
    } catch (error) {
      console.error('Excel parsing failed:', error);
      setSelectedExcelFile(null);
      setExcelUploadMessage({
        type: 'error',
        message: 'Unable to read the selected file. Please check the file format and try again.',
      });
    } finally {
      e.target.value = '';
    }
  };

  const handleExcelSubmit = async () => {
    if (!selectedExcelFile) {
      setExcelUploadMessage({
        type: 'error',
        message: 'Please upload a file before submitting.',
      });
      return;
    }

    setIsSubmittingExcel(true);

    try {
      const response = await uploadMembersFile(selectedExcelFile);

      setExcelUploadMessage({
        type: 'success',
        message: response.message || 'Members file submitted successfully.',
      });
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: string }).message)
          : 'Unable to submit the file.';

      setExcelUploadMessage({
        type: 'error',
        message,
      });
    } finally {
      setIsSubmittingExcel(false);
    }
  };

  return (
    <main className='min-h-screen bg-slate-50 p-6'>
      <div className='mx-auto max-w-6xl'>
        <div className='mb-6 flex items-center justify-between'>
          <div>
            <div className='flex items-center gap-3'>
              <UserPlus className='h-6 w-6 text-primary' />
              <h1 className='text-2xl font-semibold text-slate-900'>Add Member</h1>
            </div>

            <p className='mt-1 text-sm text-slate-500'>
              Create a new member or upload multiple members using Excel.
            </p>
          </div>
          <button
            type='button'
            onClick={() => setActiveTab('single')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'single'
                ? 'bg-primary text-primary-foreground'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Add Single Member
          </button>
          <button
            type='button'
            onClick={() => setActiveTab('excel')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'excel'
                ? 'bg-primary text-primary-foreground'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Bulk Excel Upload
          </button>
          <Link
            to={ROUTES.ADMIN.MEMBERS}
            className='inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted'
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back
          </Link>
        </div>

        {activeTab === 'single' ? (
          <MemberForm
            defaultValues={memberFormDefaultValues}
            onSubmit={handleCreateMember}
            submitLabel='Create Member'
            isSubmitting={isSubmittingMember}
            submitMessage={submitMessage}
            cancelTo={ROUTES.ADMIN.MEMBERS}
          />
        ) : (
          <BulkExcelUpload
            onUpload={handleExcelUpload}
            onSubmit={handleExcelSubmit}
            excelUploadMessage={excelUploadMessage}
            uploadedExcelRows={uploadedExcelRows}
            hasUploadedFile={Boolean(selectedExcelFile)}
            isSubmitting={isSubmittingExcel}
          />
        )}
      </div>
    </main>
  );
}

function BulkExcelUpload({
  onUpload,
  onSubmit,
  excelUploadMessage,
  uploadedExcelRows,
  hasUploadedFile,
  isSubmitting,
}: {
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  excelUploadMessage: { type: 'success' | 'error'; message: string } | null;
  uploadedExcelRows: number;
  hasUploadedFile: boolean;
  isSubmitting: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <FileSpreadsheet className='h-5 w-5 text-primary' />
          Bulk Member Upload
        </CardTitle>

        <CardDescription>Upload an Excel file containing multiple member records.</CardDescription>
      </CardHeader>

      <CardContent>
        <div className='rounded-xl border-2 border-dashed border-slate-200 p-10 text-center'>
          <FileSpreadsheet className='mx-auto h-12 w-12 text-slate-400' />

          <h3 className='mt-4 font-medium text-slate-900'>Upload Excel File</h3>

          <p className='mx-auto mt-2 max-w-md text-sm text-slate-500'>
            Upload your member Excel file. The system will validate the records before creating the
            members.
          </p>

          <div className='mt-6'>
            <label
              htmlFor='member-excel'
              className='inline-flex cursor-pointer items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90'
            >
              <Upload className='mr-2 h-4 w-4' />
              Select Excel File
            </label>

            <input
              id='member-excel'
              type='file'
              accept='.xlsx,.xls,.csv'
              className='hidden'
              onChange={onUpload}
            />
          </div>

          {excelUploadMessage && (
            <div
              className={`mt-4 rounded-md border px-3 py-2 text-sm ${
                excelUploadMessage.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {excelUploadMessage.message}
              {excelUploadMessage.type === 'success' && uploadedExcelRows > 0 && (
                <span className='ml-1'>({uploadedExcelRows} rows)</span>
              )}
            </div>
          )}

          {hasUploadedFile && (
            <div className='mt-6 flex justify-center'>
              <Button type='button' onClick={onSubmit} disabled={isSubmitting}>
                <Upload className='mr-2 h-4 w-4' />
                {isSubmitting ? 'Submitting...' : 'Submit Uploaded File'}
              </Button>
            </div>
          )}

          <p className='mt-4 text-xs text-slate-400'>Supported formats: .xlsx, .xls, .csv</p>
        </div>
      </CardContent>
    </Card>
  );
}
