/**
 * Interview role catalog shared by the interview and feedback APIs.
 * `slug` is the interview role slug used by the frontend route
 * (/dashboard/ai-interview/[role]) and doubles as the feedback `roleId`.
 */
export interface InterviewRole {
    slug: string;
    title: string;
    /** Short track name shown as the feedback "category". */
    track: string;
}

export const PASS_THRESHOLD = 70;

export const INTERVIEW_ROLES: InterviewRole[] = [
    { slug: "frontend-engineer", title: "Front-End Developer", track: "Frontend" },
    { slug: "backend-engineer", title: "Back-End Developer", track: "Backend" },
    { slug: "full-stack-developer", title: "Full Stack Developer", track: "Full Stack" },
    { slug: "dsa", title: "Data Structures & Algorithms", track: "DSA" },
    { slug: "system-design", title: "System Design", track: "System Design" },
    { slug: "machine-learning-engineer", title: "Machine Learning Engineer", track: "Machine Learning" },
    { slug: "devops-engineer", title: "DevOps Engineer", track: "DevOps" },
    { slug: "android-developer", title: "Android Developer", track: "Android" },
    { slug: "ios-developer", title: "iOS Developer", track: "iOS" },
    { slug: "data-engineer", title: "Data Engineer", track: "Data Engineering" },
    { slug: "product-manager", title: "Product Manager", track: "Product" },
    { slug: "behavioral-round", title: "Behavioral Round", track: "Behavioral" },
    { slug: "cloud-engineer", title: "Cloud Engineer", track: "Cloud" },
    { slug: "site-reliability-engineer", title: "Site Reliability Engineer", track: "SRE" },
    { slug: "cybersecurity-engineer", title: "Cybersecurity Engineer", track: "Security" },
    { slug: "qa-test-engineer", title: "QA / Test Engineer", track: "QA" },
    { slug: "data-scientist", title: "Data Scientist", track: "Data Science" },
    { slug: "generative-ai-engineer", title: "Generative AI Engineer", track: "Generative AI" },
    { slug: "embedded-systems-engineer", title: "Embedded Systems Engineer", track: "Embedded" },
    { slug: "blockchain-developer", title: "Blockchain Developer", track: "Blockchain" },
    { slug: "uiux-designer", title: "UI/UX Designer", track: "Design" },
    { slug: "game-developer", title: "Game Developer", track: "Game Dev" },
    { slug: "database-administrator", title: "Database Administrator", track: "Databases" },
    { slug: "technical-program-manager", title: "Technical Program Manager", track: "Program Management" },
];

// Alternate slugs the frontend generates for the same role
const ALIASES: Record<string, string> = {
    "data-structures-algorithms": "dsa",
    "frontend-developer": "frontend-engineer",
    "backend-developer": "backend-engineer",
};

const BY_SLUG = new Map(INTERVIEW_ROLES.map((role) => [role.slug, role]));

export function findRole(slug: string): InterviewRole | undefined {
    return BY_SLUG.get(ALIASES[slug] ?? slug);
}

/** Never fails: unknown slugs get a readable title so old sessions still render. */
export function resolveRole(slug: string): InterviewRole {
    const known = findRole(slug);
    if (known) return known;
    const title = slug.split("-").filter(Boolean).map((w) => w[0]!.toUpperCase() + w.slice(1)).join(" ") || "Interview";
    return { slug, title, track: title };
}

/** Skill dimensions scored in every report (keys match the frontend). */
export const SKILL_KEYS = ["technicalDepth", "communication", "problemSolving", "systemDesign", "confidence"] as const;
export type SkillKey = (typeof SKILL_KEYS)[number];

export const SKILL_LABELS: Record<SkillKey, string> = {
    technicalDepth: "Technical Depth",
    communication: "Communication",
    problemSolving: "Problem Solving",
    systemDesign: "System Design",
    confidence: "Confidence",
};
