import { requireSession } from '../../../lib/auth-session';
import { getD1 } from '../../../lib/runtime';

async function member(request: Request) {
  const session = await requireSession(request);
  const profile = await getD1().prepare('SELECT id, display_name FROM member_profiles WHERE email = ?').bind(session.email).first<{id:number;display_name:string}>();
  if (!profile) throw new Error('Open your member dashboard first.');
  return profile;
}
const failure = (error: unknown) => error instanceof Response ? error : Response.json({error:error instanceof Error ? error.message : 'Unable to load messaging.'},{status:400});

export async function GET(request: Request) {
  try {
    const profile = await member(request);
    const db = getD1();
    const [directory, posts, messages] = await Promise.all([
      db.prepare('SELECT member_id, display_name, headline, bio FROM community_members ORDER BY display_name LIMIT 500').all(),
      db.prepare('SELECT p.id,p.member_id,m.display_name,p.body,p.created_at FROM club_posts p JOIN community_members m ON m.member_id=p.member_id ORDER BY p.id DESC LIMIT 100').all(),
      db.prepare('SELECT * FROM (SELECT id,sender_id,recipient_id,body,created_at FROM direct_messages WHERE sender_id=? OR recipient_id=? ORDER BY id DESC LIMIT 200) ORDER BY id').bind(profile.id,profile.id).all(),
    ]);
    return Response.json({selfId:profile.id,members:directory.results,posts:posts.results,messages:messages.results},{headers:{'cache-control':'no-store'}});
  } catch(error) { return failure(error); }
}

export async function POST(request: Request) {
  try {
    const profile = await member(request);
    const db = getD1();
    const body = await request.json() as Record<string,unknown>;
    const now = new Date().toISOString();
    if (body.action === 'join') {
      const name = typeof body.displayName === 'string' ? body.displayName.trim().slice(0,80) : '';
      if (!name || body.consent !== true) throw new Error('Choose a display name and confirm sharing with members.');
      await db.prepare('INSERT INTO community_members (member_id,display_name,headline,bio,joined_at) VALUES (?,?,?,?,?) ON CONFLICT(member_id) DO UPDATE SET display_name=excluded.display_name,headline=excluded.headline,bio=excluded.bio')
        .bind(profile.id,name,String(body.headline ?? '').trim().slice(0,150),String(body.bio ?? '').trim().slice(0,600),now).run();
    } else {
      const joined = await db.prepare('SELECT member_id FROM community_members WHERE member_id=?').bind(profile.id).first();
      if (!joined) throw new Error('Join the member directory before posting or messaging.');
      const message = typeof body.body === 'string' ? body.body.trim() : '';
      if (!message || message.length > 4000) throw new Error('Write between 1 and 4,000 characters.');
      if (body.action === 'post') {
        await db.prepare('INSERT INTO club_posts (member_id,body,created_at) VALUES (?,?,?)').bind(profile.id,message,now).run();
      } else if (body.action === 'message') {
        const recipient = Number(body.recipientId);
        if (!Number.isInteger(recipient) || recipient === profile.id) throw new Error('Choose another member.');
        if (!await db.prepare('SELECT member_id FROM community_members WHERE member_id=?').bind(recipient).first()) throw new Error('This member is not available for messages.');
        await db.batch([
          db.prepare('INSERT INTO direct_messages (sender_id,recipient_id,body,created_at) VALUES (?,?,?,?)').bind(profile.id,recipient,message,now),
          db.prepare("INSERT INTO notifications (member_id,title,body,is_read,created_at) VALUES (?,'New direct message','A member sent you a message. Open Messaging to read it.',0,?)").bind(recipient,now),
        ]);
      } else throw new Error('Unknown messaging action.');
    }
    return Response.json({ok:true});
  } catch(error) { return failure(error); }
}
