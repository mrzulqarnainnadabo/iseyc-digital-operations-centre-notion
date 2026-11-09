import { redirect } from "next/navigation";
import { requireStaffSession } from "@/lib/auth";
import OperationalRegister from "@/components/OperationalRegister";
export const dynamic = "force-dynamic";
export default async function Page() { if (!(await requireStaffSession())) redirect("/login"); return <OperationalRegister kind="chamber" />; }
