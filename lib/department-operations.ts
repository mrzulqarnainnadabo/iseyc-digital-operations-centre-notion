/**
 * ISEYC departmental operating architecture.
 *
 * Defines mandates, functional areas, and record models for programmes,
 * work plans, activities, reports and interdepartmental coordination.
 * Does not invent programme instances, officers, statistics or outcomes.
 * Live persistence requires approved Notion databases and configuration.
 */

export type OpsDepartmentId =
  | "education"
  | "health"
  | "digital-systems"
  | "civic-affairs";

export type DepartmentFunction = {
  id: string;
  title: string;
  responsibility: string;
  activities: string[];
  outputs: string[];
  documentation: string;
  coordinatesWith: string[];
};

export type ProgrammeStatus =
  | "Planning"
  | "Draft"
  | "Active"
  | "On hold"
  | "Completed"
  | "Closed"
  | "Unspecified";

export type WorkPlanStatus =
  | "Planned"
  | "In progress"
  | "Blocked"
  | "Completed"
  | "Deferred"
  | "Unspecified";

export type ReportType =
  | "Activity"
  | "Programme"
  | "Monthly department"
  | "Coordination"
  | "Other";

/** Canonical programme fields for a future Notion-backed register. */
export type ProgrammeRecord = {
  id: string;
  title: string;
  description: string;
  objectives: string;
  departmentId: OpsDepartmentId;
  targetCommunity: string;
  geography: string;
  activities: string;
  deliverables: string;
  startDate: string;
  endDate: string;
  accountableRole: string;
  status: ProgrammeStatus;
  evidenceNote: string;
  url: string;
};

/** Canonical work-plan item fields. */
export type WorkPlanRecord = {
  id: string;
  title: string;
  objective: string;
  departmentId: OpsDepartmentId;
  programmeId: string;
  deliverable: string;
  dueDate: string;
  dependencies: string;
  accountableRole: string;
  status: WorkPlanStatus;
  progressNote: string;
  evidenceNote: string;
  url: string;
};

/** Canonical department report fields. */
export type DepartmentReportRecord = {
  id: string;
  title: string;
  reportType: ReportType;
  departmentId: OpsDepartmentId;
  period: string;
  summary: string;
  challenges: string;
  outstandingActions: string;
  recommendations: string;
  status: "Draft" | "Submitted for review" | "Archived" | "Unspecified";
  url: string;
};

export type CoordinationRequest = {
  id: string;
  title: string;
  fromDepartmentId: OpsDepartmentId;
  toDepartmentId: OpsDepartmentId;
  requestType: "Support" | "Joint programme" | "Referral" | "Handover" | "Shared reporting";
  summary: string;
  status: "Open" | "Accepted" | "Declined" | "Closed" | "Unspecified";
  url: string;
};

export type DepartmentOperatingProfile = {
  id: OpsDepartmentId;
  name: string;
  publicSlug: string;
  missionLink: string;
  mandate: string;
  boundaries: string[];
  strategicPriorities: string[];
  functions: DepartmentFunction[];
  meetingTerms: string[];
  sharedRegisters: { label: string; href: string; purpose: string }[];
};

export const DEPARTMENT_OPERATING_PROFILES: Record<
  OpsDepartmentId,
  DepartmentOperatingProfile
