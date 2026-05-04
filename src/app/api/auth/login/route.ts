import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import db, { User } from '@/src/lib/db';
import { login } from '@/src/lib/auth';

export async function POST(request: Request) {
  const { username, password } = await request.json();

  // For initial setup: create admin if no users exist
  const userCountResult = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCountResult.count === 0) {
    const hash = await bcrypt.hash('admin123', 10);
    db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run('admin', hash, 'admin');
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as User | undefined;

  if (user && (await bcrypt.compare(password, user.password_hash))) {
    await login({ id: user.id, username: user.username, role: user.role });
    return NextResponse.json({ success: true, role: user.role });
  }

  return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
}
