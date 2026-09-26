export const memberTypeOptions = [
  { label: 'All types', value: '' },
  { label: 'Member', value: 'MEMBER' },
  { label: 'Associate', value: 'ASSOCIATE' },
  { label: 'Superuser', value: 'SUPERUSER' },
] as const;

export const memberStatusOptions = [
  { label: 'All status', value: '' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
  { label: 'Incorrect', value: 'INCORRECT' },
  { label: 'Resigned', value: 'RESIGNED' },
  { label: 'Deceased', value: 'DECEASED' },
] as const;

export const memberGenderOptions = [
  { label: 'All gender', value: '' },
  { label: 'Male', value: 'MALE' },
  { label: 'Female', value: 'FEMALE' },
  { label: 'Other', value: 'OTHER' },
] as const;
