export type NavItem = {
  label: string;
  href: string;
  group: string;
  external?: boolean;
};

export const DOC_NAV: NavItem[] = [
  { label: "Home", href: "/ops", group: "Command" },
  { label: "Queue", href: "/ops/queue", group: "Command" },
  { label: "Intake", href: "/ops/intake", group: "Command" },
  { label: "Departments", href: "/ops/readiness", group: "Departments" },
  { label: "Communications", href: "/ops/media", group: "Shared function" },
  { label: "Chamber", href: "/ops/chamber", group: "Module slots" },
  { label: "Actions", href: "/ops/actions", group: "Module slots" },
  { label: "Seat packet", href: "/ops/seat", group: "Governance" },
  { label: "Access", href: "/ops/access", group: "Governance" },
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
