import { NextResponse } from 'next/server';
import db from '@/src/lib/db';
import { getSession } from '@/src/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET() {
  const session = await getSession();
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const users = db.prepare('SELECT id, username, role FROM users').all();
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { username, password, role } = await request.json();
  const hash = await bcrypt.hash(password, 10);
  
  try {
    const result = db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)')
      .run(username, hash, role || 'user');
    return NextResponse.json({ id: result.lastInsertRowid });
  } catch (e: any) {
    return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
  }
}
