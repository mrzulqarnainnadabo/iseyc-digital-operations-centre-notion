import { redirect } from "next/navigation";
import { requireStaffSession } from "@/lib/auth";
import OperationalRegister from "@/components/OperationalRegister";
export const dynamic = "force-dynamic";
type PageProps = { searchParams: Promise<{ meetingId?: string | string[] }> };
export default async function Page({ searchParams }: PageProps) {
  if (!(await requireStaffSession())) redirect("/login");
  const params = await searchParams;
  const initialMeetingId = typeof params.meetingId === "string" ? params.meetingId : "";
  return <OperationalRegister kind="actions" initialMeetingId={initialMeetingId} />;
}
