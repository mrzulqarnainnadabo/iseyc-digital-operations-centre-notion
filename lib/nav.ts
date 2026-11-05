export type NavItem = {
  label: string;
  href: string;
  group: string;
  external?: boolean;
};

export const DOC_NAV: NavItem[] = [
  { label: "Command Brief", href: "/ops", group: "Executive" },
  {
    label: "2027 Civic Mandate",
    href: "https://2027-street-mandate.vercel.app",
    group: "Civic systems",
    external: true,
  },
  {
    label: "Kaduna State Brief",
    href: "https://2027-street-mandate.vercel.app/brief?state=Kaduna",
    group: "Civic systems",
    external: true,
  },
  {
    label: "Mandate operators",
    href: "https://2027-street-mandate.vercel.app/operators",
    group: "Civic systems",
    external: true,
  },
  {
    label: "Civic Intelligence Observatory",
    href: "https://iseyc-civic-intelligence-observator.vercel.app",
    group: "Civic systems",
    external: true,
  },
  {
    label: "Civic Brain",
    href: "https://iseyc-civic-brain.vercel.app",
    group: "Civic systems",
    external: true,
  },
  { label: "Education & Capacity Building", href: "https://iseyc-civic-intelligence-observator.vercel.app/#/departments/education", group: "Departments", external: true },
  { label: "Health & Well-being", href: "https://iseyc-civic-intelligence-observator.vercel.app/#/departments/health", group: "Departments", external: true },
  { label: "Software & Technology", href: "https://iseyc-civic-intelligence-observator.vercel.app/#/departments/software-technology", group: "Departments", external: true },
  { label: "Civic Department", href: "https://iseyc-civic-intelligence-observator.vercel.app/#/departments/civic", group: "Departments", external: true },
  { label: "Digital Chamber", href: "/ops/chamber", group: "Operating records" },
  { label: "Meeting & Decisions", href: "/ops/queue", group: "Operating records" },
  { label: "New meeting intake", href: "/ops/intake", group: "Operating records" },
  { label: "Action register", href: "/ops/actions", group: "Operating records" },
  { label: "Media & Content Command", href: "/ops/media", group: "Communications" },
  { label: "Officer access", href: "/ops/access", group: "Governance" },
];

export const GROUPS = [
  "Executive",
  "Civic systems",
  "Operating records",
  "Communications",
  "Governance",
] as const;
