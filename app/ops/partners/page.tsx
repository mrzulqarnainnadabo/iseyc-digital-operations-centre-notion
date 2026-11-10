"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type Option = { id: string; title: string; detail: string; status: string; url: string; organisationId?: string; verified?: boolean; relationshipStatus?: string };
type Invitation = { id: string; title: string; organisation: string; contact: string; meeting: string; status: string; participation: string; purpose: string; subject: string; draft: string; sentOn: string; url: string };
type Data = { organisations: Option[]; contacts: Option[]; meetings: Option[]; invitations: Invitation[]; invitationsNextCursor: string | null; invitationsHasMore: boolean };

const organisationTypes = ["Government institution", "Civil society organisation", "University or research institution", "Private sector", "Development partner", "Professional association", "Community organisation", "Media organisation", "Other"];
const participationTypes = ["Observer", "Presenter", "Technical contributor", "Panelist", "Resource person", "Institutional representative", "Prospective partner", "Host", "Other"];
const field = "mt-1 min-h-11 w-full rounded-control border border-line bg-white px-3 text-sm";
const label = "block text-sm font-medium text-ink-800";
const eligibleOrganisation = (x: Option) => x.status === "Verified" && !["Paused", "Declined", "Former collaborator"].includes(x.relationshipStatus || "");

