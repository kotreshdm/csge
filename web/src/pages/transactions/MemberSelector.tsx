import type { TransactionPayload } from '../../api/types';

interface MemberSelectorProps {
  form: TransactionPayload;
  required?: boolean;
  members: MemberOption[];
  selectedMember?: MemberOption;
  memberLookup: string;
  isMemberOptionsOpen: boolean;
  membersLoading: boolean;
  onLookupChange: (value: string) => void;
  onToggleMembers: (value: boolean) => void;
  onSelectMember: (memberId: string) => void;
}

interface MemberOption {
    memberId: string;
    memberCode: string;
    name: string;
    mobile?: string | null;
    recieptNo?: string | null;
    joinDate?: string | null;
}

export function MemberSelector({
  form,
  required = false,
  members,
  selectedMember,
  memberLookup,
  isMemberOptionsOpen,
  membersLoading,
  onLookupChange,
  onToggleMembers,
  onSelectMember,
}: MemberSelectorProps) {
  const matchingMembers = members.filter(member =>
    [member.memberId, member.memberCode, member.name, member.mobile ?? ''].some(value =>
      value.toLocaleLowerCase().includes(memberLookup.trim().toLocaleLowerCase()),
    ),
  );

  const memberInputValue = isMemberOptionsOpen
    ? memberLookup
    : selectedMember
      ? `${selectedMember.name} (${selectedMember.memberCode}) · ID ${selectedMember.memberId}`
      : '';

  return (
    <label className='relative grid gap-1.5 text-sm font-medium text-slate-700'>
      <span>
        Member
        {required ? <span className='ml-1 text-rose-600'>*</span> : null}
      </span>
      <input
        required={required}
        role='combobox'
        aria-autocomplete='list'
        aria-expanded={isMemberOptionsOpen}
        aria-controls='transaction-member-options'
        value={memberInputValue}
        onFocus={() => {
          onLookupChange('');
          onToggleMembers(true);
        }}
        onChange={event => {
          onLookupChange(event.target.value);
          onToggleMembers(true);
        }}
        onKeyDown={event => {
          if (event.key === 'Escape') onToggleMembers(false);
          if (event.key === 'Enter' && isMemberOptionsOpen && matchingMembers[0]) {
            event.preventDefault();
            onSelectMember(matchingMembers[0].memberId);
            onLookupChange('');
            onToggleMembers(false);
          }
        }}
        placeholder={membersLoading ? 'Loading members...' : 'Select or search members...'}
        className='h-9 min-w-0 rounded-md border border-slate-300 bg-white px-2.5 font-normal text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15'
      />
      {isMemberOptionsOpen ? (
        <div
          id='transaction-member-options'
          role='listbox'
          className='absolute left-0 right-0 top-full z-20 max-h-56 overflow-y-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg'
        >
          {!required ? (
            <button
              type='button'
              role='option'
              aria-selected={!form.memberId}
              onClick={() => {
                onSelectMember('');
                onLookupChange('');
                onToggleMembers(false);
              }}
              className='block w-full px-3 py-2 text-left text-sm font-normal text-slate-600 hover:bg-slate-50'
            >
              No member
            </button>
          ) : null}
          {matchingMembers.map(member => (
            <button
              key={member.memberId}
              type='button'
              role='option'
              aria-selected={member.memberId === form.memberId}
              onClick={() => {
                onSelectMember(member.memberId);
                onLookupChange('');
                onToggleMembers(false);
              }}
              className='block w-full px-3 py-2 text-left text-sm font-normal text-slate-900 hover:bg-slate-50'
            >
              {member.name} ({member.memberCode}) · {member.mobile || 'No mobile'} · ID{' '}
              {member.memberId}
            </button>
          ))}
          {!membersLoading && matchingMembers.length === 0 ? (
            <p className='px-3 py-2 text-sm font-normal text-slate-500'>No matching members.</p>
          ) : null}
        </div>
      ) : null}
    </label>
  );
}
