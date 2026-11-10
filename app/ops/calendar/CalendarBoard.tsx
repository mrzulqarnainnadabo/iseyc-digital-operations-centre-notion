"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Meeting = {
  id: string;
  title: string;
  status: string;
  conveningBody: string;
  meetingDate: string;
  summary: string;
  meetingType: string;
  meetingTime: string;
};

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}

function parseDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

export default function CalendarBoard({ meetings, error }: { meetings: Meeting[]; error?: string | null }) {
  const today = new Date();
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(dateKey(today));
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const offset = monthStart.getDay();
  const grouped = useMemo(() => {
    const map = new Map<string, Meeting[]>();
    for (const meeting of meetings) {
      const date = parseDate(meeting.meetingDate);
      if (!date) continue;
      const key = dateKey(date);
      map.set(key, [...(map.get(key) || []), meeting]);
    }
    for (const values of map.values()) values.sort((a,b) => a.title.localeCompare(b.title));
    return map;
  }, [meetings]);
  const selectedMeetings = grouped.get(selected) || [];
  const monthMeetings = meetings.filter((meeting) => {
    const date = parseDate(meeting.meetingDate);
    return date && date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth();
  }).sort((a,b) => a.meetingDate.localeCompare(b.meetingDate));
  const monthLabel = month.toLocaleDateString("en-NG", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-gold-700">ISEYC · Internal coordination</p><h1 className="mt-2 font-serif text-3xl text-forest-950">Meeting calendar</h1><p className="mt-2 text-sm text-ink-600">First loaded page (up to 50 records) from the connected internal Meetings register. Older records may not appear here.</p></div>
        <Link href="/ops/intake" className="inline-flex min-h-[44px] items-center rounded-control bg-forest-900 px-4 text-sm font-semibold text-white hover:bg-forest-800">+ Schedule meeting</Link>
      </header>
      {error ? <p role="alert" className="rounded-card border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">{error}</p> : null}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,.8fr)]">
        <section className="rounded-card border border-line bg-white p-4 shadow-card sm:p-5" aria-label="Monthly meeting calendar">
          <div className="mb-4 flex items-center justify-between gap-3">
            <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth()-1, 1))} aria-label="Previous month" className="min-h-[40px] min-w-[40px] rounded-control border border-line text-lg text-forest-900 hover:bg-forest-50">‹</button>
            <h2 className="font-serif text-xl text-forest-950">{monthLabel}</h2>
            <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth()+1, 1))} aria-label="Next month" className="min-h-[40px] min-w-[40px] rounded-control border border-line text-lg text-forest-900 hover:bg-forest-50">›</button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-600">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((day) => <span key={day} className="py-2">{day}</span>)}</div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({length: offset}, (_, index) => <span key={`blank-${index}`} aria-hidden="true" />)}
            {Array.from({length: days}, (_, index) => {
              const date = new Date(month.getFullYear(), month.getMonth(), index+1);
              const key = dateKey(date);
              const count = grouped.get(key)?.length || 0;
              const active = selected === key;
              const isToday = key === dateKey(today);
              return <button key={key} type="button" onClick={() => setSelected(key)} aria-pressed={active} aria-label={`${date.toLocaleDateString("en-NG",{dateStyle:"full"})}, ${count} meetings in the loaded page`} className={`relative flex min-h-[58px] flex-col items-center justify-center rounded-control border text-sm transition-colors ${active ? "border-forest-900 bg-forest-900 text-white" : "border-transparent text-ink-900 hover:border-line hover:bg-forest-50"}`}>
                <span className={isToday && !active ? "font-bold text-gold-700" : ""}>{index+1}</span>
                {count > 0 ? <span className={`mt-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${active ? "bg-white/15 text-white" : "bg-gold-100 text-forest-900"}`}>{count}</span> : null}
              </button>;
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 border-t border-line pt-3 text-xs text-ink-600"><span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-gold-600" />Meetings in loaded page</span><span>Today is marked in gold</span></div>
        </section>
        <aside className="space-y-4">
          <section className="rounded-card border border-line bg-white p-4 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-gold-700">Selected date</p>
            <h2 className="mt-2 font-serif text-xl text-forest-950">{parseDate(selected)?.toLocaleDateString("en-NG",{weekday:"long",day:"numeric",month:"long",year:"numeric"}) || selected}</h2>
            <p className="mt-1 text-xs text-ink-600">{selectedMeetings.length} scheduled {selectedMeetings.length === 1 ? "meeting" : "meetings"}</p>
            {selectedMeetings.length ? <ul className="mt-4 space-y-3">{selectedMeetings.map((meeting) => <li key={meeting.id} className="border-t border-line pt-3"><Link href={`/ops/review/${encodeURIComponent(meeting.id)}`} className="font-semibold text-forest-900 hover:underline">{meeting.title}</Link><p className="mt-1 text-xs text-ink-600">{meeting.meetingTime ? `${meeting.meetingTime} WAT · ` : ""}{meeting.meetingType ? `${meeting.meetingType} · ` : ""}{meeting.conveningBody} · {meeting.status}</p></li>)}</ul> : <p className="mt-4 rounded-control bg-cream-50 p-3 text-sm text-ink-600">No meeting is recorded for this date.</p>}
          </section>
          <section className="rounded-card border border-line bg-forest-950 p-4 text-white">
            <p className="text-xs font-semibold uppercase tracking-[.14em] text-[#d7c18f]">This month · loaded page</p>
            <p className="mt-2 font-serif text-4xl tabular-nums">{monthMeetings.length}</p>
            <p className="mt-1 text-sm text-white/70">meetings with a valid scheduled date in this loaded page</p>
          </section>
        </aside>
      </div>
      <section className="rounded-card border border-line bg-white p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-gold-700">Agenda view</p><h2 className="mt-1 font-serif text-xl text-forest-950">{monthLabel}</h2></div><span className="text-xs text-ink-600">Loaded page · Notion Meetings</span></div>
        {monthMeetings.length ? <ul className="mt-4 divide-y divide-line">{monthMeetings.map((meeting) => <li key={meeting.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-forest-950">{meeting.title}</p><p className="mt-1 text-xs text-ink-600">{meeting.meetingDate}{meeting.meetingTime ? ` · ${meeting.meetingTime} WAT` : ""} · {meeting.meetingType || "Meeting"} · {meeting.conveningBody || "Convening body not supplied"}</p></div><Link href={`/ops/review/${encodeURIComponent(meeting.id)}`} className="inline-flex min-h-[40px] items-center text-sm font-semibold text-forest-800 hover:underline">Open record →</Link></li>)}</ul> : <p className="mt-4 rounded-control bg-cream-50 p-4 text-sm text-ink-600">No dated meetings are available for this month in the loaded page. Older records may not be included. Use Schedule meeting to add a record.</p>}
      </section>
      <p className="text-xs leading-5 text-ink-600">This calendar reflects only the first loaded page (up to 50 records) from the connected Meetings database. Older records may not appear. It does not create attendance, invitations, minutes or action assignments. Those remain separate operational capabilities and must not be inferred from a scheduled meeting.</p>
    </div>
  );
}