export default function ExternalEngagementPage() {
  const searchParams = useSearchParams();
  const requestedMeetingId = searchParams.get("meetingId") || "";
  const [data, setData] = useState<Data>({ organisations: [], contacts: [], meetings: [], invitations: [], invitationsNextCursor: null, invitationsHasMore: false });
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [activeView, setActiveView] = useState<"directory" | "invitations" | "agreements">("invitations");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState(organisationTypes[1]);
  const [orgWebsite, setOrgWebsite] = useState("");
  const [orgEmail, setOrgEmail] = useState("");
  const [orgPhone, setOrgPhone] = useState("");
  const [orgLocation, setOrgLocation] = useState("");
  const [orgOwner, setOrgOwner] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactOrg, setContactOrg] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactOwner, setContactOwner] = useState("");
  const [meetingId, setMeetingId] = useState("");
  const [inviteOrg, setInviteOrg] = useState("");
  const [inviteContact, setInviteContact] = useState("");
  const [inviteType, setInviteType] = useState("Institutional representative");
  const [invitePurpose, setInvitePurpose] = useState("");
  const [inviteSubject, setInviteSubject] = useState("");
  const [inviteDraft, setInviteDraft] = useState("");
  const [agendaItems, setAgendaItems] = useState("");
  const [inviteOwner, setInviteOwner] = useState("");
  const [inviteChannel, setInviteChannel] = useState("Email");

  async function refresh(appendInvitations = false) {
    setLoading(true); setError("");
    const cursor = appendInvitations ? data.invitationsNextCursor : null;
    try {
      const suffix = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
      const response = await fetch(`/ops/api/external-engagement${suffix}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "External engagement registers could not be loaded.");
      if (!Array.isArray(result.invitations) || (result.invitationsNextCursor !== null && typeof result.invitationsNextCursor !== "string") || typeof result.invitationsHasMore !== "boolean") throw new Error("The invitation register returned an invalid pagination response.");
      setData(current => appendInvitations
        ? { ...result, invitations: [...current.invitations, ...result.invitations] }
        : result as Data);
      setLoaded(true);
      setContactOrg(current => current || result.organisations?.[0]?.id || "");
      setInviteOrg(current => current && result.organisations?.some((x: Option) => x.id === current && eligibleOrganisation(x)) ? current : result.organisations?.find(eligibleOrganisation)?.id || "");
      setMeetingId(current => { const candidate = requestedMeetingId || current; return result.meetings?.some((x: Option) => x.id === candidate) ? candidate : result.meetings?.[0]?.id || ""; });
    } catch (cause) {
      if (!appendInvitations) {
        setLoaded(false);
        setData({ organisations: [], contacts: [], meetings: [], invitations: [], invitationsNextCursor: null, invitationsHasMore: false });
      }
      setError(cause instanceof Error ? cause.message : "The service could not be reached.");
    } finally { setLoading(false); }
  }
  useEffect(() => { void refresh(); }, []);

  const eligibleOrganisations = useMemo(() => data.organisations.filter(eligibleOrganisation), [data.organisations]);
  const eligibleContacts = useMemo(() => data.contacts.filter(x => x.organisationId === inviteOrg && x.status === "Active" && x.verified), [data.contacts, inviteOrg]);

  async function submit(action: string, body: Record<string, string>, reset: () => void, success: string) {
    if (busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/ops/api/external-engagement", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...body }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "The record could not be saved.");
      reset(); setNotice(success); await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The record could not be saved.");
    } finally { setBusy(false); }
  }

  function createOrganisation(e: FormEvent) {
    e.preventDefault();
    void submit("organisation", { name: orgName, type: orgType, website: orgWebsite, email: orgEmail, phone: orgPhone, location: orgLocation, owner: orgOwner }, () => { setOrgName(""); setOrgWebsite(""); setOrgEmail(""); setOrgPhone(""); setOrgLocation(""); }, "Organisation record created. It remains unverified until an officer checks its official identity and evidence.");
  }
  function createContact(e: FormEvent) {
    e.preventDefault();
    void submit("contact", { name: contactName, organisationId: contactOrg, role: contactRole, email: contactEmail, phone: contactPhone, owner: contactOwner }, () => { setContactName(""); setContactRole(""); setContactEmail(""); setContactPhone(""); }, "Contact record created. It remains unverified and cannot yet be selected for an invitation.");
  }
  function createInvitation(e: FormEvent) {
    e.preventDefault();
    const title = data.organisations.find(x => x.id === inviteOrg)?.title || "External organisation";
    void submit("invitation", { title: `${title} — ${inviteType}`, meetingId, organisationId: inviteOrg, contactId: inviteContact, participation: inviteType, purpose: invitePurpose, subject: inviteSubject, draft: inviteDraft, agendaItems, ownerRole: inviteOwner, channel: inviteChannel }, () => { setInvitePurpose(""); setInviteSubject(""); setInviteDraft(""); setAgendaItems(""); setInviteContact(""); }, "Invitation draft created and linked to the approved meeting. It has NOT been sent.");
  }

  return <div className="mx-auto max-w-6xl space-y-6">
    <header className="overflow-hidden rounded-card border border-forest-900 bg-forest-950 p-5 text-white shadow-card sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#d7c18f]">ISEYC · External institutional engagement</p>
      <h1 className="mt-2 font-serif text-3xl sm:text-4xl">External relationships</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-white/75">Organisations · verified contacts · meeting invitations · formal commitments.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-control border border-white/15 bg-white/5 p-3"><p className="text-xs text-white/60">Organisations</p><p className="mt-1 text-2xl font-semibold">{loading || !loaded ? "—" : data.organisations.length}</p><p className="text-xs text-white/60">Loaded register records</p></div>
        <div className="rounded-control border border-white/15 bg-white/5 p-3"><p className="text-xs text-white/60">Verified organisations</p><p className="mt-1 text-2xl font-semibold">{loading || !loaded ? "—" : eligibleOrganisations.length}</p><p className="text-xs text-white/60">Eligible for invitation drafts</p></div>
        <div className="rounded-control border border-white/15 bg-white/5 p-3"><p className="text-xs text-white/60">Invitation records</p><p className="mt-1 text-2xl font-semibold">{loading || !loaded ? "—" : data.invitations.length}</p><p className="text-xs text-white/60">Loaded register records</p></div>
      </div>
      <nav aria-label="External engagement sections" className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4">
        {(["invitations", "directory", "agreements"] as const).map((view) => (
          <button key={view} type="button" aria-pressed={activeView === view} onClick={() => setActiveView(view)}
            className={activeView === view ? "min-h-10 rounded-control bg-white px-4 text-xs font-semibold text-forest-950" : "min-h-10 rounded-control border border-white/20 px-4 text-xs font-semibold text-white/80 hover:bg-white/10"}>
            {view === "invitations" ? "Invitations" : view === "directory" ? "Organisations & contacts" : "Agreements"}
          </button>
        ))}
      </nav>
    </header>

    {error ? <p role="alert" className="rounded-control border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
    {notice ? <p role="status" className="rounded-control border border-green-200 bg-green-50 p-3 text-sm text-green-900">{notice}</p> : null}

    {activeView === "directory" ? <>
    <section className="grid gap-4 lg:grid-cols-2">
      <form onSubmit={createOrganisation} className="space-y-3 rounded-card border border-line bg-white p-4 shadow-card sm:p-5">
        <div><p className="text-xs font-semibold uppercase tracking-widest text-gold-700">01 · Organisation directory</p><h2 className="mt-1 font-serif text-xl text-forest-950">Register an organisation</h2><p className="mt-1 text-xs leading-5 text-ink-600">New entries are Prospects and Unverified. Do not mark an institution verified without evidence.</p></div>
        <label className={label}>Organisation name<input required maxLength={180} value={orgName} onChange={e=>setOrgName(e.target.value)} className={field}/></label>
        <label className={label}>Organisation type<select value={orgType} onChange={e=>setOrgType(e.target.value)} className={field}>{organisationTypes.map(x=><option key={x}>{x}</option>)}</select></label>
        <label className={label}>Official website<input type="url" placeholder="https://" value={orgWebsite} onChange={e=>setOrgWebsite(e.target.value)} className={field}/></label>
        <div className="grid gap-3 sm:grid-cols-2"><label className={label}>Official email<input type="email" value={orgEmail} onChange={e=>setOrgEmail(e.target.value)} className={field}/></label><label className={label}>Official phone<input value={orgPhone} onChange={e=>setOrgPhone(e.target.value)} className={field}/></label></div>
        <label className={label}>Location<input value={orgLocation} onChange={e=>setOrgLocation(e.target.value)} className={field}/></label>
        <label className={label}>ISEYC relationship owner role<input value={orgOwner} onChange={e=>setOrgOwner(e.target.value)} placeholder="e.g. Partnerships Officer" className={field}/></label>
        <button disabled={busy || orgName.trim().length<2} className="min-h-11 w-full rounded-control bg-forest-900 px-4 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Create organisation record"}</button>
      </form>

      <form onSubmit={createContact} className="space-y-3 rounded-card border border-line bg-white p-4 shadow-card sm:p-5">
        <div><p className="text-xs font-semibold uppercase tracking-widest text-gold-700">02 · Contact directory</p><h2 className="mt-1 font-serif text-xl text-forest-950">Register an institutional contact</h2><p className="mt-1 text-xs leading-5 text-ink-600">Use official work details. A new contact is unverified until checked by an officer.</p></div>
        <label className={label}>Contact name<input required value={contactName} onChange={e=>setContactName(e.target.value)} className={field}/></label>
        <label className={label}>Organisation<select required value={contactOrg} onChange={e=>setContactOrg(e.target.value)} className={field}><option value="">Select organisation</option>{data.organisations.map(x=><option key={x.id} value={x.id}>{x.title} · {x.status}</option>)}</select></label>
        <label className={label}>Official role<input value={contactRole} onChange={e=>setContactRole(e.target.value)} className={field}/></label>
        <div className="grid gap-3 sm:grid-cols-2"><label className={label}>Work email<input type="email" value={contactEmail} onChange={e=>setContactEmail(e.target.value)} className={field}/></label><label className={label}>Work phone<input value={contactPhone} onChange={e=>setContactPhone(e.target.value)} className={field}/></label></div>
        <label className={label}>ISEYC relationship owner role<input value={contactOwner} onChange={e=>setContactOwner(e.target.value)} className={field}/></label>
        <button disabled={busy || contactName.trim().length<2 || !contactOrg} className="min-h-11 w-full rounded-control bg-forest-900 px-4 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Create contact record"}</button>
      </form>
    </section>

    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-card border border-line bg-white p-4 shadow-card">
        <div className="flex items-center justify-between gap-2"><h2 className="font-serif text-xl text-forest-950">Organisation directory</h2><span className="text-xs text-ink-600">{data.organisations.length} loaded</span></div>
        <ul className="mt-3 divide-y divide-line">
          {data.organisations.length ? data.organisations.slice(0, 12).map(x=><li key={x.id} className="py-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold text-forest-950">{x.title}</p><span className="rounded-full border border-line bg-cream-50 px-2 py-1 text-xs">{x.status || "Unverified"}{x.relationshipStatus ? ` · ${x.relationshipStatus}` : ""}</span></div><p className="mt-1 text-xs text-ink-600">{x.detail || "Organisation type not recorded"}</p>{x.url ? <a href={x.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex min-h-8 items-center text-xs font-semibold text-forest-800 underline">Open organisation record ↗</a> : null}</li>) : <li className="py-3 text-sm text-ink-600">{loading ? "Loading organisations…" : !loaded ? "Register unavailable. Check the source connection above." : "No organisation records are currently loaded."}</li>}
        </ul>
      </div>
      <div className="rounded-card border border-line bg-white p-4 shadow-card">
        <div className="flex items-center justify-between gap-2"><h2 className="font-serif text-xl text-forest-950">External contacts</h2><span className="text-xs text-ink-600">{data.contacts.length} loaded</span></div>
        <ul className="mt-3 divide-y divide-line">
          {data.contacts.length ? data.contacts.slice(0, 12).map(x=><li key={x.id} className="py-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold text-forest-950">{x.title}</p><span className="rounded-full border border-line bg-cream-50 px-2 py-1 text-xs">{x.status || "Unverified"}</span></div><p className="mt-1 text-xs text-ink-600">{data.organisations.find(o=>o.id===x.organisationId)?.title || "Organisation not in loaded page"} · {x.detail || "Role not recorded"} · {x.verified ? "Identity verified" : "Identity not verified"}</p></li>) : <li className="py-3 text-sm text-ink-600">{loading ? "Loading contacts…" : !loaded ? "Register unavailable. Check the source connection above." : "No contact records are currently loaded."}</li>}
        </ul>
      </div>
    </section>

</> : null}

    {activeView === "agreements" ? <section className="rounded-card border border-line bg-white p-5 shadow-card sm:p-7"><p className="text-xs font-semibold uppercase tracking-widest text-gold-700">Governance</p><h2 className="mt-2 font-serif text-2xl text-forest-950">Partnership agreements & commitments</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-ink-600">Formal instruments are tracked separately from meeting invitations. Approval, execution and active status require competent authority and documentary evidence.</p><a href="https://app.notion.com/p/79a64759a3494f6383851afce6b051fa" target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-11 items-center rounded-control bg-forest-900 px-4 text-sm font-semibold text-white">Open agreement register ↗</a></section> : null}

    {activeView === "invitations" ? <>
    <form onSubmit={createInvitation} className="space-y-4 rounded-card border border-forest-200 bg-white p-4 shadow-card sm:p-6">
      <div><p className="text-xs font-semibold uppercase tracking-widest text-gold-700">03 · Meeting participation</p><h2 className="mt-1 font-serif text-2xl text-forest-950">Prepare an external invitation</h2><p className="mt-1 text-sm leading-6 text-ink-600">Approved meetings and verified organisations only. Named contacts require verified identity and recorded contact basis.</p></div>
      {loaded && data.meetings.length === 0 ? <div className="rounded-control border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">No approved Standard meetings are available. Approve a Standard meeting in the DOC Meetings register before preparing invitations.</div> : null}
      {loaded && eligibleOrganisations.length === 0 ? <div className="rounded-control border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">No eligible organisations yet. Add a prospect in the directory, then verify its official identity and relationship status.</div> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={label}>Approved meeting<select required value={meetingId} onChange={e=>setMeetingId(e.target.value)} className={field}><option value="">Select meeting</option>{data.meetings.map(x=><option key={x.id} value={x.id}>{x.title}{x.detail ? ` · ${x.detail}` : ""}</option>)}</select></label>
        <label className={label}>Verified organisation<select required value={inviteOrg} onChange={e=>{setInviteOrg(e.target.value);setInviteContact("");}} className={field}><option value="">Select organisation</option>{eligibleOrganisations.map(x=><option key={x.id} value={x.id}>{x.title}</option>)}</select></label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={label}>Verified contact (optional)<select value={inviteContact} onChange={e=>setInviteContact(e.target.value)} className={field}><option value="">Institutional office / no named contact</option>{eligibleContacts.map(x=><option key={x.id} value={x.id}>{x.title}{x.detail ? ` · ${x.detail}` : ""}</option>)}</select></label>
        <label className={label}>Participation type<select value={inviteType} onChange={e=>setInviteType(e.target.value)} className={field}>{participationTypes.map(x=><option key={x}>{x}</option>)}</select></label>
      </div>
      <label className={label}>Invitation purpose<textarea required minLength={5} maxLength={1000} rows={3} value={invitePurpose} onChange={e=>setInvitePurpose(e.target.value)} placeholder="Why is this organisation being invited, and what contribution is expected?" className="mt-1 w-full rounded-control border border-line p-3 text-sm"/></label>
      <label className={label}>Invitation subject<input required minLength={5} maxLength={180} value={inviteSubject} onChange={e=>setInviteSubject(e.target.value)} placeholder="Formal invitation to participate in…" className={field}/></label>
      <label className={label}>Invitation message draft<textarea required minLength={20} maxLength={1800} rows={6} value={inviteDraft} onChange={e=>setInviteDraft(e.target.value)} placeholder="Prepare the organisation-specific invitation. Include meeting purpose, date, participation request, response deadline and contact details. Keep it as a draft for review." className="mt-1 w-full rounded-control border border-line p-3 text-sm leading-6"/></label>
      <label className={label}>Relevant agenda items<textarea maxLength={800} rows={2} value={agendaItems} onChange={e=>setAgendaItems(e.target.value)} placeholder="Specify only the agenda items relevant to this invitee." className="mt-1 w-full rounded-control border border-line p-3 text-sm"/></label>
      <div className="grid gap-3 sm:grid-cols-2"><label className={label}>Invitation owner role<input required value={inviteOwner} onChange={e=>setInviteOwner(e.target.value)} placeholder="e.g. Secretary, Partnerships Officer" className={field}/></label><label className={label}>Intended invitation channel<select value={inviteChannel} onChange={e=>setInviteChannel(e.target.value)} className={field}><option>Email</option><option>Official letter</option><option>Phone</option><option>Other</option></select></label></div>
      <div className="rounded-control border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950"><strong>Draft only.</strong> Nothing is sent, approved or shared automatically.</div>
      <button disabled={busy || !meetingId || !inviteOrg || invitePurpose.trim().length<5 || inviteSubject.trim().length<5 || inviteDraft.trim().length<20 || !inviteOwner.trim()} className="min-h-12 w-full rounded-control bg-forest-900 px-5 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Create invitation draft"}</button>
    </form>

    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-serif text-2xl text-forest-950">Invitation register</h2><p className="text-xs text-ink-600">{data.invitations.length} loaded · {data.invitationsHasMore ? "more records available" : "end of connected register"}</p></div><button onClick={()=>void refresh()} disabled={loading || busy} className="min-h-10 rounded-control border border-line bg-white px-4 text-sm font-semibold">{loading ? "Refreshing…" : "Refresh"}</button></div>
      {data.invitations.length ? data.invitations.map(x=><article key={x.id} className="rounded-card border border-line bg-white p-4"><div className="flex flex-wrap items-start justify-between gap-2"><h3 className="font-semibold text-forest-950">{x.title}</h3><span className="rounded-full border border-line bg-cream-50 px-2.5 py-1 text-xs">{x.status}</span></div><p className="mt-1 text-xs text-ink-600">{x.participation || "Role not recorded"} · {x.purpose}</p>{x.subject ? <p className="mt-2 text-sm font-semibold text-forest-950">{x.subject}</p> : null}{x.draft ? <p className="mt-1 whitespace-pre-wrap text-sm text-ink-700">{x.draft}</p> : null}<p className="mt-2 text-xs text-ink-600">Meeting: {data.meetings.find(m=>m.id===x.meeting)?.title || (x.meeting ? "Linked meeting not in loaded page" : "—")} · Organisation: {data.organisations.find(o=>o.id===x.organisation)?.title || (x.organisation ? "Linked organisation not in loaded page" : "—")}{x.sentOn ? ` · Sent ${x.sentOn}` : ""}</p>{x.url ? <a href={x.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-9 items-center text-sm font-semibold text-forest-800 underline">Open Notion invitation ↗</a> : null}</article>) : <p className="rounded-card border border-line bg-white p-4 text-sm text-ink-600">{loading ? "Loading invitations…" : !loaded ? "Register unavailable. Check the source connection above." : "No invitation records are currently returned."}</p>}
      {data.invitationsHasMore ? <button type="button" onClick={()=>void refresh(true)} disabled={loading || busy || !data.invitationsNextCursor} className="min-h-11 rounded-control border border-line bg-white px-4 text-sm font-semibold disabled:opacity-50">{loading ? "Loading…" : "Load more invitations"}</button> : null}
    </section>    </> : null}
  </div>;
}
