"use client";
import { useRef, useState } from 'react';
import { Camera, Trash2, UserRound } from 'lucide-react';
export function ProfilePhoto({photoUrl,name,onSaved}:{photoUrl?:string|null;name:string;onSaved:()=>Promise<unknown>}) {
  const input=useRef<HTMLInputElement>(null);
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState('');
  async function upload(file:File) {
    setBusy(true);setNotice('');
    let bitmap:ImageBitmap|undefined;
    try {
      if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024) throw new Error('Choose a JPG, PNG, or WebP image smaller than 5 MB.');
      bitmap=await createImageBitmap(file);
      const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
      const context=canvas.getContext('2d');if(!context)throw new Error('This browser cannot prepare your photo.');
      const side=Math.min(bitmap.width,bitmap.height);
      context.drawImage(bitmap,(bitmap.width-side)/2,(bitmap.height-side)/2,side,side,0,0,512,512);
      const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('Unable to prepare photo.')),'image/webp',.88));
      const form=new FormData();form.set('photo',blob,'avatar.webp');
      const response=await fetch('/api/member/avatar',{method:'POST',body:form});
      if(!response.ok)throw new Error((await response.json()).error||'Upload failed.');
      await onSaved();setNotice('Profile photo saved.');
    } catch(error){setNotice(error instanceof Error?error.message:'Upload failed.');}
    finally{bitmap?.close();setBusy(false);if(input.current)input.current.value='';}
  }
  async function remove() {setBusy(true);setNotice('');try{const response=await fetch('/api/member/avatar',{method:'DELETE'});if(!response.ok)throw new Error('Unable to remove photo.');await onSaved();setNotice('Photo removed.');}catch(error){setNotice(error instanceof Error?error.message:'Unable to remove photo.');}finally{setBusy(false);}}
  return <section className="profile-photo-settings"><div className="profile-photo-preview">{photoUrl?<img src={photoUrl} alt={`${name}'s profile`}/>:<UserRound size={34}/>}</div><div><h2>Profile photo</h2><p>JPG, PNG, or WebP. Up to 5 MB.</p><input ref={input} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Upload profile photo" hidden onChange={event=>{const file=event.target.files?.[0];if(file)void upload(file);}}/><div className="photo-actions"><button type="button" disabled={busy} onClick={()=>input.current?.click()}><Camera size={17}/>{busy?'Saving...':photoUrl?'Change photo':'Upload photo'}</button>{photoUrl&&<button type="button" className="theme-toggle" disabled={busy} title="Remove profile photo" aria-label="Remove profile photo" onClick={()=>void remove()}><Trash2 size={17}/></button>}</div><p role="status">{notice}</p></div></section>;
}
