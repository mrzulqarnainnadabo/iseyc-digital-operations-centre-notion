"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function IntakePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [conveningBody, setConveningBody] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [summary, setSummary] = useState("");
  const [sensitivity, setSensitivity] = useState("Standard");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, conveningBody, meetingDate, summary, sensitivity }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create meeting");
        return;
      }
      router.push(`/ops/review/${data.id}`);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link href="/ops/queue" className="text-sm text-emerald-800 hover:underline">
        ← Meeting queue
      </Link>
      <h2 className="font-serif text-2xl text-slate-950">New meeting intake</h2>
      <p className="text-sm text-slate-600">
        Creates a New record in Notion. Not institutional memory until an officer approves it.
      </p>
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div>
          <label className="text-sm font-medium" htmlFor="title">Meeting title</label>
          <input id="title" required minLength={5} value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 min-h-[48px] w-full rounded-xl border border-slate-300 px-3" />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="body">Convening body</label>
          <input id="body" value={conveningBody} onChange={(e) => setConveningBody(e.target.value)} className="mt-1 min-h-[48px] w-full rounded-xl border border-slate-300 px-3" />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="date">Meeting date</label>
          <input id="date" type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} className="mt-1 min-h-[48px] w-full rounded-xl border border-slate-300 px-3" />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="summary">Summary / notes</label>
          <textarea id="summary" rows={4} value={summary} onChange={(e) => setSummary(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="sens">Sensitivity</label>
          <select id="sens" value={sensitivity} onChange={(e) => setSensitivity(e.target.value)} className="mt-1 min-h-[48px] w-full rounded-xl border border-slate-300 px-3">
            <option>Standard</option>
            <option>Restricted</option>
          </select>
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button type="submit" disabled={pending} className="min-h-[52px] w-full rounded-xl bg-emerald-700 font-semibold text-white disabled:opacity-60">
          {pending ? "Saving…" : "Submit for queue"}
        </button>
      </form>
    </div>
  );
}
