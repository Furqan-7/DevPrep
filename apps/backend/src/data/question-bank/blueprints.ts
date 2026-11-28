import type { Difficulty, Level, Topic } from "./types";

export interface BlueprintSlot {
    topic: Topic;
    /** Narrows the slot to one subsection of the topic; the whole topic when omitted. */
    subtopic?: string;
    count: number;
    /** Levels the slot applies to, for subsections the bank only covers at some levels; all when omitted. */
    levels?: Level[];
}

/** Difficulties across the 10 questions of an interview at each level. */
export const DIFFICULTY_MIX: Record<Level, Record<Difficulty, number>> = {
    fresher: { easy: 4, medium: 5, hard: 1 },
    mid: { easy: 2, medium: 6, hard: 2 },
    senior: { easy: 1, medium: 5, hard: 4 },
};

const FRESHER: Level[] = ["fresher"];
const MID: Level[] = ["mid"];
const SENIOR: Level[] = ["senior"];
const FRESHER_MID: Level[] = ["fresher", "mid"];
const MID_SENIOR: Level[] = ["mid", "senior"];

const DSA: Topic = "Data structures & algorithms";
const OS: Topic = "Operating systems";
const DB: Topic = "Databases & SQL";
const NET: Topic = "Computer networks";
const OOP: Topic = "OOP, SOLID & low-level design";
const SD: Topic = "System design";
const FE: Topic = "Frontend";
const BE: Topic = "Backend";
const OPS: Topic = "DevOps, cloud & SRE";
const MOBILE: Topic = "Mobile";
const ML: Topic = "Data, ML & GenAI";
const SEC: Topic = "Security";
const BEHAVIOURAL: BlueprintSlot = { topic: "Behavioural & HR", count: 1 };

/**
 * The 10 questions of an interview, per role slug (apps/frontend/data/roles.ts) and level.
 * Each level's slots add up to 10. Roles the bank does not cover well have no blueprint,
 * and the model writes their questions as before.
 */
