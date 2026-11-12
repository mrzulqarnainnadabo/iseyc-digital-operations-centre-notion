import { redirect } from "next/navigation";
import { requireStaffSession } from "@/lib/auth";
import OperationalRegister from "@/components/OperationalRegister";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    meetingId?: string | string[];
    workPlanTitle?: string | string[];
    workPlanUrl?: string | string[];
  }>;
};

function trustedNotionUrl(value: string): string {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();
    const trustedHost = host === "notion.so" || host === "www.notion.so" || host.endsWith(".notion.site");
    return parsed.protocol === "https:" && trustedHost ? parsed.toString() : "";
  } catch {
    return "";
  }
}

export default async function Page({ searchParams }: PageProps) {
  if (!(await requireStaffSession())) redirect("/login");
  const params = await searchParams;
  const initialMeetingId = typeof params.meetingId === "string" ? params.meetingId : "";
  const workPlanTitle = typeof params.workPlanTitle === "string" ? params.workPlanTitle.slice(0, 180) : "";
  const workPlanUrl = typeof params.workPlanUrl === "string" ? trustedNotionUrl(params.workPlanUrl) : "";
  const initialNotes = workPlanTitle && workPlanUrl
    ? `Source work-plan: ${workPlanTitle}\n${workPlanUrl}`.slice(0, 1000)
    : "";

  return (
    <OperationalRegister
      kind="actions"
      initialMeetingId={initialMeetingId}
      initialNotes={initialNotes}
    />
  );
}
