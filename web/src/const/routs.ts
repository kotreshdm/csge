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
  },
} as const;

export const DEFAULT_REDIRECT = ROUTES.ADMIN.LOGIN;
