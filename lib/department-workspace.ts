import { dbId, notion, assertInternalDb, listMeetings, type MeetingRecord } from "@/lib/notion";
import { filterLegacyVisibleMeetings } from "@/lib/legacy-session-boundary";

export const DEPARTMENT_LABELS = {
  education: "Education & Capacity Building",
  health: "Health & Well-being",
  "digital-systems": "Software & Technology",
  "civic-affairs": "Civic Department",
} as const;
export type DepartmentSlug = keyof typeof DEPARTMENT_LABELS;
const DEPARTMENT_TERMS:Record<DepartmentSlug,string[]>={education:["education","capacity","learning"],health:["health","well-being","wellbeing"],"digital-systems":["digital","technology","systems"],"civic-affairs":["civic","affairs","governance"]};
type WorkItem = { id:string; title:string; status:string; type:string; priority:string; owner:string; outcome:string; dueDate:string; startDate:string; risk:string; url:string; updated:string };
type Report = { id:string; title:string; status:string; cycle:string; periodStart:string; periodEnd:string; preparedBy:string; completed:string; planned:string; outcomes:string; risks:string; limitations:string; decisions:string; evidenceUrl:string; url:string; updated:string };
const PROGRAMMES_ENV = "NOTION_PROGRAMMES_DATABASE_ID";
const REPORTS_ENV = "NOTION_DEPARTMENT_REPORTS_DATABASE_ID";

