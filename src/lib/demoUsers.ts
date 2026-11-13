/**
 * Demo operator accounts for the Happilo Growth OS dummy build.
 * No database is connected — these are checked in code only.
 */
export interface DemoUser {
  id: string;
  email: string;
  password: string;
  full_name: string;
}

export const DEMO_USERS: DemoUser[] = [
  { id: 'user-1', email: 'admin@happilo.com', password: 'happilo@123', full_name: 'Happilo Admin' },
  { id: 'user-2', email: 'growth@happilo.com', password: 'happilo@123', full_name: 'Growth Team' },
];

/** Email allowed to see the Outreach Sequence Generator (admin gear icon). */
export const OUTREACH_ADMIN_EMAIL = 'admin@happilo.com';

export function findDemoUser(email: string): DemoUser | undefined {
  return DEMO_USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
}
