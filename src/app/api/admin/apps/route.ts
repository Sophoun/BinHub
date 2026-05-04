import { NextResponse } from 'next/server';
import db from '@/src/lib/db';
import { getSession } from '@/src/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apps = db.prepare(`
    SELECT a.*, 
    (SELECT version_number FROM versions WHERE app_id = a.id ORDER BY created_at DESC LIMIT 1) as latest_version
    FROM apps a
  `).all();
  
  return NextResponse.json(apps);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, package_name, platform } = await request.json();
  
  const result = db.prepare('INSERT INTO apps (name, package_name, platform) VALUES (?, ?, ?)')
    .run(name, package_name, platform);

  return NextResponse.json({ id: result.lastInsertRowid });
}
