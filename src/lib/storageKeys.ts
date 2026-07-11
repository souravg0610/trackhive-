// ============================================================
// STORAGE KEYS — single source of truth for all localStorage
// Never use raw string keys anywhere else in the app
// ============================================================

export const SK = {
  USER_EMAIL:     'th_user_email',
  USER_NAME:      'th_user_name',
  USER_ROLE:      'th_user_role',
  USER_DEPT:      'th_user_department',
  COMPANY_ID:     'th_company_id',
  COMPANY_LOGO:   'th_company_logo_url',
  APP_VERSION:    'th_app_version',
  MOBILE_SESSION: 'th_mobile_session',
} as const;

type Key = keyof typeof SK;

export const Session = {
  get(k: Key): string | null {
    return localStorage.getItem(SK[k]);
  },
  set(k: Key, v: string): void {
    localStorage.setItem(SK[k], v);
  },
  remove(k: Key): void {
    localStorage.removeItem(SK[k]);
  },
  clearAll(): void {
    Object.values(SK).forEach(v => localStorage.removeItem(v));
  },
};
