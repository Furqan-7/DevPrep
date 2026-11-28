import { questionsFor } from "./index";
import { BLUEPRINTS, DIFFICULTY_MIX, type BlueprintSlot } from "./blueprints";
import type { BankQuestion, Difficulty, Level } from "./types";

export interface PlanInput {
    role: string;
    level: Level;
    /** Bank ids the user was asked in earlier interviews. */
    seenIds: ReadonlySet<string>;
    /** The interview uses a resume or target job: the model writes the last two technical questions. */
    tailoring: boolean;
    /** Defaults to Math.random; tests pass a seeded generator. */
    random?: () => number;
}

/** The questions of an interview in order; null where the model writes a tailored question. */
export type InterviewPlan = (BankQuestion | null)[];

/** A slot's candidates for one difficulty, each list shuffled. */
interface Candidates {
    unseen: BankQuestion[];
    seen: BankQuestion[];
}

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
const TAILORED_SLOTS = 2;

/**
 * Picks an interview's questions from the bank, following the role's blueprint and the level's
 * difficulty mix. Questions in `seenIds` are used only once a slot has no unseen ones left.
 * Returns null for roles without a blueprint.
 */
export function planInterview({ role, level, seenIds, tailoring, random = Math.random }: PlanInput): InterviewPlan | null {
    const blueprint = BLUEPRINTS[role];
    if (!blueprint) return null;
    const slots = blueprint.filter((slot) => !slot.levels || slot.levels.includes(level));
    const reserved = reserveTailored(slots, tailoring ? TAILORED_SLOTS : 0);

    const planned = slots.map((slot, i) => {
        const pool = questionsFor(slot.topic, level).filter((q) => !slot.subtopic || q.subtopic === slot.subtopic);
        const byDifficulty = DIFFICULTIES.map((d): Candidates => {
            const ofDifficulty = pool.filter((q) => q.difficulty === d);
            return {
                unseen: shuffle(ofDifficulty.filter((q) => !seenIds.has(q.id)), random),
                seen: shuffle(ofDifficulty.filter((q) => seenIds.has(q.id)), random),
            };
        });
        return { byDifficulty, count: Math.min(slot.count - reserved[i]!, pool.length), tailored: reserved[i]! };
    });

    const total = planned.reduce((sum, slot) => sum + slot.count, 0);
    const mix = chooseMix(
        planned.map((slot) => shuffle(splits(slot.byDifficulty, slot.count), random)),
        scaleMix(DIFFICULTY_MIX[level], total),
    );

    return planned.flatMap((slot, i) => {
        const picked = slot.byDifficulty.flatMap((c, d) => [...c.unseen, ...c.seen].slice(0, mix[i]![d]));
        return [...shuffle(picked, random), ...Array<null>(slot.tailored).fill(null)];
    });
}

/** How many of each slot's questions the model writes, taken from the last technical slots. */
function reserveTailored(slots: BlueprintSlot[], total: number): number[] {
    const reserved = slots.map(() => 0);
    // Last slot first, technical before behavioural (sort is stable)
    const order = [...slots.keys()]
        .reverse()
        .sort((a, b) => Number(isBehavioural(slots[a]!)) - Number(isBehavioural(slots[b]!)));
    for (const i of order) {
        reserved[i] = Math.min(total, slots[i]!.count);
        total -= reserved[i]!;
    }
    return reserved;
}

function isBehavioural(slot: BlueprintSlot) {
    return slot.topic === "Behavioural & HR";
}

/**
 * The ways a slot can split its count across difficulties, as [easy, medium, hard]. While the
 * slot has enough unseen questions it uses only those; otherwise it uses all of them and tops
 * up with seen ones.
 */
function splits(byDifficulty: Candidates[], count: number): number[][] {
    const unseen = byDifficulty.map((c) => c.unseen.length);
    const enoughUnseen = unseen.reduce((a, b) => a + b, 0) >= count;
    const min = enoughUnseen ? [0, 0, 0] : unseen;
    const max = enoughUnseen ? unseen : byDifficulty.map((c) => c.unseen.length + c.seen.length);
    const result: number[][] = [];
    for (let easy = min[0]!; easy <= max[0]!; easy++) {
        for (let medium = min[1]!; medium <= max[1]!; medium++) {
            const hard = count - easy - medium;
            if (hard >= min[2]! && hard <= max[2]!) result.push([easy, medium, hard]);
        }
    }
    return result;
}

/** Picks one split per slot so the interview's difficulties come as close to `target` as the bank allows. */
function chooseMix(options: number[][][], target: number[]): number[][] {
    let best: number[][] = [];
    let bestCost = Infinity;
    const chosen: number[][] = [];
    const visit = (slot: number, easy: number, hard: number) => {
        if (bestCost === 0) return;
        if (slot === options.length) {
            // Steps to move this mix to the target, where easy to hard counts as two
            const cost = Math.abs(easy - target[0]!) + Math.abs(hard - target[2]!);
            if (cost < bestCost) {
                best = [...chosen];
                bestCost = cost;
            }
            return;
        }
        for (const split of options[slot]!) {
            chosen.push(split);
            visit(slot + 1, easy + split[0]!, hard + split[2]!);
            chosen.pop();
        }
    };
    visit(0, 0, 0);
    return best;
}

/** The level's mix scaled to `total` questions, as [easy, medium, hard], by largest remainder. */
function scaleMix(mix: Record<Difficulty, number>, total: number): number[] {
    const sum = mix.easy + mix.medium + mix.hard;
    const exact = DIFFICULTIES.map((d) => (mix[d] * total) / sum);
    const scaled = exact.map(Math.floor);
    const missing = total - scaled.reduce((a, b) => a + b, 0);
    const byRemainder = [0, 1, 2].sort((a, b) => exact[b]! - scaled[b]! - (exact[a]! - scaled[a]!));
    for (const d of byRemainder.slice(0, missing)) scaled[d]!++;
    return scaled;
}

function shuffle<T>(items: T[], random: () => number): T[] {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [result[i], result[j]] = [result[j]!, result[i]!];
    }
    return result;
}

/**
 * Where a session is in its plan, replayed from the bank ids of the questions asked so far
 * (null for questions the model wrote). A question without a bank id asked where the plan
 * had a bank question was a follow-up, which leaves that question for the next turn.
 */
export function planProgress(plan: (string | null)[], askedBankIds: (string | null)[]) {
    let cursor = 0;
    let lastWasFollowUp = false;
    for (const bankId of askedBankIds) {
        lastWasFollowUp = !bankId && cursor < plan.length && plan[cursor] !== null;
        const at = bankId ? plan.indexOf(bankId, cursor) : -1;
        if (at !== -1) cursor = at + 1;
        else if (!lastWasFollowUp) cursor++;
    }
    return { cursor, lastWasFollowUp };
}

const COMMON_WORDS = new Set(
    "the and are can could does how what when where which who why with you your this that for from into about would there their them explain difference between walk through tell describe".split(
        " ",
    ),
);

function keywords(text: string): Set<string> {
    return new Set((text.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((w) => w.length > 2 && !COMMON_WORDS.has(w)));
}

/** True when `asked` is the planned question, allowing for light rephrasing. */
export function isPlannedQuestion(asked: string, planned: string): boolean {
    const want = keywords(planned);
    const got = keywords(asked);
    let shared = 0;
    for (const word of want) if (got.has(word)) shared++;
    return shared * 2 >= want.size;
}