export const BLUEPRINTS: Record<string, BlueprintSlot[]> = {
    "frontend-engineer": [
        { topic: FE, subtopic: "JavaScript", count: 2 },
        { topic: FE, subtopic: "React", count: 1, levels: FRESHER },
        { topic: FE, subtopic: "React", count: 2, levels: MID_SENIOR },
        { topic: FE, subtopic: "TypeScript", count: 1 },
        { topic: FE, subtopic: "Browser & web platform", count: 1 },
        { topic: FE, subtopic: "CSS & layout", count: 1 },
        { topic: FE, subtopic: "Performance, accessibility & testing", count: 1 },
        { topic: FE, subtopic: "Machine coding", count: 2, levels: FRESHER },
        { topic: FE, subtopic: "Frontend system design", count: 1, levels: MID_SENIOR },
        BEHAVIOURAL,
    ],
    "backend-engineer": [
        { topic: BE, subtopic: "Node.js", count: 1 },
        { topic: BE, subtopic: "API design", count: 1 },
        { topic: BE, subtopic: "Auth", count: 1 },
        { topic: BE, subtopic: "Caching & queues", count: 1, levels: MID_SENIOR },
        { topic: BE, subtopic: "Concurrency & reliability", count: 1 },
        { topic: DB, subtopic: "SQL query writing", count: 1, levels: FRESHER },
        { topic: DB, subtopic: "Indexing & performance", count: 1 },
        { topic: DB, subtopic: "Transactions & concurrency", count: 1 },
        { topic: NET, subtopic: "HTTP, HTTPS & TLS", count: 1, levels: FRESHER_MID },
        { topic: SD, subtopic: "Core concepts", count: 1 },
        { topic: SD, subtopic: "Classic design problems", count: 1, levels: SENIOR },
        BEHAVIOURAL,
    ],
    "full-stack-developer": [
        { topic: FE, subtopic: "JavaScript", count: 1 },
        { topic: FE, subtopic: "React", count: 1 },
        { topic: FE, subtopic: "Next.js & rendering", count: 1 },
        { topic: BE, subtopic: "Node.js", count: 1 },
        { topic: BE, subtopic: "API design", count: 1 },
        { topic: BE, subtopic: "Auth", count: 1 },
        { topic: DB, subtopic: "SQL query writing", count: 1 },
        { topic: DB, subtopic: "Indexing & performance", count: 1 },
        { topic: SD, subtopic: "Core concepts", count: 1 },
        BEHAVIOURAL,
    ],
    // A coding round: one problem per pattern. Seniors draw from the whole topic,
    // since most subsections have only one or two senior problems.
    "data-structures-algorithms": [
        { topic: DSA, subtopic: "Complexity analysis", count: 1, levels: FRESHER },
        { topic: DSA, subtopic: "Arrays & hashing", count: 1, levels: FRESHER_MID },
        { topic: DSA, subtopic: "Two pointers", count: 1, levels: MID },
        { topic: DSA, subtopic: "Sliding window", count: 1, levels: FRESHER_MID },
        { topic: DSA, subtopic: "Stacks, queues & monotonic stack", count: 1, levels: FRESHER },
        { topic: DSA, subtopic: "Linked lists", count: 1, levels: FRESHER },
        { topic: DSA, subtopic: "Binary search", count: 1, levels: MID },
        { topic: DSA, subtopic: "Trees & BST", count: 1, levels: FRESHER_MID },
        { topic: DSA, subtopic: "Heaps & priority queues", count: 1, levels: FRESHER_MID },
        { topic: DSA, subtopic: "Graphs: BFS & DFS", count: 1, levels: FRESHER_MID },
        { topic: DSA, subtopic: "Topological sort, shortest paths & union-find", count: 1, levels: MID },
        { topic: DSA, subtopic: "Backtracking", count: 1, levels: MID },
        { topic: DSA, subtopic: "Dynamic programming", count: 1, levels: FRESHER_MID },
        { topic: DSA, subtopic: "Bit manipulation", count: 1, levels: FRESHER },
        { topic: DSA, count: 10, levels: SENIOR },
    ],
    // Interns and freshers rarely get a full design round, so their slots lean on fundamentals.
    "system-design": [
        { topic: SD, subtopic: "Core concepts", count: 2, levels: FRESHER_MID },
        { topic: SD, subtopic: "Core concepts", count: 1, levels: SENIOR },
        { topic: SD, subtopic: "Classic design problems", count: 2, levels: MID_SENIOR },
        { topic: SD, subtopic: "Indian product companies", count: 2, levels: FRESHER },
        { topic: SD, subtopic: "Indian product companies", count: 1, levels: MID_SENIOR },
        { topic: SD, subtopic: "Senior & staff-level design", count: 1, levels: MID },
        { topic: SD, subtopic: "Senior & staff-level design", count: 2, levels: SENIOR },
        { topic: SD, subtopic: "AI & LLM system design", count: 1, levels: SENIOR },
        { topic: BE, subtopic: "API design", count: 1, levels: FRESHER },
        { topic: BE, subtopic: "Caching & queues", count: 1, levels: MID_SENIOR },
        { topic: DB, subtopic: "Indexing & performance", count: 1, levels: FRESHER },
        { topic: DB, subtopic: "Scaling: replication, sharding & operations", count: 1, levels: MID_SENIOR },
        { topic: NET, subtopic: "HTTP, HTTPS & TLS", count: 1, levels: FRESHER },
        { topic: NET, subtopic: "Load balancers, proxies & CDNs", count: 1, levels: FRESHER_MID },
        { topic: OOP, subtopic: "LLD & machine-coding problems", count: 1, levels: FRESHER },
        BEHAVIOURAL,
    ],
    "machine-learning-engineer": [
        { topic: ML, subtopic: "ML fundamentals", count: 3, levels: FRESHER_MID },
        { topic: ML, subtopic: "ML fundamentals", count: 1, levels: SENIOR },
        { topic: ML, subtopic: "Deep learning", count: 2, levels: FRESHER_MID },
        { topic: ML, subtopic: "Deep learning", count: 1, levels: SENIOR },
        { topic: ML, subtopic: "LLMs & GenAI", count: 1, levels: FRESHER },
        { topic: ML, subtopic: "LLMs & GenAI", count: 2, levels: MID },
        { topic: ML, subtopic: "LLMs & GenAI", count: 3, levels: SENIOR },
        { topic: ML, subtopic: "ML system design", count: 1, levels: MID },
        { topic: ML, subtopic: "ML system design", count: 3, levels: SENIOR },
        { topic: ML, subtopic: "Data engineering", count: 1, levels: ["fresher", "senior"] },
        { topic: BE, subtopic: "Python", count: 1, levels: FRESHER_MID },
        { topic: DSA, subtopic: "Arrays & hashing", count: 1, levels: FRESHER },
        BEHAVIOURAL,
    ],
    "devops-engineer": [
        { topic: OPS, subtopic: "Linux & shell", count: 2, levels: FRESHER },
        { topic: OPS, subtopic: "Linux & shell", count: 1, levels: MID_SENIOR },
        { topic: OPS, subtopic: "Git", count: 1, levels: FRESHER_MID },
        { topic: OPS, subtopic: "Docker", count: 1, levels: FRESHER_MID },
        { topic: OPS, subtopic: "Kubernetes", count: 1, levels: FRESHER },
        { topic: OPS, subtopic: "Kubernetes", count: 2, levels: MID_SENIOR },
        { topic: OPS, subtopic: "CI/CD & deployment strategies", count: 1 },
        { topic: OPS, subtopic: "Infrastructure as code (Terraform)", count: 1, levels: MID_SENIOR },
        { topic: OPS, subtopic: "AWS core services", count: 1 },
        { topic: OPS, subtopic: "Observability, SRE & incident response", count: 1, levels: MID_SENIOR },
        { topic: OS, subtopic: "Linux in production", count: 1, levels: SENIOR },
        { topic: NET, subtopic: "DNS", count: 1, levels: FRESHER },
        { topic: NET, subtopic: "Load balancers, proxies & CDNs", count: 1, levels: ["fresher", "senior"] },
        BEHAVIOURAL,
    ],
    "android-developer": [
        { topic: MOBILE, subtopic: "Android", count: 3, levels: ["fresher", "senior"] },
        { topic: MOBILE, subtopic: "Android", count: 5, levels: MID },
        { topic: MOBILE, subtopic: "Cross-platform", count: 1, levels: MID_SENIOR },
        { topic: OOP, subtopic: "OOP fundamentals", count: 2, levels: FRESHER },
        { topic: OOP, subtopic: "SOLID & design principles", count: 1 },
        { topic: OOP, subtopic: "Design patterns", count: 1, levels: FRESHER_MID },
        { topic: OOP, subtopic: "LLD & machine-coding problems", count: 1, levels: MID },
        { topic: OOP, subtopic: "LLD & machine-coding problems", count: 2, levels: SENIOR },
        { topic: DSA, subtopic: "Arrays & hashing", count: 1, levels: FRESHER },
        { topic: DSA, subtopic: "Linked lists", count: 1, levels: FRESHER },
        { topic: SD, subtopic: "Core concepts", count: 1, levels: SENIOR },
        { ...BEHAVIOURAL, levels: FRESHER_MID },
        { ...BEHAVIOURAL, count: 2, levels: SENIOR },
    ],
    // The bank has only two senior iOS questions, so senior interviews lean on design.
    "ios-developer": [
        { topic: MOBILE, subtopic: "iOS", count: 3, levels: FRESHER },
        { topic: MOBILE, subtopic: "iOS", count: 5, levels: MID },
        { topic: MOBILE, subtopic: "iOS", count: 1, levels: SENIOR },
        { topic: MOBILE, subtopic: "Cross-platform", count: 1, levels: MID_SENIOR },
        { topic: OOP, subtopic: "OOP fundamentals", count: 2, levels: FRESHER },
        { topic: OOP, subtopic: "SOLID & design principles", count: 1 },
        { topic: OOP, subtopic: "Design patterns", count: 1, levels: FRESHER_MID },
        { topic: OOP, subtopic: "LLD & machine-coding problems", count: 1, levels: MID },
        { topic: OOP, subtopic: "LLD & machine-coding problems", count: 2, levels: SENIOR },
        { topic: DSA, subtopic: "Arrays & hashing", count: 1, levels: FRESHER },
        { topic: DSA, subtopic: "Linked lists", count: 1, levels: FRESHER },
        { topic: SD, subtopic: "Core concepts", count: 1, levels: SENIOR },
        { topic: SD, subtopic: "Classic design problems", count: 2, levels: SENIOR },
        { ...BEHAVIOURAL, levels: FRESHER_MID },
        { ...BEHAVIOURAL, count: 2, levels: SENIOR },
    ],
    "data-engineer": [
        { topic: ML, subtopic: "Data engineering", count: 1, levels: FRESHER },
        { topic: ML, subtopic: "Data engineering", count: 3, levels: MID_SENIOR },
        { topic: DB, subtopic: "SQL query writing", count: 3, levels: FRESHER },
        { topic: DB, subtopic: "SQL query writing", count: 2, levels: MID },
        { topic: DB, subtopic: "SQL query writing", count: 1, levels: SENIOR },
        { topic: DB, subtopic: "Fundamentals & normalization", count: 2, levels: FRESHER },
        { topic: DB, subtopic: "Indexing & performance", count: 1 },
        { topic: DB, subtopic: "NoSQL, MongoDB & Redis", count: 1 },
        { topic: DB, subtopic: "Scaling: replication, sharding & operations", count: 1, levels: MID },
        { topic: DB, subtopic: "Scaling: replication, sharding & operations", count: 2, levels: SENIOR },
        { topic: DB, subtopic: "Transactions & concurrency", count: 1, levels: SENIOR },
        { topic: BE, subtopic: "Python", count: 1, levels: FRESHER_MID },
        BEHAVIOURAL,
    ],
    "behavioral-round": [{ ...BEHAVIOURAL, count: 10 }],
    "cloud-engineer": [
        { topic: OPS, subtopic: "AWS core services", count: 1, levels: FRESHER },
        { topic: OPS, subtopic: "AWS core services", count: 2, levels: MID_SENIOR },
        { topic: OPS, subtopic: "Infrastructure as code (Terraform)", count: 2, levels: MID_SENIOR },
        { topic: OPS, subtopic: "Kubernetes", count: 1 },
        { topic: OPS, subtopic: "Docker", count: 1, levels: FRESHER_MID },
        { topic: OPS, subtopic: "Linux & shell", count: 1, levels: FRESHER },
        { topic: OPS, subtopic: "CI/CD & deployment strategies", count: 1, levels: FRESHER },
        { topic: OPS, subtopic: "Observability, SRE & incident response", count: 1, levels: MID },
        { topic: NET, subtopic: "IP addressing, NAT, ARP & DHCP", count: 2, levels: FRESHER },
        { topic: NET, subtopic: "IP addressing, NAT, ARP & DHCP", count: 1, levels: MID },
        { topic: NET, subtopic: "DNS", count: 1, levels: FRESHER },
        { topic: NET, subtopic: "Load balancers, proxies & CDNs", count: 1, levels: ["fresher", "senior"] },
        { topic: SD, subtopic: "Core concepts", count: 1, levels: MID_SENIOR },
        { topic: DB, subtopic: "Scaling: replication, sharding & operations", count: 1, levels: SENIOR },
        { topic: SEC, subtopic: "Secure design & operations", count: 1, levels: SENIOR },
        BEHAVIOURAL,
    ],
    "site-reliability-engineer": [
        { topic: OPS, subtopic: "Observability, SRE & incident response", count: 2, levels: MID },
        { topic: OPS, subtopic: "Observability, SRE & incident response", count: 1, levels: SENIOR },
        { topic: OPS, subtopic: "Linux & shell", count: 2, levels: FRESHER },
        { topic: OPS, subtopic: "Linux & shell", count: 1, levels: MID_SENIOR },
        { topic: OPS, subtopic: "Kubernetes", count: 1 },
        { topic: OPS, subtopic: "Docker", count: 1, levels: FRESHER },
        { topic: OPS, subtopic: "CI/CD & deployment strategies", count: 1, levels: MID },
        { topic: OS, subtopic: "Processes & threads", count: 1, levels: FRESHER },
        { topic: OS, subtopic: "Memory management", count: 1 },
        { topic: OS, subtopic: "Linux in production", count: 1, levels: SENIOR },
        { topic: NET, subtopic: "TCP & UDP", count: 1 },
        { topic: NET, subtopic: "DNS", count: 1, levels: FRESHER },
        { topic: NET, subtopic: "Typing a URL & latency debugging", count: 1 },
        { topic: SD, subtopic: "Core concepts", count: 1, levels: MID },
        { topic: SD, subtopic: "Senior & staff-level design", count: 1, levels: SENIOR },
        { topic: DB, subtopic: "Scaling: replication, sharding & operations", count: 1, levels: SENIOR },
        BEHAVIOURAL,
    ],
    "cybersecurity-engineer": [
        { topic: SEC, subtopic: "Web vulnerabilities", count: 1, levels: FRESHER },
        { topic: SEC, subtopic: "Web vulnerabilities", count: 3, levels: MID_SENIOR },
        { topic: SEC, subtopic: "Auth & sessions", count: 1, levels: ["fresher", "senior"] },
        { topic: SEC, subtopic: "Auth & sessions", count: 2, levels: MID },
        { topic: SEC, subtopic: "Cryptography", count: 2, levels: FRESHER },
        { topic: SEC, subtopic: "Cryptography", count: 1, levels: MID_SENIOR },
        { topic: SEC, subtopic: "Secure design & operations", count: 1, levels: ["fresher", "senior"] },
        { topic: SEC, subtopic: "Secure design & operations", count: 2, levels: MID },
        { topic: NET, subtopic: "HTTP, HTTPS & TLS", count: 1, levels: FRESHER_MID },
        { topic: NET, subtopic: "IP addressing, NAT, ARP & DHCP", count: 1, levels: FRESHER },
        { topic: NET, subtopic: "DNS", count: 1, levels: FRESHER },
        { topic: OS, subtopic: "System calls, kernel mode & interrupts", count: 1, levels: FRESHER },
        { topic: BE, subtopic: "Auth", count: 1, levels: SENIOR },
        { topic: OPS, subtopic: "Linux & shell", count: 1, levels: SENIOR },
        { topic: SD, subtopic: "Core concepts", count: 1, levels: SENIOR },
        BEHAVIOURAL,
    ],
    "data-scientist": [
        { topic: ML, subtopic: "ML fundamentals", count: 3, levels: FRESHER },
        { topic: ML, subtopic: "ML fundamentals", count: 4, levels: MID },
        { topic: ML, subtopic: "ML fundamentals", count: 1, levels: SENIOR },
        { topic: ML, subtopic: "Deep learning", count: 1 },
        { topic: ML, subtopic: "LLMs & GenAI", count: 1, levels: FRESHER },
        { topic: ML, subtopic: "LLMs & GenAI", count: 2, levels: SENIOR },
        { topic: ML, subtopic: "ML system design", count: 1, levels: MID },
        { topic: ML, subtopic: "ML system design", count: 2, levels: SENIOR },
        { topic: ML, subtopic: "Data engineering", count: 1, levels: SENIOR },
        { topic: DB, subtopic: "SQL query writing", count: 2, levels: FRESHER_MID },
        { topic: DB, subtopic: "SQL query writing", count: 1, levels: SENIOR },
        { topic: DB, subtopic: "Fundamentals & normalization", count: 1, levels: FRESHER },
        { topic: BE, subtopic: "Python", count: 1 },
        BEHAVIOURAL,
    ],
    "generative-ai-engineer": [
        { topic: ML, subtopic: "LLMs & GenAI", count: 1, levels: FRESHER },
        { topic: ML, subtopic: "LLMs & GenAI", count: 4, levels: MID },
        { topic: ML, subtopic: "LLMs & GenAI", count: 3, levels: SENIOR },
        { topic: SD, subtopic: "AI & LLM system design", count: 2, levels: SENIOR },
        { topic: ML, subtopic: "ML system design", count: 1, levels: MID_SENIOR },
        { topic: ML, subtopic: "Deep learning", count: 2, levels: FRESHER },
        { topic: ML, subtopic: "Deep learning", count: 1, levels: MID_SENIOR },
        { topic: ML, subtopic: "ML fundamentals", count: 2, levels: FRESHER },
        { topic: ML, subtopic: "ML fundamentals", count: 1, levels: MID },
        { topic: ML, subtopic: "Data engineering", count: 1, levels: FRESHER },
        { topic: BE, subtopic: "Python", count: 1 },
        { topic: BE, subtopic: "API design", count: 1, levels: FRESHER_MID },
        { topic: BE, subtopic: "Caching & queues", count: 1, levels: SENIOR },
        { topic: DSA, subtopic: "Arrays & hashing", count: 1, levels: FRESHER },
        BEHAVIOURAL,
    ],
    "database-administrator": [
        { topic: DB, subtopic: "Fundamentals & normalization", count: 2, levels: FRESHER },
        { topic: DB, subtopic: "Fundamentals & normalization", count: 1, levels: MID },
        { topic: DB, subtopic: "Transactions & concurrency", count: 1, levels: FRESHER },
        { topic: DB, subtopic: "Transactions & concurrency", count: 2, levels: MID_SENIOR },
        { topic: DB, subtopic: "Indexing & performance", count: 2 },
        { topic: DB, subtopic: "SQL query writing", count: 2, levels: FRESHER },
        { topic: DB, subtopic: "SQL query writing", count: 1, levels: MID_SENIOR },
        { topic: DB, subtopic: "NoSQL, MongoDB & Redis", count: 1 },
        { topic: DB, subtopic: "Scaling: replication, sharding & operations", count: 2, levels: MID },
        { topic: DB, subtopic: "Scaling: replication, sharding & operations", count: 3, levels: SENIOR },
        { topic: OS, subtopic: "File systems & I/O", count: 1, levels: FRESHER },
        BEHAVIOURAL,
    ],
};
