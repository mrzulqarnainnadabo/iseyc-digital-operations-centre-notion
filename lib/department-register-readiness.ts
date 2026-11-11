import { assertInternalDb, dbId, notion } from "@/lib/notion";

type RegisterCheck = {
  configured: boolean;
  accessible: boolean;
  schemaReady: boolean;
  missingProperties: string[];
};

export type DepartmentRegisterReadiness = {
  programmes: RegisterCheck;
  reports: RegisterCheck;
  checkedAt: string;
};

const REQUIRED_PROPERTIES = {
  programmes: {
    Programme: {
      "Programme / Work Item": { type: "title" },
      Department: { type: "select", options: ["Education & Capacity Building", "Health & Well-being", "Digital Systems & Technology", "Civic Affairs & Public Accountability", "Cross-departmental"] },
      "Work Type": { type: "select", options: ["Programme", "Project", "Training", "Research", "Operations", "Community Engagement"] },
      Status: { type: "status" },
      "Intended Outcome": { type: "rich_text" },
      "Acceptance Criteria": { type: "rich_text" },
      "Accountable Role": { type: "rich_text" },
      Priority: { type: "select", options: ["Critical", "High", "Medium", "Low"] },
      "Risk Level": { type: "select", options: ["Low", "Moderate", "High", "Critical"] },
      Contributors: { type: "rich_text" },
      "Start Date": { type: "date" },
      "Due Date": { type: "date" },
      "Evidence / Deliverable": { type: "url" },
    },
  },
  reports: {
    Reports: {
      "Report / Period": { type: "title" },
      Department: { type: "select", options: ["Education & Capacity Building", "Health & Well-being", "Digital Systems & Technology", "Civic Affairs & Public Accountability", "Cross-departmental"] },
      "Reporting Cycle": { type: "select", options: ["Weekly", "Monthly", "Quarterly", "Annual"] },
      Status: { type: "status" },
      "Reporting Period Start": { type: "date" },
      "Reporting Period End": { type: "date" },
      "Completed Work": { type: "rich_text" },
      Outputs: { type: "rich_text" },
      "Planned Work": { type: "rich_text" },
      "Prepared By Role": { type: "rich_text" },
      "Risks & Blockers": { type: "rich_text" },
      "Decisions Required": { type: "rich_text" },
      "Outcomes / Evidence": { type: "rich_text" },
      "Evidence Links": { type: "url" },
      "Data Limitations": { type: "rich_text" },
    },
  },
} as const;

async function checkRegister(
  envName: "NOTION_DEPARTMENT_PROGRAMMES_DATABASE_ID" | "NOTION_DEPARTMENT_REPORTS_DATABASE_ID",
  required: Record<string, { type: string; options?: readonly string[] }>,
): Promise<RegisterCheck> {
  const databaseId = dbId(envName);
  if (!databaseId) {
    return {
      configured: false,
      accessible: false,
      schemaReady: false,
      missingProperties: [],
    };
  }

  try {
    const client = notion();
    if (!client) {
      return {
        configured: false,
        accessible: false,
        schemaReady: false,
        missingProperties: [],
      };
    }
    assertInternalDb(databaseId, envName);
    const database: any = await client.databases.retrieve({ database_id: databaseId });
    const properties = database?.properties;
    if (!properties || typeof properties !== "object" || Array.isArray(properties)) {
      return {
        configured: true,
        accessible: true,
        schemaReady: false,
        missingProperties: Object.keys(required),
      };
    }

    const missingProperties = Object.entries(required)
      .filter(([name, specification]) => {
        const property = properties[name];
        if (property?.type !== specification.type) return true;
        if (!specification.options) return false;
        const available = property?.select?.options ?? [];
        const names = Array.isArray(available) ? available.map((option: any) => option.name) : [];
        return specification.options.some((option) => !names.includes(option));
      })
      .map(([name]) => name);

    return {
      configured: true,
      accessible: true,
      schemaReady: missingProperties.length === 0,
      missingProperties,
    };
  } catch {
    return {
      configured: true,
      accessible: false,
      schemaReady: false,
      missingProperties: [],
    };
  }
}

/**
 * Schema-only check for the two existing department registers.
 * It deliberately does not query rows or expose programme/report contents.
 */
export async function verifyDepartmentRegisterReadiness(): Promise<DepartmentRegisterReadiness> {
  const [programmes, reports] = await Promise.all([
    checkRegister(
      "NOTION_DEPARTMENT_PROGRAMMES_DATABASE_ID",
      REQUIRED_PROPERTIES.programmes.Programme,
    ),
    checkRegister(
      "NOTION_DEPARTMENT_REPORTS_DATABASE_ID",
      REQUIRED_PROPERTIES.reports.Reports,
    ),
  ]);

  return {
    programmes,
    reports,
    checkedAt: new Date().toISOString(),
  };
}
