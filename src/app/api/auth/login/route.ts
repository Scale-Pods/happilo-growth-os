import { NextRequest, NextResponse } from 'next/server';
import { findDemoUser } from '@/lib/demoUsers';
import {
  createSessionToken,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
} from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  // Demo build: accounts are checked against a static list (no database).
  const invalid = () =>
    NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  const found = findDemoUser(email);
  if (!found || found.password !== password) {
    return invalid();
  }
  const user = { id: found.id, email: found.email, full_name: found.full_name };

  const token = createSessionToken(user);
  const res = NextResponse.json({
    ok: true,
    token,
    user: { id: user.id, email: user.email, name: user.full_name },
  });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}
