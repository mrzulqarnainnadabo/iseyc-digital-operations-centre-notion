export type NavItem = {
  label: string;
  href: string;
  group: string;
  external?: boolean;
};

export const DOC_NAV: NavItem[] = [
  { label: "Command home", href: "/ops", group: "Command" },
  { label: "Approval queue", href: "/ops/queue", group: "Command" },
  { label: "Meeting intake", href: "/ops/intake", group: "Command" },
  { label: "Department readiness", href: "/ops/readiness", group: "Departments" },
  { label: "Shared Communications · CoS", href: "/ops/media", group: "Shared function" },
  { label: "Chamber", href: "/ops/chamber", group: "Module slots" },
  { label: "Actions", href: "/ops/actions", group: "Module slots" },
  { label: "Day-1 seat briefing", href: "/ops/seat", group: "Governance" },
  { label: "Officer access", href: "/ops/access", group: "Governance" },
  { label: "Civic Mandate", href: "https://2027-street-mandate.vercel.app", group: "Published civic systems", external: true },
  { label: "Civic Brain", href: "https://iseyc-civic-brain.vercel.app", group: "Published civic systems", external: true },
];

export const GROUPS = [
  "Command",
  "Departments",
  "Shared function",
  "Module slots",
  "Governance",
  "Published civic systems",
] as const;
