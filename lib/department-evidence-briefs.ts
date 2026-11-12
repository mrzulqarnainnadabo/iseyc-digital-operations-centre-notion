import type { OpsDepartmentId } from "@/lib/department-operations";

export type DepartmentEvidenceBrief = {
  whatItCanInform: string;
  cannotEstablish: string;
  nextEvidenceStep: string;
};

export const DEPARTMENT_EVIDENCE_BRIEFS: Record<OpsDepartmentId, DepartmentEvidenceBrief> = {
  education: {
    whatItCanInform: "Compare published school-census patterns with digital-learning and skills initiatives. Use the findings to identify questions that need local verification before programme design.",
    cannotEstablish: "State-level school counts do not prove classroom quality, teacher availability, learning outcomes or access in a specific LGA or community.",
    nextEvidenceStep: "Obtain verified LGA-level records on schools, teachers, classrooms and learning resources; then define a measurable local problem and baseline.",
  },
  health: {
    whatItCanInform: "Use the WHO country profile as national health-system context and a guide to questions that should be examined in state and local service records.",
    cannotEstablish: "National indicators do not establish Kaduna facility conditions, medicine availability, staffing, waiting times or primary-care outcomes.",
    nextEvidenceStep: "Connect verified Kaduna State and LGA records on PHC facilities, staffing, essential medicines and service availability before proposing an intervention.",
  },
  "digital-systems": {
    whatItCanInform: "Compare NITDA digital-skills programme reach, NCC broadband subscriptions and World Bank/ITU internet use. These describe training reach, network subscriptions and people using the internet — different parts of digital inclusion.",
    cannotEstablish: "Broadband subscriptions are not unique users; DL4ALL target progress is not national digital-literacy prevalence. National indicators do not establish affordability, device access, speed, reliability or Kaduna LGA conditions.",
    nextEvidenceStep: "Obtain Kaduna/LGA connectivity coverage and quality, affordability, school/device inventories and verified DL4ALL completion records, with clear denominators and reference periods.",
  },
  "civic-affairs": {
    whatItCanInform: "Use identity-enrolment records as administrative registration context and as a starting point for questions about access to identity services.",
    cannotEstablish: "Enrolment counts do not measure civic participation, public trust, representation, accountability or the quality of institutional response.",
    nextEvidenceStep: "Compare published administrative records with documented institutional responses and human-reviewed community submissions, keeping each evidence class distinct.",
  },
};
