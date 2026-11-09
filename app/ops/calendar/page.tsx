import { redirect } from "next/navigation";
import { requireStaffSession } from "@/lib/auth";
import { configFlags, listMeetings } from "@/lib/notion";
import { filterLegacyVisibleMeetings } from "@/lib/legacy-session-boundary";
import CalendarBoard from "./CalendarBoard";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  if (!(await requireStaffSession())) redirect("/login");
  const flags = configFlags();
  if (!flags.token || !flags.meetings) {
    return <CalendarBoard meetings={[]} error="The internal Meetings register is not configured. Calendar entries are withheld until the approved Notion source is available." />;
  }
  try {
    const result = await listMeetings({ pageSize: 50 });
    return <CalendarBoard meetings={filterLegacyVisibleMeetings(result.meetings)} error={null} />;
  } catch {
    return <CalendarBoard meetings={[]} error="The Meetings register could not be reached. No calendar entries are shown." />;
  }
}
