"use client";
import { useEffect, useState } from 'react';
import { MemberProfile } from '../profile-report';
import type { MemberData } from '../page';
export default function ReportPage() {
  const [data,setData]=useState<MemberData|null>(null);
  const [error,setError]=useState('');
  useEffect(()=>{fetch('/api/member',{cache:'no-store'}).then(async response=>{if(response.status===401){window.location.assign('/?login=1');return;}if(!response.ok)throw new Error('Your profile could not load. Please reload this page.');setData((await response.json()).data);}).catch(error=>setError(error.message));},[]);
  return <main className="report-route">{data?<MemberProfile data={data} printView/>:<p role="status">{error||'Preparing your profile...'}</p>}</main>;
}
