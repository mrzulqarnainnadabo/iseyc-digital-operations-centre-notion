export type NavItem = {
  label: string;
  href: string;
  group: string;
  external?: boolean;
};

export const DOC_NAV: NavItem[] = [
  { label: "Command home", href: "/ops", group: "Command" },
  { label: "Executive desk", href: "/ops/executive", group: "Command" },
  { label: "Review queue", href: "/ops/queue", group: "Command" },
  { label: "Departments", href: "/ops#departments", group: "Departments" },
  { label: "Meetings calendar", href: "/ops/calendar", group: "Meetings & governance" },
  { label: "New meeting brief", href: "/ops/intake", group: "Meetings & governance" },
  { label: "Council sessions", href: "/ops/chamber", group: "Meetings & governance" },
  { label: "Action register", href: "/ops/actions", group: "Delivery & coordination" },
  { label: "Communications", href: "/ops/media", group: "Delivery & coordination" },
  { label: "External engagement", href: "/ops/partners", group: "Delivery & coordination" },
  { label: "Seat packet", href: "/ops/seat", group: "Governance" },
  { label: "Officer access", href: "/ops/access", group: "Governance" },
  { label: "System readiness", href: "/ops/readiness", group: "Governance" },
  { label: "Civic Mandate", href: "https://2027-street-mandate.vercel.app", group: "National civic intelligence", external: true },
  { label: "Civic Brain", href: "https://iseyc-civic-brain.vercel.app", group: "National civic intelligence", external: true },
  { label: "Civic Observatory", href: "https://iseyc-civic-intelligence-observatory.vercel.app", group: "National civic intelligence", external: true },
];

export const MOBILE_NAV: NavItem[] = [
  { label: "Home", href: "/ops", group: "Mobile" },
  { label: "Executive", href: "/ops/executive", group: "Mobile" },
  { label: "Departments", href: "/ops#departments", group: "Mobile" },
  { label: "Meetings", href: "/ops/calendar", group: "Mobile" },
  { label: "Actions", href: "/ops/actions", group: "Mobile" },
];

export const GROUPS = [
  "Command",
  "Departments",
  "Meetings & governance",
  "Delivery & coordination",
  "Governance",
  "National civic intelligence",
] as const;
