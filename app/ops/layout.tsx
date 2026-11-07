import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireStaffSession } from "@/lib/auth";
import { DocShell } from "@/components/DocShell";

export const metadata: Metadata = {
  title: "Restricted operations | ISEYC IDCC",
  robots: { index: false, follow: false },
};

export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  const ok = await requireStaffSession();
  if (!ok) redirect("/login");
  return <DocShell>{children}</DocShell>;
}
