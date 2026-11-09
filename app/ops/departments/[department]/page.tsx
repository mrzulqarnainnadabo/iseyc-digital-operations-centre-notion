import { notFound } from "next/navigation";
import DepartmentWorkspace from "@/components/DepartmentWorkspace";
import type { DepartmentSlug } from "@/lib/department-workspace";

export const dynamic = "force-dynamic";

const departmentSlugs = ["education","health","digital-systems","civic-affairs"] as const;

export default async function DepartmentDeskPage({params}:{params:Promise<{department:string}>}) {
  const {department}=await params;
  if(!departmentSlugs.includes(department as DepartmentSlug)) notFound();
  return <DepartmentWorkspace slug={department as DepartmentSlug}/>;
}
