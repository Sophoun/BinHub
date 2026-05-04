import { NextResponse } from 'next/server';
import { logout } from '@/src/lib/auth';

export async function POST() {
  await logout();
  return NextResponse.json({ success: true });
}