> = {
  education: {
    id: "education",
    name: "Education & Capacity Building",
    publicSlug: "education",
    missionLink:
      "Supports ISEYC’s commitment to learning access, capability development and conditions that make participation possible.",
    mandate:
      "Organise institutional work on education access and inclusion, learning opportunities, skills acquisition, educational infrastructure and responsible educational partnerships — without treating isolated reports as national measures.",
    boundaries: [
      "Does not claim population-wide education outcomes from single reports.",
      "Does not appoint officers or certify programme success from a shared-key session.",
      "Does not publish official statements; routes public material through Communications.",
    ],
    strategicPriorities: [
      "Access and participation in learning opportunities",
      "School infrastructure and usable learning environments",
      "Teacher and learning capacity support",
      "Literacy, skills and lifelong learning pathways",
    ],
    functions: [
      {
        id: "edu-access",
        title: "Access & inclusion",
        responsibility:
          "Identify barriers to learning access and coordinate institutional responses within approved programmes.",
        activities: [
          "Map access constraints from attributed sources",
          "Coordinate inclusion-focused programme planning",
          "Track follow-up actions with accountable roles",
        ],
        outputs: ["Access notes", "Programme plans", "Action records"],
        documentation: "Programme and work-plan registers; meeting notes; shared Actions register.",
        coordinatesWith: ["Civic Affairs", "Digital Systems", "Communications"],
      },
      {
        id: "edu-capacity",
        title: "Skills & capacity development",
        responsibility:
          "Structure skills and capacity programmes with clear objectives, deliverables and evidence expectations.",
        activities: [
          "Define programme objectives and deliverables",
          "Schedule coordination meetings",
          "Record progress without inventing completion rates",
        ],
        outputs: ["Programme drafts", "Work-plan items", "Activity reports"],
        documentation: "Programme register; work plans; monthly department reports when available.",
        coordinatesWith: ["Digital Systems", "Health"],
      },
      {
        id: "edu-infra",
        title: "Learning environments & infrastructure",
        responsibility:
          "Track facility and environment questions that affect learning, with source limitations visible.",
        activities: [
          "Document infrastructure-related programme needs",
          "Link evidence with geography and date context",
          "Escalate blockers through Actions",
        ],
        outputs: ["Evidence-linked notes", "Escalation actions"],
        documentation: "Programme evidence fields; Actions register; public evidence pages where appropriate.",
        coordinatesWith: ["Digital Systems", "Civic Affairs"],
      },
      {
        id: "edu-partnerships",
        title: "Educational partnerships",
        responsibility:
          "Engage verified organisations for education programmes only through approved external engagement workflows.",
        activities: [
          "Propose partnership needs for verified organisations",
          "Prepare invitation drafts after meeting approval",
          "Keep partnership claims out of draft records",
        ],
        outputs: ["Organisation prospects", "Invitation drafts"],
        documentation: "External engagement registers; Meetings register.",
        coordinatesWith: ["Civic Affairs", "Communications"],
      },
    ],
    meetingTerms: ["education", "capacity", "learning", "school", "teacher", "literacy"],
    sharedRegisters: [
      { label: "Actions", href: "/ops/actions", purpose: "Accountable follow-ups with role and due date" },
      { label: "Communications", href: "/ops/media", purpose: "Editorial drafts only" },
      { label: "Chamber", href: "/ops/chamber", purpose: "Institutional session scheduling" },
      { label: "External engagement", href: "/ops/partners", purpose: "Verified organisations and invitation drafts" },
    ],
  },
  health: {
    id: "health",
    name: "Health & Well-being",
    publicSlug: "health",
    missionLink:
      "Supports ISEYC’s focus on community health awareness, essential services access and responsible health engagement.",
    mandate:
      "Coordinate institutional work on community health awareness, access to essential services, primary healthcare needs, health education and prevention, and responsible healthcare partnerships — distinguishing plans, service reports and verified results.",
    boundaries: [
      "Does not infer prevalence or national health status from a single report.",
      "Does not certify clinical outcomes or publish health claims under shared-key sessions.",
      "Does not treat login identity as health programme authority.",
    ],
    strategicPriorities: [
      "Community health awareness and prevention education",
      "Access to essential and primary health services",
      "Facility and service-condition questions with source limits",
      "Responsible healthcare partnerships",
    ],
    functions: [
      {
        id: "hlt-awareness",
        title: "Health awareness & prevention",
        responsibility:
          "Plan and document community health education and prevention activities within approved programmes.",
        activities: [
          "Draft awareness programme objectives",
          "Coordinate messaging with Communications for review",
          "Record activities and evidence limitations",
        ],
        outputs: ["Programme drafts", "Activity notes", "Communications drafts"],
        documentation: "Programme and report registers; Communications work queue.",
        coordinatesWith: ["Education", "Communications"],
      },
      {
        id: "hlt-access",
        title: "Service access & primary care needs",
        responsibility:
          "Organise work on access to essential services and primary care questions without inventing coverage statistics.",
        activities: [
          "Document access-related programme scope",
          "Create follow-up actions with accountable roles",
          "Flag missing evidence rather than estimating it",
        ],
        outputs: ["Work-plan items", "Actions", "Evidence notes"],
        documentation: "Work plans; Actions register.",
        coordinatesWith: ["Civic Affairs", "Digital Systems"],
      },
      {
        id: "hlt-facilities",
        title: "Facility conditions",
        responsibility:
          "Track facility-related institutional questions with geography, date and source classification visible.",
        activities: [
          "Link facility questions to programmes where approved",
          "Escalate blockers through shared Actions",
        ],
        outputs: ["Programme notes", "Escalations"],
        documentation: "Programme evidence fields; Actions.",
        coordinatesWith: ["Civic Affairs"],
      },
      {
        id: "hlt-partnerships",
        title: "Healthcare partnerships",
        responsibility:
          "Use external engagement only for verified organisations and approved meetings; never claim partnership from a draft.",
        activities: [
          "Register organisation prospects",
          "Prepare invitation drafts after eligibility checks",
        ],
        outputs: ["Organisation and invitation drafts"],
        documentation: "External engagement registers.",
        coordinatesWith: ["Civic Affairs", "Communications"],
      },
    ],
    meetingTerms: ["health", "well-being", "wellbeing", "care", "facility", "clinic"],
    sharedRegisters: [
      { label: "Actions", href: "/ops/actions", purpose: "Service follow-up ownership" },
      { label: "Communications", href: "/ops/media", purpose: "Health messaging drafts for review" },
      { label: "Chamber", href: "/ops/chamber", purpose: "Institutional sessions" },
      { label: "External engagement", href: "/ops/partners", purpose: "Verified health partners only" },
    ],
  },
  "digital-systems": {
    id: "digital-systems",
    name: "Digital Systems & Technology",
    publicSlug: "technology",
    missionLink:
      "Supports digital inclusion, institutional systems capacity and responsible technology use in community development.",
    mandate:
      "Lead institutional coordination on digital inclusion and literacy, digital public infrastructure, technology-enabled development, responsible innovation, and the DOC’s own information systems capacity — keeping draft technical notes separate from authorised public statements.",
    boundaries: [
      "Does not present draft systems notes as certified architecture decisions.",
      "Does not grant production access or identity authority from shared-key login.",
      "Does not invent digital coverage or adoption statistics.",
    ],
    strategicPriorities: [
      "Digital inclusion and literacy",
      "Institutional digital infrastructure and operations",
      "Technology-enabled community programmes",
      "Responsible innovation and information governance",
    ],
    functions: [
      {
        id: "dig-inclusion",
        title: "Digital inclusion & literacy",
        responsibility:
          "Structure programmes that expand digital skills and access without fabricating participation rates.",
        activities: [
          "Define literacy programme objectives",
          "Coordinate with Education on capacity programmes",
          "Document deliverables and evidence needs",
        ],
        outputs: ["Programme drafts", "Work plans"],
        documentation: "Programme and work-plan registers.",
        coordinatesWith: ["Education", "Civic Affairs"],
      },
      {
        id: "dig-infra",
        title: "Institutional systems & infrastructure",
        responsibility:
          "Maintain clarity on DOC and related systems work, configuration status and integration dependencies.",
        activities: [
          "Record systems programme scope",
          "Track integration dependencies as visible blockers",
          "Use readiness and access modules for status, not invention",
        ],
        outputs: ["Configuration notes", "Work-plan items", "Readiness updates"],
        documentation: "Work plans; Module readiness; Access control page.",
        coordinatesWith: ["All departments"],
      },
      {
        id: "dig-innovation",
        title: "Responsible innovation",
        responsibility:
          "Assess technology proposals with privacy, security and accountability requirements visible.",
        activities: [
          "Document proposal limitations",
          "Route public claims through Communications",
          "Escalate formal decisions only when appointment authority exists",
        ],
        outputs: ["Assessment notes", "Communications drafts"],
        documentation: "Programme notes; Communications; Access model docs.",
        coordinatesWith: ["Civic Affairs", "Communications"],
      },
      {
        id: "dig-ops",
        title: "Digital operations capacity",
        responsibility:
          "Support operational tooling for departments without treating tool availability as programme delivery.",
        activities: [
          "Improve shared register reliability",
          "Document environment dependencies",
          "Keep fail-closed behaviour for missing configuration",
        ],
        outputs: ["Operational improvements", "Dependency notes"],
        documentation: "DOC operational workflows; readiness modules.",
        coordinatesWith: ["All departments"],
      },
    ],
    meetingTerms: ["digital", "technology", "systems", "software", "connectivity", "infrastructure"],
    sharedRegisters: [
      { label: "Actions", href: "/ops/actions", purpose: "Technical follow-ups" },
      { label: "Communications", href: "/ops/media", purpose: "Public-facing technical drafts" },
      { label: "Chamber", href: "/ops/chamber", purpose: "Governance sessions" },
      { label: "External engagement", href: "/ops/partners", purpose: "Technology partners when verified" },
    ],
  },
  "civic-affairs": {
    id: "civic-affairs",
    name: "Civic Affairs & Public Accountability",
    publicSlug: "civic",
    missionLink:
      "Supports non-partisan civic learning, community representation pathways and transparent institutional engagement.",
    mandate:
      "Coordinate institutional work on civic participation, community concerns, public accountability, civic education and stakeholder engagement — without endorsing parties, candidates or campaigns, and without treating shared-key login as decision authority.",
    boundaries: [
      "Does not endorse political parties, candidates or campaigns.",
      "Does not certify public decisions or official positions under shared-key sessions.",
      "Does not invent community consensus or representation claims.",
    ],
    strategicPriorities: [
      "Civic education and responsibilities",
      "Institutional mandates and transparent engagement",
      "Community needs linked to public-service questions",
      "Accountability and evidence-based participation",
    ],
    functions: [
      {
        id: "civ-education",
        title: "Civic education",
        responsibility:
          "Support clear, non-partisan civic learning materials and programmes with attributed sources.",
        activities: [
          "Plan civic education programme scope",
          "Coordinate drafts with Communications",
          "Document limitations of source material",
        ],
        outputs: ["Programme drafts", "Communications drafts"],
        documentation: "Programme register; Communications queue.",
        coordinatesWith: ["Education", "Communications"],
      },
      {
        id: "civ-engagement",
        title: "Community engagement & representation pathways",
        responsibility:
          "Organise engagement activities that surface community concerns without claiming representative mandate from software.",
        activities: [
          "Record engagement programme objectives",
          "Link meetings to the institutional Meetings register",
          "Create follow-up actions after coordination",
        ],
        outputs: ["Meeting records", "Actions", "Activity reports"],
        documentation: "Meetings; Actions; report drafts.",
        coordinatesWith: ["All departments"],
      },
      {
        id: "civ-accountability",
        title: "Accountability & transparency",
        responsibility:
          "Keep institutional responsiveness and evidence standards visible in departmental reporting.",
        activities: [
          "Structure monthly department report drafts",
          "Track outstanding actions openly",
          "Refuse fabricated performance indicators",
        ],
        outputs: ["Report drafts", "Outstanding action lists"],
        documentation: "Department report register when connected; Actions.",
        coordinatesWith: ["Digital Systems"],
      },
      {
        id: "civ-stakeholders",
        title: "Institutional & stakeholder engagement",
        responsibility:
          "Manage formal external engagement only through verified organisations, approved meetings and draft invitations.",
        activities: [
          "Prepare external participation drafts",
          "Maintain relationship status honesty",
        ],
        outputs: ["Invitation drafts", "Organisation records"],
        documentation: "External engagement registers.",
        coordinatesWith: ["All departments", "Communications"],
      },
    ],
    meetingTerms: ["civic", "affairs", "governance", "mandate", "participation", "responsibility"],
    sharedRegisters: [
      { label: "Actions", href: "/ops/actions", purpose: "Engagement follow-ups" },
      { label: "Communications", href: "/ops/media", purpose: "Civic messaging drafts" },
      { label: "Chamber", href: "/ops/chamber", purpose: "Institutional sessions" },
      { label: "External engagement", href: "/ops/partners", purpose: "Stakeholder invitations" },
    ],
  },
};

