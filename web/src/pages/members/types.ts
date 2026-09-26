export type SortField =
  | 'memberCode'
  | 'recieptNo'
  | 'joinDate'
  | 'name'
  | 'status'
  | 'postalCode';

export type SortOrder = 'asc' | 'desc';

export interface SortHeaderProps {
  label: string;
  field: SortField;
  sortBy: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
}
