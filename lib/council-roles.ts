export type CouncilRole = {
  id: string;
  title: string;
  group: "Presidential leadership" | "Executive coordination" | "Department leadership" | "Institution-wide leadership" | "Independent governance" | "Advisory";
  purpose: string;
  reportsTo: string;
  responsibilities: string[];
  weeklyPractice: string[];
  development: string[];
  authorityBoundary: string;
};

export const COUNCIL_ROLES: CouncilRole[] = [
  {
    id: "national-president",
    title: "National President & Chair of the Presidential Council",
    group: "Presidential leadership",
    purpose: "Provide institutional direction, chair the Presidential Council and protect ISEYC's mission, integrity and non-partisan character.",
    reportsTo: "The applicable ISEYC constitutional and governing framework.",
    responsibilities: ["Set strategic priorities and convene the council.", "Chair council deliberations and ensure decisions are recorded.", "Appoint or nominate officers only through the approved appointment process.", "Review institutional performance, risks and major proposals."],
    weeklyPractice: ["Read the executive brief before council meetings.", "Resolve or assign escalated institutional questions.", "Review decisions, risks and overdue actions."],
    development: ["Strategic leadership and institutional governance.", "Ethical decision-making, delegation and accountability.", "Public communication and evidence-informed leadership."],
    authorityBoundary: "The system records the President's role but does not create legal powers beyond ISEYC's governing documents. Sensitive decisions require verified identity, recorded authority and an audit trail."
  },
  {
    id: "chief-of-staff",
    title: "Chief of Staff",
    group: "Executive coordination",
    purpose: "Make the President's office and council work as one coordinated system.",
    reportsTo: "National President.",
    responsibilities: ["Coordinate the President's priorities and executive calendar.", "Prepare council agendas and decision briefs with the Secretary-General.", "Track cross-department commitments and escalate blockers.", "Ensure owners and deadlines are clear."],
    weeklyPractice: ["Prepare a short priority brief.", "Check overdue actions with accountable role owners.", "Prepare the next council agenda and follow-up list."],
    development: ["Executive coordination and project management.", "Brief writing, negotiation and risk escalation.", "Confidentiality and conflict-of-interest awareness."],
    authorityBoundary: "Coordination does not equal approval. The Chief of Staff cannot independently appoint officers, authorise spending, certify minutes or override department authority."
  },
  {
    id: "secretary-general",
    title: "Secretary-General",
    group: "Executive coordination",
    purpose: "Maintain the institutional memory, records, correspondence and procedural discipline of ISEYC.",
    reportsTo: "National President; supports the Presidential Council.",
    responsibilities: ["Maintain council records, approved minutes and resolutions.", "Prepare formal notices and correspondence for authorised sign-off.", "Maintain governance documents and the decision register.", "Track membership and appointment records without making unauthorised decisions."],
    weeklyPractice: ["Check records for completeness and source references.", "Prepare draft minutes and action extracts.", "Maintain a register of pending formal correspondence."],
    development: ["Governance administration and records management.", "Professional writing and meeting procedure.", "Data protection and document control."],
    authorityBoundary: "Drafting or storing a record does not make it approved. Official notices, certified minutes and membership decisions require the correct authorised decision-maker."
  },
  {
    id: "chief-operations-officer",
    title: "Chief Operations Officer",
    group: "Executive coordination",
    purpose: "Translate approved institutional priorities into coordinated work, clear owners and measurable deliverables.",
    reportsTo: "National President; coordinates with the Chief of Staff.",
    responsibilities: ["Maintain the operating rhythm across departments.", "Help department heads turn approved priorities into work plans.", "Monitor dependencies, blockers and delivery evidence.", "Recommend process improvements and capacity support."],
    weeklyPractice: ["Review each department's active work plan.", "Identify tasks needing cross-department support.", "Prepare an exception-only delivery report."],
    development: ["Operations management and process design.", "Programme delivery and performance interpretation.", "Facilitation, coaching and continuous improvement."],
    authorityBoundary: "The COO coordinates delivery but cannot change policy, commit funds or mark work complete without the relevant evidence and authorised review."
  },
  {
    id: "chief-financial-officer",
    title: "Chief Financial Officer",
    group: "Executive coordination",
    purpose: "Protect the financial integrity of ISEYC through disciplined planning, records and transparent reporting.",
    reportsTo: "National President and the applicable finance oversight structure.",
    responsibilities: ["Prepare budgets and financial forecasts for review.", "Maintain income, expenditure and supporting-document records.", "Monitor budget availability and financial risks.", "Prepare periodic financial summaries for authorised review."],
    weeklyPractice: ["Reconcile new transactions against supporting documents.", "Flag commitments without approved budget cover.", "Prepare a concise cash and obligations position."],
    development: ["Non-profit financial management and budgeting.", "Internal controls, procurement and fraud prevention.", "Financial reporting and stewardship."],
    authorityBoundary: "A finance role does not permit unilateral payment or withdrawal. Disbursements require documented approval, separation of duties and verifiable supporting evidence."
  },
  {
    id: "education-head",
    title: "Head of Education & Capacity Building",
    group: "Department leadership",
    purpose: "Lead learning, skills, youth capacity and education-focused programmes using credible evidence and practical learning pathways.",
    reportsTo: "Chief Operations Officer for delivery coordination; National President for institutional direction.",
    responsibilities: ["Review available education evidence and identify gaps.", "Prepare programme concepts, learning plans and partner requirements.", "Coordinate trainers, learning resources and evaluation methods.", "Submit programme plans and reports for approval."],
    weeklyPractice: ["Review new evidence and programme opportunities.", "Advance one defined learning deliverable.", "Record what is known, missing and awaiting approval."],
    development: ["Programme design and adult learning.", "Monitoring, evaluation and evidence literacy.", "Partnership development and facilitation."],
    authorityBoundary: "May prepare and coordinate approved work; may not independently make public claims, commit funds or launch programmes without the required approval."
  },
  {
    id: "health-head",
    title: "Head of Health & Well-being",
    group: "Department leadership",
    purpose: "Coordinate health literacy, prevention and community well-being initiatives with careful source and safeguarding standards.",
    reportsTo: "Chief Operations Officer for delivery coordination; National President for institutional direction.",
    responsibilities: ["Review public health evidence and clearly state its limits.", "Prepare health education and prevention programme proposals.", "Coordinate qualified contributors and responsible partners.", "Escalate clinical, safeguarding or high-risk matters to qualified authorities."],
    weeklyPractice: ["Check source dates and health information quality.", "Review programme drafts for safe, understandable language.", "Track approval needs and delivery dependencies."],
    development: ["Public health literacy and risk communication.", "Safeguarding, referral boundaries and ethical engagement.", "Programme monitoring and partnership coordination."],
    authorityBoundary: "ISEYC is not a clinical provider. The role must not diagnose, prescribe, promise treatment or publish health claims without appropriate qualified review."
  },
  {
    id: "digital-systems-head",
    title: "Head of Digital Systems & Technology",
    group: "Department leadership",
    purpose: "Lead digital inclusion, software capability, responsible technology and the reliability of ISEYC's digital systems.",
    reportsTo: "Chief Operations Officer for delivery coordination; National President for institutional direction.",
    responsibilities: ["Review digital inclusion and technology evidence.", "Develop software, digital literacy and systems-capacity proposals.", "Maintain technical quality, privacy and security standards.", "Coordinate technical delivery and document system dependencies."],
    weeklyPractice: ["Review system issues and technical risks.", "Advance a defined digital capacity or product deliverable.", "Record release readiness and unresolved dependencies."],
    development: ["Software and systems architecture.", "Cybersecurity, privacy and responsible AI.", "Digital inclusion and technical project leadership."],
    authorityBoundary: "Technical access is not production approval. No person may deploy, expose personal data or change security controls without explicit permission and review."
  },
  {
    id: "civic-affairs-head",
    title: "Head of Civic Affairs & Public Accountability",
    group: "Department leadership",
    purpose: "Coordinate non-partisan civic education, public responsibility research, community concerns and evidence-led accountability.",
    reportsTo: "Chief Operations Officer for delivery coordination; National President for institutional direction.",
    responsibilities: ["Explain institutional mandates and civic responsibilities.", "Organise documented community engagement and evidence questions.", "Coordinate civic research with clear source limitations.", "Keep public communication non-partisan and accountable."],
    weeklyPractice: ["Review community records and source quality.", "Prepare one practical civic learning or evidence brief.", "Escalate unanswered institutional questions for review."],
    development: ["Public policy and institutional analysis.", "Community research and ethical engagement.", "Evidence interpretation and non-partisan communication."],
    authorityBoundary: "Community reports are not population estimates. The department cannot endorse parties or candidates, claim government action, or publish unreviewed allegations."
  },
  {
    id: "youth-lead",
    title: "Youth Leadership Coordinator",
    group: "Institution-wide leadership",
    purpose: "Build a capable, responsible youth network and connect youth participation to practical learning and community contribution.",
    reportsTo: "Chief Operations Officer for coordination; National President for institutional direction.",
    responsibilities: ["Coordinate youth leader development and participation pathways.", "Support local youth teams with clear expectations and guidance.", "Identify training and mentorship needs.", "Promote safeguarding, inclusion and non-partisan conduct."],
    weeklyPractice: ["Share a concise learning resource with youth leaders.", "Check participation barriers and support requests.", "Escalate safeguarding concerns through the approved route."],
    development: ["Youth development and mentoring.", "Facilitation, safeguarding and community organising.", "Leadership coaching and conflict resolution."],
    authorityBoundary: "A youth coordination role does not appoint local representatives, certify community representation or authorise political mobilisation."
  },
  {
    id: "public-engagement-director",
    title: "Director of Public Engagement & Awareness",
    group: "Institution-wide leadership",
    purpose: "Make ISEYC's work understandable and accessible through accurate, consistent and non-partisan public communication.",
    reportsTo: "National President; coordinates with the Secretary-General and department heads.",
    responsibilities: ["Prepare awareness and public education plans.", "Coordinate accessible content with subject-matter departments.", "Maintain consistent ISEYC language, branding and approved signatures.", "Track audience questions and communication needs without inventing reach figures."],
    weeklyPractice: ["Prepare a short content calendar.", "Route factual claims to the responsible department for review.", "Check published material for brand and source accuracy."],
    development: ["Strategic communication and public education.", "Media literacy, storytelling and accessibility.", "Brand governance and crisis communication."],
    authorityBoundary: "Content preparation is not publication authority. No political endorsements, unapproved institutional statements or unsupported impact claims."
  },
  {
    id: "member-welfare-director",
    title: "Director of Member Welfare & Social Development",
    group: "Institution-wide leadership",
    purpose: "Strengthen belonging, member welfare, inclusion and constructive social connection across ISEYC.",
    reportsTo: "National President; coordinates with the Youth Leadership Coordinator and Secretary-General.",
    responsibilities: ["Coordinate member welfare and inclusion initiatives.", "Support onboarding, recognition and internal community-building.", "Identify welfare concerns and refer sensitive matters safely.", "Plan social activities within approved budgets and safeguarding rules."],
    weeklyPractice: ["Check member support requests through approved channels.", "Prepare a simple recognition or community-building activity.", "Escalate welfare and safeguarding issues confidentially."],
    development: ["People care, inclusion and safeguarding.", "Event planning and volunteer coordination.", "Confidentiality and referral practice."],
    authorityBoundary: "Must not expose private welfare information, promise financial assistance or commit institutional funds without approval."
  },
  {
    id: "disciplinary-chair",
    title: "Chair, Disciplinary Committee",
    group: "Independent governance",
    purpose: "Protect fairness, due process and institutional standards when a matter is formally referred to the committee.",
    reportsTo: "The appointing authority and the applicable ISEYC disciplinary framework; operates independently on referred cases.",
    responsibilities: ["Ensure allegations are documented and communicated fairly.", "Manage impartial review and conflict-of-interest declarations.", "Give affected persons a reasonable opportunity to respond.", "Submit reasoned recommendations through the approved process."],
    weeklyPractice: ["Review only formally referred matters.", "Check procedural fairness and conflict declarations.", "Keep restricted case records secure and access-limited."],
    development: ["Natural justice and fair hearing principles.", "Conflict resolution and impartial case management.", "Confidential records and safeguarding."],
    authorityBoundary: "The chair does not investigate, judge and enforce alone. No sanction is valid through this role guide; decisions must follow the approved constitution and authorised committee process."
  },
  {
    id: "special-adviser",
    title: "Special Adviser to the National President",
    group: "Advisory",
    purpose: "Provide specialist, evidence-informed advice on a defined subject or assignment.",
    reportsTo: "National President.",
    responsibilities: ["Provide written advice within the agreed brief.", "Identify evidence, options, risks and trade-offs.", "Declare conflicts of interest and protect confidential information.", "Support a time-bounded assignment when requested."],
    weeklyPractice: ["Maintain a short advisory note or deliverable.", "Update the President on material risks or evidence changes.", "Close or renew assignments through explicit review."],
    development: ["Specialist knowledge and analytical writing.", "Ethics, discretion and advisory judgement.", "Clear recommendations with transparent uncertainty."],
    authorityBoundary: "Advisers advise; they do not command departments, direct staff or approve expenditure unless a separate written appointment explicitly grants a scoped permission."
  }
];

export const ROLE_GROUPS = [
  "Presidential leadership",
  "Executive coordination",
  "Department leadership",
  "Institution-wide leadership",
  "Independent governance",
  "Advisory",
] as const;
