"use client";
import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowUpRight, RefreshCw, Send } from 'lucide-react';

type Member = {member_id:number;display_name:string;headline:string;bio:string};
type Board = {selfId:number;members:Member[];posts:{id:number;member_id:number;display_name:string;body:string;created_at:string}[];messages:{id:number;sender_id:number;recipient_id:number;body:string;created_at:string}[]};
const date = (value:string) => new Date(value).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
const initials = (name:string) => name.split(' ').map(x=>x[0]).slice(0,2).join('');

export function Messaging({displayName}:{displayName:string}) {
  const [data,setData] = useState<Board|null>(null);
  const [tab,setTab] = useState<'board'|'direct'>('board');
  const [selected,setSelected] = useState<number|null>(null);
  const [publicProfile,setPublicProfile] = useState<Member|null>(null);
  const [draft,setDraft] = useState('');
  const [posting,setPosting] = useState(false);
  const [error,setError] = useState('');
  const [editing,setEditing] = useState(false);
  async function refresh() {
    try {
      const response = await fetch('/api/community',{cache:'no-store'});
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setData(result); setError('');
    } catch(error) { setError(error instanceof Error ? error.message : 'Unable to load messages.'); }
  }
  useEffect(()=>{ void refresh(); const timer = setInterval(()=>{if(document.visibilityState==='visible') void refresh();},15000); return ()=>clearInterval(timer); },[]);
  async function send(payload:Record<string,unknown>) {
    setPosting(true); setError('');
    try {
      const response = await fetch('/api/community',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setDraft('');setEditing(false);await refresh();
    } catch(error) { setError(error instanceof Error ? error.message : 'Your message was not sent.'); }
    finally {setPosting(false);}
  }
  const self = data?.members.find(member=>member.member_id===data.selfId);
  const recipient = data?.members.find(member=>member.member_id===selected);
  const thread = data?.messages.filter(message=>(message.sender_id===data.selfId && message.recipient_id===selected)||(message.sender_id===selected && message.recipient_id===data.selfId)) ?? [];
  function openMessage(member:Member) { setSelected(member.member_id);setTab('direct');setDraft('');setPublicProfile(null); }
  function submit(event:FormEvent) { event.preventDefault(); void send(tab==='board'?{action:'post',body:draft}:{action:'message',body:draft,recipientId:selected}); }
  return <div className="portal-view-stack">
    <div className="portal-page-heading split"><div><span className="portal-eyebrow">THE MEMBER COMMUNITY</span><h1>Messaging.</h1></div><button className="theme-toggle" title="Refresh messages" aria-label="Refresh messages" onClick={()=>void refresh()}><RefreshCw size={19}/></button></div>
    {error && <p className="portal-alert" role="alert">{error}</p>}
    {!data ? <p>Loading conversations...</p> : <>
      {(!self||editing) && <form className="member-public-profile plan-compose" onSubmit={event=>{event.preventDefault();const form=new FormData(event.currentTarget);void send({action:'join',displayName:form.get('displayName'),headline:form.get('headline'),bio:form.get('bio'),consent:form.get('consent')==='on'});}}>
        <h2>{self?'Your community profile':'Meet the members.'}</h2>
        <label><span>Display name</span><input name="displayName" defaultValue={self?.display_name??displayName} maxLength={80} required /></label>
        <label><span>What you do</span><input name="headline" defaultValue={self?.headline} maxLength={150} /></label>
        <label className="plan-field-wide"><span>A little about you</span><textarea name="bio" defaultValue={self?.bio} maxLength={600} /></label>
        <label className="plan-field-wide"><input type="checkbox" name="consent" required /> Share this profile with other ABLE members and allow direct messages.</label>
        <p className="plan-field-wide">Your questionnaire answers, birth details, and personal profile stay private.</p>
        <button disabled={posting}>{posting?'Saving...':self?'Save community profile':'Join the community'}</button>
      </form>}
      <div className="messaging-tabs" role="tablist" aria-label="Messaging views"><button role="tab" aria-selected={tab==='board'} className={tab==='board'?'active':''} onClick={()=>{setTab('board');setDraft('');}}>Member board</button><button role="tab" aria-selected={tab==='direct'} className={tab==='direct'?'active':''} onClick={()=>{setTab('direct');setDraft('');}}>Direct messages</button></div>
      <div className="member-board"><section>
        {publicProfile && <article className="member-public-profile"><h2>{publicProfile.display_name}</h2><p>{publicProfile.headline}</p><p>{publicProfile.bio||'No introduction yet.'}</p><button className="profile-print" disabled={!self} onClick={()=>openMessage(publicProfile)}>Message <ArrowUpRight size={17}/></button></article>}
        {tab==='board'? <>
          {self&&<form onSubmit={submit}><textarea aria-label="Post to member board" placeholder="Share a thought, a question, or a next move." value={draft} onChange={event=>setDraft(event.target.value)} required maxLength={4000}/><button disabled={posting||!draft.trim()}>{posting?'Posting...':'Post to members'}</button></form>}
          {data.posts.length?data.posts.map(post=><article className="board-post" key={post.id}><header><div className="board-avatar">{initials(post.display_name)}</div><div><button onClick={()=>setPublicProfile(data.members.find(member=>member.member_id===post.member_id)??null)}>{post.display_name}</button><small>{date(post.created_at)}</small></div></header><p>{post.body}</p></article>):<p className="empty-state">No conversations yet. Start with an introduction.</p>}
        </>:recipient?<>
          <header className="direct-heading"><h2>{recipient.display_name}</h2><button className="theme-toggle" title="Back to conversations" aria-label="Back to conversations" onClick={()=>setSelected(null)}><ArrowLeft size={18}/></button></header>
          <div className="direct-thread" aria-live="polite">{thread.length?thread.map(message=><article key={message.id} className={message.sender_id===data.selfId?'sent':''}><p>{message.body}</p><small>{date(message.created_at)}</small></article>):<p>No messages yet. Say hello.</p>}</div>
          {self&&<form className="direct-compose" onSubmit={submit}><input aria-label={`Message ${recipient.display_name}`} value={draft} onChange={event=>setDraft(event.target.value)} placeholder="Write a message..." maxLength={4000} required/><button disabled={posting||!draft.trim()} aria-label="Send message"><Send size={19}/></button></form>}
        </>:<div>{data.members.filter(member=>member.member_id!==data.selfId&&data.messages.some(message=>message.sender_id===member.member_id||message.recipient_id===member.member_id)).map(member=><article className="board-post" key={member.member_id}><button className="profile-print" onClick={()=>openMessage(member)}>{member.display_name}<ArrowUpRight size={17}/></button></article>)}<p className="empty-state">Choose a member to open a private conversation.</p></div>}
      </section><aside className="member-directory"><h2>In the room</h2>{self&&<button onClick={()=>setEditing(!editing)}>Edit your introduction</button>}{data.members.filter(member=>member.member_id!==data.selfId).map(member=><article key={member.member_id}><strong>{member.display_name}</strong><p>{member.headline||'ABLE member'}</p><button onClick={()=>setPublicProfile(member)}>View profile</button> <button disabled={!self} onClick={()=>openMessage(member)}>Message</button></article>)}{data.members.filter(member=>member.member_id!==data.selfId).length===0&&<p>New members will appear when they join the directory.</p>}</aside></div>
    </>}
  </div>;
}