export function isOpsDepartmentId(value: string): value is OpsDepartmentId {
  return (
    value === "education" ||
    value === "health" ||
    value === "digital-systems" ||
    value === "civic-affairs"
  );
}

export function getDepartmentOperatingProfile(
  id: string
): DepartmentOperatingProfile | undefined {
  if (!isOpsDepartmentId(id)) return undefined;
  return DEPARTMENT_OPERATING_PROFILES[id];
}

export const PROGRAMME_REGISTER_ENV = "NOTION_DEPARTMENT_PROGRAMMES_DATABASE_ID";
export const WORKPLAN_REGISTER_ENV = "NOTION_DEPARTMENT_WORKPLANS_DATABASE_ID";
export const REPORT_REGISTER_ENV = "NOTION_DEPARTMENT_REPORTS_DATABASE_ID";

export function departmentProgrammeRegisterConfigured(): boolean {
  return Boolean(
    process.env.NOTION_TOKEN?.trim() && process.env[PROGRAMME_REGISTER_ENV]?.trim()
  );
}

export function departmentWorkPlanRegisterConfigured(): boolean {
  return Boolean(
    process.env.NOTION_TOKEN?.trim() && process.env[WORKPLAN_REGISTER_ENV]?.trim()
  );
}

export function departmentReportRegisterConfigured(): boolean {
  return Boolean(
    process.env.NOTION_TOKEN?.trim() && process.env[REPORT_REGISTER_ENV]?.trim()
  );
}
