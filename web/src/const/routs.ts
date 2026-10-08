export const ROUTES = {
  ROOT: '/',
  ADMIN: {
    ROOT: '/admin',
    LOGIN: '/admin/login',
    REGISTER: '/admin/register',

    MEMBERS: '/admin/members',
    MEMBERS_ADD: '/admin/members/add',
    MEMBERS_EDIT: (memberId: string) => `/admin/members/${memberId}/edit`,
    MEMBER_ADDRESS_HISTORY: '/admin/member-address-history',

    DIRECTORS: '/admin/directors',
    GBM_LETTER_RETURNS: '/admin/gbm-letter-returns',

    PARTIES: '/admin/parties',
    PARTIES_ADD: '/admin/parties/add',
    PARTIES_EDIT: (partyId: string) => `/admin/parties/${partyId}/edit`,

    LAYOUTS: '/admin/layouts',
    LAYOUTS_ADD: '/admin/layouts/add',
    LAYOUTS_EDIT: (layoutId: string) => `/admin/layouts/${layoutId}/edit`,

    SITES: '/admin/sites',

    CHEQUE_RANGES: '/admin/cheque-ranges',

    TRANSACTIONS: '/admin/transactions',
    TRANSACTIONS_ADD: '/admin/transactions/add',
    TRANSACTIONS_EDIT: (transactionId: string) => `/admin/transactions/${transactionId}/edit`,
  },
} as const;

export const DEFAULT_REDIRECT = ROUTES.ADMIN.LOGIN;
