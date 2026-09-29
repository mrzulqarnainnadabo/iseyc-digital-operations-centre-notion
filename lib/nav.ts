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
    label: "Civic Brain",
    href: "https://iseyc-civic-brain.vercel.app",
    group: "Civic systems",
    external: true,
  },
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
