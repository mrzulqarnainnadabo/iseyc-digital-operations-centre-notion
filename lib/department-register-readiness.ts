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
      "Programme / Work Item": "title",
      Department: "select",
      "Work Type": "select",
      Status: "status",
      "Intended Outcome": "rich_text",
      "Acceptance Criteria": "rich_text",
      "Accountable Role": "rich_text",
      Priority: "select",
      "Risk Level": "select",
      Contributors: "rich_text",
      "Start Date": "date",
      "Due Date": "date",
      "Evidence / Deliverable": "url",
    },
  },
  reports: {
    Reports: {
      "Report / Period": "title",
      Department: "select",
      "Reporting Cycle": "select",
      Status: "status",
      "Reporting Period Start": "date",
      "Reporting Period End": "date",
      "Completed Work": "rich_text",
      Outputs: "rich_text",
      "Planned Work": "rich_text",
      "Prepared By Role": "rich_text",
      "Risks & Blockers": "rich_text",
      "Decisions Required": "rich_text",
      "Outcomes / Evidence": "rich_text",
      "Evidence Links": "url",
      "Data Limitations": "rich_text",
    },
  },
} as const;

async function checkRegister(
  envName: "NOTION_DEPARTMENT_PROGRAMMES_DATABASE_ID" | "NOTION_DEPARTMENT_REPORTS_DATABASE_ID",
  required: Record<string, string>,
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
      .filter(([name, type]) => properties[name]?.type !== type)
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
