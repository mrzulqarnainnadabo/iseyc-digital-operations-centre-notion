import { NextRequest } from "next/server";
import { privateJson } from "@/lib/private-response";
import { requireStaffSession } from "@/lib/auth";
import { isSameOriginRequest, readBoundedJson } from "@/lib/request-security";
import { dbId } from "@/lib/notion";
import { createDepartmentReport, createDepartmentWork, DEPARTMENT_LABELS, getDepartmentWorkspace, type DepartmentSlug } from "@/lib/department-workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ department: string }> };
function validDepartment(value:string): value is DepartmentSlug { return Object.prototype.hasOwnProperty.call(DEPARTMENT_LABELS,value); }
function str(value:unknown,max=1800):string { return typeof value==="string" ? value.trim().slice(0,max) : ""; }

export async function GET(_request:NextRequest,context:Context) {
  if(!(await requireStaffSession())) return privateJson({ok:false,error:"Unauthorized"},{status:401});
  const {department}=await context.params;
  if(!validDepartment(department)) return privateJson({ok:false,error:"Unknown department."},{status:404});
  if(!process.env.NOTION_TOKEN?.trim()||!dbId("NOTION_PROGRAMMES_DATABASE_ID")||!dbId("NOTION_DEPARTMENT_REPORTS_DATABASE_ID")) return privateJson({ok:false,error:"Department registers are not configured. No records are shown."},{status:503});
  try { return privateJson({ok:true,workspace:await getDepartmentWorkspace(department)}); }
  catch { return privateJson({ok:false,error:"Department registers could not be reached. No cached or estimated records are shown."},{status:502}); }
}
export async function POST(request:NextRequest,context:Context) {
  if(!isSameOriginRequest(request)) return privateJson({ok:false,error:"Forbidden"},{status:403});
  if(!(await requireStaffSession())) return privateJson({ok:false,error:"Unauthorized"},{status:401});
  const {department}=await context.params;
  if(!validDepartment(department)) return privateJson({ok:false,error:"Unknown department."},{status:404});
  if(!process.env.NOTION_TOKEN?.trim()) return privateJson({ok:false,error:"Department registers are not configured."},{status:503});
  const parsed=await readBoundedJson(request,12_288);
  if(!parsed.ok) return privateJson({ok:false,error:"Invalid department request."},{status:parsed.reason==="too_large"?413:parsed.reason==="content_type"?415:400});
  if(!parsed.value||typeof parsed.value!=="object"||Array.isArray(parsed.value)) return privateJson({ok:false,error:"Invalid request body."},{status:400});
  const body=parsed.value as Record<string,unknown>;
  const action=str(body.action,40);
  try {
    if(action==="create-work") {
      const allowed=["action","title","type","priority","owner","outcome","startDate","dueDate","acceptance","risk"];
      if(Object.keys(body).some(k=>!allowed.includes(k))) return privateJson({ok:false,error:"Unexpected programme fields."},{status:400});
      if(!dbId("NOTION_PROGRAMMES_DATABASE_ID")) return privateJson({ok:false,error:"Programme register is not configured."},{status:503});
      const created=await createDepartmentWork(department,{title:str(body.title,180),type:str(body.type,80),priority:str(body.priority,20),owner:str(body.owner,120),outcome:str(body.outcome,1800),startDate:str(body.startDate,10),dueDate:str(body.dueDate,10),acceptance:str(body.acceptance,1200),risk:str(body.risk,20)});
      return privateJson({ok:true,created,status:"Proposed — awaiting authorised review"},{status:201});
    }
    if(action==="create-report") {
      const allowed=["action","title","cycle","periodStart","periodEnd","preparedBy","completed","planned","outcomes","risks","limitations","decisions","evidenceUrl"];
      if(Object.keys(body).some(k=>!allowed.includes(k))) return privateJson({ok:false,error:"Unexpected report fields."},{status:400});
      if(!dbId("NOTION_DEPARTMENT_REPORTS_DATABASE_ID")) return privateJson({ok:false,error:"Department reports register is not configured."},{status:503});
      const created=await createDepartmentReport(department,{title:str(body.title,180),cycle:str(body.cycle,20),periodStart:str(body.periodStart,10),periodEnd:str(body.periodEnd,10),preparedBy:str(body.preparedBy,120),completed:str(body.completed),planned:str(body.planned),outcomes:str(body.outcomes),risks:str(body.risks),limitations:str(body.limitations,1200),decisions:str(body.decisions),evidenceUrl:str(body.evidenceUrl,500)});
      return privateJson({ok:true,created,status:"Draft — not submitted or approved"},{status:201});
    }
    return privateJson({ok:false,error:"Unknown department action."},{status:400});
  } catch(error) {
    const message=error instanceof Error?error.message:"";
    if(message==="INVALID_WORK_ITEM") return privateJson({ok:false,error:"Complete the title, accountable role, intended outcome, acceptance criteria, work type, priority, risk and valid start/due dates."},{status:400});
    if(message==="INVALID_REPORT") return privateJson({ok:false,error:"Complete the report title, cycle, reporting dates, prepared-by role, completed work, planned work and data limitations. Check the evidence link."},{status:400});
    return privateJson({ok:false,error:"The department record could not be saved. Check the Notion integration's database access and schema."},{status:502});
  }
}
