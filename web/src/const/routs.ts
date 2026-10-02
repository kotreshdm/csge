export const ROUTES = {
  ROOT: '/',
  ADMIN: {
    ROOT: '/admin',
    LOGIN: '/admin/login',
    REGISTER: '/admin/register',

    MEMBERS: '/admin/members',
    MEMBERS_ADD: '/admin/members/add',
    MEMBERS_EDIT: (memberId: string) => `/admin/members/${memberId}/edit`,

    PARTIES: '/admin/parties',
    PARTIES_ADD: '/admin/parties/add',
    PARTIES_EDIT: (partyId: string) => `/admin/parties/${partyId}/edit`,

    LAYOUTS: '/admin/layouts',
    LAYOUTS_ADD: '/admin/layouts/add',
    LAYOUTS_EDIT: (layoutId: string) => `/admin/layouts/${layoutId}/edit`,

    ACCOUNTS: '/admin/accounts',
    ACCOUNTS_ADD: '/admin/accounts/add',
    ACCOUNTS_EDIT: (accountId: string) => `/admin/accounts/${accountId}/edit`,

    TRANSACTIONS: '/admin/transactions',
  },
} as const;

export const DEFAULT_REDIRECT = ROUTES.ADMIN.LOGIN;
