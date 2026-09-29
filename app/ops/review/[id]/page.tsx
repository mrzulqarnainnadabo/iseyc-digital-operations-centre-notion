"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ErrorBanner } from "@/components/ErrorBanner";

type MeetingStatus = "New" | "Draft" | "In review" | "Approved" | "Archived";
type Meeting = { id:string; title:string; status:MeetingStatus; conveningBody:string; meetingDate:string; summary:string; sensitivity:string };

const transitions: Record<MeetingStatus, MeetingStatus[]> = {
  New:["Draft","In review","Archived"], Draft:["In review","Archived"], "In review":["Approved","Archived"], Approved:["Archived"], Archived:[]
};

export default function ReviewPage() {
  const params=useParams(); const id=String(params.id||"");
  const [meeting,setMeeting]=useState<Meeting|null>(null); const [error,setError]=useState<string|null>(null); const [pending,setPending]=useState(false);
  async function load(){ try{const res=await fetch(`/api/meetings/${id}`); const data=await res.json(); if(!res.ok) throw new Error(data.error||"Unavailable"); setMeeting(data.data); setError(null);}catch(e){setError(e instanceof Error?e.message:"Could not load record.");setMeeting(null);} }
  useEffect(()=>{if(id) load();},[id]);
  async function setStatus(status:MeetingStatus){setPending(true);setError(null);try{const res=await fetch(`/api/meetings/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})});const data=await res.json();if(!res.ok){setError(data.error||"Update failed.");return;}setMeeting(data.data);}catch{setError("Network error. Check your connection and try again.");}finally{setPending(false);}}
  if(error&&!meeting)return <div className="space-y-3"><Link href="/ops/queue" className="inline-flex min-h-[44px] items-center text-sm font-medium text-emerald-800">← Queue</Link><ErrorBanner message={error}/></div>;
  if(!meeting)return <p role="status" className="text-sm text-slate-600">Loading record…</p>;
  const next=transitions[meeting.status];
  return <div className="mx-auto max-w-2xl space-y-5">
    <Link href="/ops/queue" className="inline-flex min-h-[44px] items-center text-sm font-medium text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">← Return to queue</Link>
    <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-600">Controlled review</p><h2 className="mt-1 font-serif text-2xl text-slate-950">{meeting.title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">Approval is a human governance action. The system does not approve records automatically.</p></div>
    <dl className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
      <div><dt className="text-xs uppercase tracking-wide text-slate-600">Status</dt><dd><span className="mt-1 inline-flex rounded-full border border-slate-300 px-2.5 py-1 text-sm font-semibold">{meeting.status}</span></dd></div>
      <div><dt className="text-xs uppercase tracking-wide text-slate-600">Sensitivity</dt><dd className="font-medium">{meeting.sensitivity}</dd></div>
      <div><dt className="text-xs uppercase tracking-wide text-slate-600">Convening body</dt><dd className="font-medium">{meeting.conveningBody}</dd></div>
      <div><dt className="text-xs uppercase tracking-wide text-slate-600">Meeting date</dt><dd className="font-medium">{meeting.meetingDate||"—"}</dd></div>
      <div className="sm:col-span-2"><dt className="text-xs uppercase tracking-wide text-slate-600">Summary</dt><dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{meeting.summary||"—"}</dd></div>
    </dl>
    {error?<ErrorBanner message={error}/>:null}
    <div className="flex flex-wrap gap-2" aria-label="Record actions">
      {next.includes("In review")?<button type="button" disabled={pending} aria-busy={pending} onClick={()=>setStatus("In review")} className="min-h-[48px] rounded-xl border border-slate-300 px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:opacity-50">Open review</button>:null}
      {next.includes("Approved")?<button type="button" disabled={pending} aria-busy={pending} onClick={()=>setStatus("Approved")} className="min-h-[48px] rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:opacity-50">Approve record</button>:null}
      {next.includes("Archived")?<button type="button" disabled={pending} aria-busy={pending} onClick={()=>setStatus("Archived")} className="min-h-[48px] rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 disabled:opacity-50">Archive record</button>:null}
    </div>
  </div>;
}
