import { requireSession } from '../../../../lib/auth-session';
import { getD1, getMemberUploads } from '../../../../lib/runtime';

function dataUrlToBytes(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) throw new Error('Only JPG, PNG, and WebP photos are supported.');
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  if (bytes.byteLength > 5 * 1024 * 1024 || bytes.byteLength < 12) throw new Error('Choose an image smaller than 5 MB.');
  return { contentType: match[1], bytes };
}

async function owner(request:Request) {
  const session=await requireSession(request);
  const profile=await getD1().prepare('SELECT id FROM member_profiles WHERE email=?').bind(session.email).first<{id:number}>();
  if(!profile)throw new Error('Open your dashboard first.');
  return profile.id;
}
const failure=(error:unknown)=>error instanceof Response?error:Response.json({error:error instanceof Error?error.message:'Photo unavailable.'},{status:400});
export async function GET(request:Request) {
  try {
    const id=await owner(request);
    const avatar=await getD1().prepare('SELECT object_key FROM member_avatars WHERE member_id=?').bind(id).first<{object_key:string}>();
    if (avatar?.object_key.startsWith('data:image/')) {
      const image = dataUrlToBytes(avatar.object_key);
      return new Response(image.bytes,{headers:{'content-type':image.contentType,'cache-control':'private, no-store','x-content-type-options':'nosniff'}});
    }
    const image=avatar?await getMemberUploads().get(avatar.object_key):null;
    if(!image)return new Response(null,{status:404});
    return new Response(image.body,{headers:{'content-type':image.httpMetadata?.contentType||'image/webp','cache-control':'private, no-store','x-content-type-options':'nosniff'}});
  }catch(error){return failure(error);}
}
export async function POST(request:Request) {
  try {
    const id=await owner(request);
    if(Number(request.headers.get('content-length'))>6*1024*1024)throw new Error('The image is too large.');
    if ((request.headers.get('content-type') ?? '').includes('application/json')) {
      const payload = await request.json() as { image?: unknown };
      const dataUrl = typeof payload.image === 'string' ? payload.image : '';
      dataUrlToBytes(dataUrl);
      await getD1().prepare('INSERT INTO member_avatars(member_id,object_key,updated_at) VALUES(?,?,?) ON CONFLICT(member_id) DO UPDATE SET object_key=excluded.object_key,updated_at=excluded.updated_at').bind(id,dataUrl,new Date().toISOString()).run();
      return Response.json({ok:true});
    }
    const file=(await request.formData()).get('photo');
    if(!(file instanceof File)||file.size>5*1024*1024||file.size<12)throw new Error('Choose an image smaller than 5 MB.');
    const bytes=new Uint8Array(await file.arrayBuffer());
    const png=bytes.slice(0,8).every((b,i)=>b===[137,80,78,71,13,10,26,10][i]);
    const jpg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
    const webp=new TextDecoder().decode(bytes.slice(0,4))==='RIFF'&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP';
    if(!png&&!jpg&&!webp)throw new Error('Only JPG, PNG, and WebP photos are supported.');
    const db=getD1();const bucket=getMemberUploads();
    const old=await db.prepare('SELECT object_key FROM member_avatars WHERE member_id=?').bind(id).first<{object_key:string}>();
    const key=`member-avatars/${id}/${crypto.randomUUID()}`;
    await bucket.put(key,bytes.buffer,{httpMetadata:{contentType:png?'image/png':jpg?'image/jpeg':'image/webp'}});
    try {await db.prepare('INSERT INTO member_avatars(member_id,object_key,updated_at) VALUES(?,?,?) ON CONFLICT(member_id) DO UPDATE SET object_key=excluded.object_key,updated_at=excluded.updated_at').bind(id,key,new Date().toISOString()).run();}catch(error){await bucket.delete(key);throw error;}
    if(old)await bucket.delete(old.object_key);
    return Response.json({ok:true});
  }catch(error){return failure(error);}
}
export async function DELETE(request:Request) {
  try {const id=await owner(request);const db=getD1();const old=await db.prepare('SELECT object_key FROM member_avatars WHERE member_id=?').bind(id).first<{object_key:string}>();await db.prepare('DELETE FROM member_avatars WHERE member_id=?').bind(id).run();if(old&&!old.object_key.startsWith('data:image/'))await getMemberUploads().delete(old.object_key);return Response.json({ok:true});}catch(error){return failure(error);}
}
