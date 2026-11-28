export type Difficulty = "easy" | "medium" | "hard";
export type Level = "fresher" | "mid" | "senior";

/** The sections of the question bank doc. */
export type Topic =
    | "Data structures & algorithms"
    | "Operating systems"
    | "Databases & SQL"
    | "Computer networks"
    | "OOP, SOLID & low-level design"
    | "System design"
    | "Frontend"
    | "Backend"
    | "DevOps, cloud & SRE"
    | "Mobile"
    | "Data, ML & GenAI"
    | "Security"
    | "Behavioural & HR";

export interface BankQuestion {
    /** Permanent and readable, e.g. "os-deadlock-conditions". Sessions store it, so never rename or reuse one. */
    id: string;
    topic: Topic;
    subtopic: string;
    question: string;
    difficulty: Difficulty;
    levels: Level[];
    companies: string[];
    source: { label: string; url: string };
}

/** One doc section: its subsections, each holding that table's rows in doc order. */
export function defineSection(
    topic: Topic,
    subtopics: Record<string, Omit<BankQuestion, "topic" | "subtopic">[]>,
): BankQuestion[] {
    return Object.entries(subtopics).flatMap(([subtopic, questions]) =>
        questions.map((q) => ({ topic, subtopic, ...q })),
    );
}
