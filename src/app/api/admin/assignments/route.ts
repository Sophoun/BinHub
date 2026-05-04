import { NextResponse } from 'next/server';
import db from '@/src/lib/db';
import { getSession } from '@/src/lib/auth';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const appId = searchParams.get('appId');

  if (userId) {
    const assignments = db.prepare('SELECT app_id FROM user_apps WHERE user_id = ?').all(userId);
    return NextResponse.json(assignments);
  }

  if (appId) {
    const assignments = db.prepare('SELECT user_id FROM user_apps WHERE app_id = ?').all(appId);
    return NextResponse.json(assignments);
  }

  return NextResponse.json({ error: 'Missing userId or appId' }, { status: 400 });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId, appIds } = await request.json();

  const deleteStmt = db.prepare('DELETE FROM user_apps WHERE user_id = ?');
  const insertStmt = db.prepare('INSERT INTO user_apps (user_id, app_id) VALUES (?, ?)');

  const transaction = db.transaction((userId: number, appIds: number[]) => {
    deleteStmt.run(userId);
    for (const appId of appIds) {
      insertStmt.run(userId, appId);
    }
  });

  transaction(userId, appIds);

  return NextResponse.json({ success: true });
}
