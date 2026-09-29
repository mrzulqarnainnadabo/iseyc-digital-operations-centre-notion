import { redirect } from "next/navigation";
import { requireStaffSession } from "@/lib/auth";
import { DocShell } from "@/components/DocShell";

export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  const ok = await requireStaffSession();
  if (!ok) redirect("/login");
  return <DocShell>{children}</DocShell>;
}
