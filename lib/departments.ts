export type Department = {
  slug: string;
  name: string;
  shortName: string;
  number: string;
  summary: string;
  introduction: string;
  priorities: { title: string; detail: string }[];
  evidenceQuestions: string[];
};

export const departments: Department[] = [
  {
    slug: "education",
    name: "Education & Capacity Building",
    shortName: "Education",
    number: "01",
    summary: "Learning access, conditions and the capabilities people need to participate and progress.",
    introduction: "Education is shaped by access to learning as well as the conditions that make learning possible. This department brings those questions together without treating an isolated report as a national measure.",
    priorities: [
      { title: "Access & participation", detail: "Look for evidence on who can reach learning opportunities, where access is constrained and which groups are missing from available records." },
      { title: "School infrastructure & learning environments", detail: "Examine school infrastructure and the conditions that support safe, usable learning spaces. A facility record does not by itself establish current service quality." },
      { title: "Teachers & learning capacity", detail: "Consider teacher availability, preparation and ongoing support alongside the context and date of the underlying source." },
      { title: "Literacy, skills & lifelong learning", detail: "Connect foundational learning with youth development, professional capacity, training programmes and learning resources." },
    ],
    evidenceQuestions: ["What geography and population does a source actually cover?", "Is the record a published dataset, announcement, community report or verified implementation?", "When was the information collected, and what remains unobserved?"],
  },
  {
    slug: "health",
    name: "Health & Well-being",
    shortName: "Health",
    number: "02",
    summary: "Primary care, facility conditions, essential services and community well-being, read with care about what is verified.",
    introduction: "Health information can describe a plan, a service report or an independently checked result. Those are different kinds of evidence. This department keeps the distinction visible and avoids turning a single report into a claim about prevalence.",
    priorities: [
      { title: "Primary healthcare access", detail: "Explore whether public information describes where care can be reached, who is served and which communities or periods are not represented." },
      { title: "Facilities, essential medicines & service availability", detail: "Review facility conditions, essential medicine availability and reported services as separate questions, each with its own source and observation date." },
      { title: "Maternal & child health", detail: "Keep indicators, coverage and limitations attached to their original source; do not infer present conditions from an undated or historical statistic." },
      { title: "Community health & well-being", detail: "Treat community observations as valuable signals for follow-up, not as representative population estimates." },
    ],
    evidenceQuestions: ["Was this service announced, reported by a provider or independently verified?", "What date and geographic coverage apply?", "Are the source method and known limitations available?"],
  },
  {
    slug: "technology",
    name: "Software & Technology",
    shortName: "Software & Technology",
    number: "03",
    summary: "Digital inclusion, skills, software innovation and responsible public-interest technology.",
    introduction: "Technology supports community development when people can access it, understand it and trust how it is used. This department considers digital capability alongside the infrastructure and safeguards that make technology useful.",
    priorities: [
      { title: "Digital literacy & skills", detail: "Explore opportunities to build practical digital literacy, software development capability and continuing technology education." },
      { title: "Inclusion & connectivity", detail: "Ask which places and groups can connect, what barriers are documented and where the available evidence does not extend." },
      { title: "Digital public infrastructure & innovation", detail: "Consider software and digital public infrastructure in terms of accessibility, reliability, interoperability and clear responsibility." },
      { title: "Responsible technology & AI", detail: "Make human accountability, privacy, security and transparent limitations part of technology design and institutional use." },
    ],
    evidenceQuestions: ["Does the source measure access, skills, use or outcomes?", "Who is excluded from collection or service coverage?", "Are privacy, security and accountability documented?"],
  },
  {
    slug: "civic",
    name: "Civic Department",
    shortName: "Civic Affairs",
    number: "04",
    summary: "Civic learning, institutional responsibilities, public-service conditions and evidence-based participation.",
    introduction: "Civic participation is strongest when people can understand public responsibilities and assess information in context. This department supports non-partisan learning and transparent engagement without endorsing parties, candidates or campaigns.",
    priorities: [
      { title: "Civic education & responsibilities", detail: "Explain public responsibilities and routes for constructive participation using clear, non-partisan information." },
      { title: "Institutional mandates", detail: "Help readers identify which institution may hold a responsibility while distinguishing a mandate from proof that a service was delivered." },
      { title: "Community needs & public services", detail: "Use attributed community observations to identify questions for further evidence gathering, not to claim population-wide prevalence." },
      { title: "Accountability & transparency", detail: "Support responsible engagement through traceable sources, visible limitations and a clear separation between evidence and decision." },
    ],
    evidenceQuestions: ["Which public responsibility does the cited source address?", "Is the information independently checkable and linked to its original source?", "What evidence is still needed before drawing a conclusion?"],
  },
];

export function getDepartment(slug: string): Department | undefined {
  const resolvedSlug = slug === "software-technology" ? "technology" : slug;
  return departments.find((department) => department.slug === resolvedSlug);
}

export function getDepartmentRouteSlug(slug: Department["slug"]): string {
  return slug === "technology" ? "software-technology" : slug;
}
