import { NextResponse } from 'next/server';
import db from '@/src/lib/db';
import { getSession } from '@/src/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let apps;
  if (session.user.role === 'admin') {
    apps = db.prepare(`
      SELECT a.*, v.id as version_id, v.version_number, v.build_number, v.changelog, v.created_at as version_date
      FROM apps a
      LEFT JOIN versions v ON v.app_id = a.id
      WHERE v.id = (SELECT id FROM versions WHERE app_id = a.id ORDER BY created_at DESC LIMIT 1)
      OR v.id IS NULL
    `).all();
  } else {
    apps = db.prepare(`
      SELECT a.*, v.id as version_id, v.version_number, v.build_number, v.changelog, v.created_at as version_date
      FROM apps a
      JOIN user_apps ua ON ua.app_id = a.id
      LEFT JOIN versions v ON v.app_id = a.id
      WHERE ua.user_id = ?
      AND (v.id = (SELECT id FROM versions WHERE app_id = a.id ORDER BY created_at DESC LIMIT 1) OR v.id IS NULL)
    `).all(session.user.id);
  }

  return NextResponse.json(apps);
}