function getClientAndDb(env:string) {
  const client = notion();
  const id = dbId(env);
  if (!client || !id) throw new Error("Department registers are not configured for this environment.");
  assertInternalDb(id, env as "NOTION_PROGRAMMES_DATABASE_ID" | "NOTION_DEPARTMENT_REPORTS_DATABASE_ID");
  return { client, id };
}
function value(prop:any):string {
  if (!prop) return "";
  if (prop.type === "title") return (prop.title || []).map((x:any)=>x.plain_text || "").join("");
  if (prop.type === "rich_text") return (prop.rich_text || []).map((x:any)=>x.plain_text || "").join("");
  if (prop.type === "select") return prop.select?.name || "";
  if (prop.type === "status") return prop.status?.name || "";
  if (prop.type === "date") return prop.date?.start || "";
  if (prop.type === "url") return prop.url || "";
  return "";
}
async function listForDepartment(env:string, department:string) {
  const {client,id}=getClientAndDb(env);
  const result=await client.databases.query({database_id:id,page_size:50,filter:{property:"Department",select:{equals:department}},sorts:[{timestamp:"last_edited_time",direction:"descending"}]});
  return result.results.filter((p:any)=>p.object==="page");
}
function mapWork(p:any):WorkItem {
  const x=p.properties||{};
  return {id:p.id,title:value(x["Programme / Work Item"])||"Untitled work",status:value(x.Status)||"Proposed",type:value(x["Work Type"]),priority:value(x.Priority),owner:value(x["Accountable Role"]),outcome:value(x["Intended Outcome"]),dueDate:value(x["Due Date"]),startDate:value(x["Start Date"]),risk:value(x["Risk Level"]),url:p.url||"",updated:value(x.Updated)};
}
function mapReport(p:any):Report {
  const x=p.properties||{};
  return {id:p.id,title:value(x["Report / Period"])||"Untitled report",status:value(x.Status)||"Draft",cycle:value(x["Reporting Cycle"]),periodStart:value(x["Reporting Period Start"]),periodEnd:value(x["Reporting Period End"]),preparedBy:value(x["Prepared By Role"]),completed:value(x["Completed Work"]),planned:value(x["Planned Work"]),outcomes:value(x["Outcomes / Evidence"]),risks:value(x["Risks & Blockers"]),limitations:value(x["Data Limitations"]),decisions:value(x["Decisions Required"]),evidenceUrl:value(x["Evidence Links"]),url:p.url||"",updated:value(x.Updated)};
}
export async function getDepartmentWorkspace(slug:DepartmentSlug) {
  const department=DEPARTMENT_LABELS[slug];
  const [workPages,reportPages,meetingPage]=await Promise.all([listForDepartment(PROGRAMMES_ENV,department),listForDepartment(REPORTS_ENV,department),listMeetings({pageSize:50})]);
  const work=workPages.map(mapWork), reports=reportPages.map(mapReport);
  const meetings=filterLegacyVisibleMeetings(meetingPage.meetings).filter((meeting:MeetingRecord)=>DEPARTMENT_TERMS[slug].some(term=>`${meeting.conveningBody} ${meeting.title}`.toLowerCase().includes(term))).sort((a,b)=>a.meetingDate.localeCompare(b.meetingDate));
  const today=new Date().toISOString().slice(0,10);
  const active=work.filter(x=>["Approved","In Progress","Under Review"].includes(x.status));
  const overdue=work.filter(x=>x.dueDate && x.dueDate<today && !["Completed","Cancelled"].includes(x.status));
  return {department,work,reports,meetings,summary:{totalWork:work.length,activeWork:active.length,overdueWork:overdue.length,draftReports:reports.filter(x=>x.status==="Draft").length,submittedReports:reports.filter(x=>["Submitted","Under Review"].includes(x.status)).length},source:"notion",scope:"first 50 records per register"};
}
function dateOk(s:string) { return /^\\d{4}-\\d{2}-\\d{2}$/.test(s) && !Number.isNaN(Date.parse(s+"T00:00:00.000Z")) && new Date(s+"T00:00:00.000Z").toISOString().slice(0,10)===s; }
export async function createDepartmentWork(slug:DepartmentSlug,input:{title:string;type:string;priority:string;owner:string;outcome:string;startDate:string;dueDate:string;acceptance:string;risk:string}) {
  const {client,id}=getClientAndDb(PROGRAMMES_ENV);
  const types=["Programme","Project","Training","Research","Operations","Community Engagement"];
  const priorities=["Critical","High","Medium","Low"], risks=["Low","Moderate","High","Critical"];
  if(input.title.trim().length<4||input.owner.trim().length<2||input.outcome.trim().length<8||!types.includes(input.type)||!priorities.includes(input.priority)||!risks.includes(input.risk)||!dateOk(input.startDate)||!dateOk(input.dueDate)||input.dueDate<input.startDate||input.acceptance.trim().length<5) throw new Error("INVALID_WORK_ITEM");
  const properties:any={
    "Programme / Work Item":{title:[{text:{content:input.title.trim().slice(0,180)}}]},
    Department:{select:{name:DEPARTMENT_LABELS[slug]}},
    Status:{status:{name:"Proposed"}},
    "Work Type":{select:{name:input.type}},
    Priority:{select:{name:input.priority}},
    "Accountable Role":{rich_text:[{text:{content:input.owner.trim().slice(0,120)}}]},
    "Intended Outcome":{rich_text:[{text:{content:input.outcome.trim().slice(0,1800)}}]},
    "Start Date":{date:{start:input.startDate}},
    "Due Date":{date:{start:input.dueDate}},
    "Acceptance Criteria":{rich_text:[{text:{content:input.acceptance.trim().slice(0,1200)}}]},
    "Risk Level":{select:{name:input.risk}},
  };
  const page=await client.pages.create({parent:{database_id:id},properties});
  return {id:page.id,url:(page as any).url||""};
}
export async function createDepartmentReport(slug:DepartmentSlug,input:{title:string;cycle:string;periodStart:string;periodEnd:string;preparedBy:string;completed:string;planned:string;outcomes:string;risks:string;limitations:string;decisions:string;evidenceUrl:string}) {
  const {client,id}=getClientAndDb(REPORTS_ENV);
  const cycles=["Weekly","Monthly","Quarterly","Annual"];
  if(input.title.trim().length<4||!cycles.includes(input.cycle)||!dateOk(input.periodStart)||!dateOk(input.periodEnd)||input.periodEnd<input.periodStart||input.preparedBy.trim().length<2||input.completed.trim().length<5||input.planned.trim().length<5||input.limitations.trim().length<5|| (input.evidenceUrl && !/^https:\\/\\//i.test(input.evidenceUrl))) throw new Error("INVALID_REPORT");
  const properties:any={
    "Report / Period":{title:[{text:{content:input.title.trim().slice(0,180)}}]},
    Department:{select:{name:DEPARTMENT_LABELS[slug]}},
    "Reporting Cycle":{select:{name:input.cycle}},
    "Reporting Period Start":{date:{start:input.periodStart}},
    "Reporting Period End":{date:{start:input.periodEnd}},
    "Prepared By Role":{rich_text:[{text:{content:input.preparedBy.trim().slice(0,120)}}]},
    "Completed Work":{rich_text:[{text:{content:input.completed.trim().slice(0,1800)}}]},
    "Planned Work":{rich_text:[{text:{content:input.planned.trim().slice(0,1800)}}]},
    "Data Limitations":{rich_text:[{text:{content:input.limitations.trim().slice(0,1200)}}]},
    Status:{status:{name:"Draft"}},
  };
  for (const [key,val] of [["Outcomes / Evidence",input.outcomes],["Risks & Blockers",input.risks],["Decisions Required",input.decisions]] as const) if(val.trim()) properties[key]={rich_text:[{text:{content:val.trim().slice(0,1500)}}]};
  if(input.evidenceUrl) properties["Evidence Links"]={url:input.evidenceUrl};
  const page=await client.pages.create({parent:{database_id:id},properties});
  return {id:page.id,url:(page as any).url||""};
}
