import { test } from "node:test";
import assert from "node:assert/strict";
import { QUESTION_BANK, questionsFor, type BankQuestion, type Level } from "./index";
import { BLUEPRINTS } from "./blueprints";
import { isPlannedQuestion, planInterview, planProgress, type PlanInput } from "./planner";

const LEVELS: Level[] = ["fresher", "mid", "senior"];

/** mulberry32: a small seeded generator, so plans are reproducible. */
function seeded(seed: number) {
    return () => {
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function plan(role: string, level: Level, options: Partial<PlanInput> = {}) {
    const result = planInterview({ role, level, seenIds: new Set(), tailoring: false, random: seeded(1), ...options });
    assert.ok(result, `${role} has a blueprint`);
    return result;
}

function bankOnly(questions: (BankQuestion | null)[]) {
    return questions.filter((q): q is BankQuestion => q !== null);
}

function mixOf(questions: BankQuestion[]) {
    const mix = { easy: 0, medium: 0, hard: 0 };
    for (const q of questions) mix[q.difficulty]++;
    return mix;
}

test("plans 10 distinct questions of the level, slot by slot, for every role", () => {
    for (const role of Object.keys(BLUEPRINTS)) {
        for (const level of LEVELS) {
            const questions = plan(role, level);
            assert.equal(questions.length, 10);
            const picked = bankOnly(questions);
            assert.equal(picked.length, 10, `${role} / ${level}`);
            assert.equal(new Set(picked.map((q) => q.id)).size, 10, `${role} / ${level}`);
            assert.ok(picked.every((q) => q.levels.includes(level)), `${role} / ${level}`);

            let at = 0;
            for (const slot of BLUEPRINTS[role]!.filter((s) => !s.levels || s.levels.includes(level))) {
                const pool = new Set(
                    questionsFor(slot.topic, level)
                        .filter((q) => !slot.subtopic || q.subtopic === slot.subtopic)
                        .map((q) => q.id),
                );
                for (const q of picked.slice(at, at + slot.count)) assert.ok(pool.has(q.id), `${role} / ${level}: ${q.id}`);
                at += slot.count;
            }
        }
    }
});

test("meets the level's difficulty mix", () => {
    for (let seed = 1; seed <= 20; seed++) {
        const random = seeded(seed);
        assert.deepEqual(mixOf(bankOnly(plan("frontend-engineer", "mid", { random }))), { easy: 2, medium: 6, hard: 2 });
        assert.deepEqual(mixOf(bankOnly(plan("backend-engineer", "mid", { random }))), { easy: 2, medium: 6, hard: 2 });
        assert.deepEqual(mixOf(bankOnly(plan("system-design", "mid", { random }))), { easy: 2, medium: 6, hard: 2 });
    }
});

test("comes as close to the mix as the bank allows", () => {
    // None of a fresher frontend interview's slots has a hard fresher question,
    // so the hard question becomes a medium one rather than an easy one
    assert.deepEqual(mixOf(bankOnly(plan("frontend-engineer", "fresher"))), { easy: 4, medium: 6, hard: 0 });
});

test("skips questions the user has already been asked", () => {
    for (const [role, level] of [["frontend-engineer", "mid"], ["backend-engineer", "senior"], ["system-design", "fresher"]] as const) {
        const first = bankOnly(plan(role, level, { random: seeded(1) }));
        const seenIds = new Set(first.map((q) => q.id));
        const second = bankOnly(plan(role, level, { random: seeded(2), seenIds }));
        assert.equal(second.length, 10);
        assert.ok(second.every((q) => !seenIds.has(q.id)), `${role} / ${level}`);
    }
});

test("tops up with seen questions only once a slot runs out", () => {
    const everything = new Set(QUESTION_BANK.map((q) => q.id));
    const allSeen = bankOnly(plan("frontend-engineer", "mid", { seenIds: everything }));
    assert.equal(new Set(allSeen.map((q) => q.id)).size, 10);

    // One unseen TypeScript question left: the TypeScript slot must use it
    const [left] = questionsFor("Frontend", "mid").filter((q) => q.subtopic === "TypeScript");
    const seenIds = new Set([...everything].filter((id) => id !== left!.id));
    for (let seed = 1; seed <= 5; seed++) {
        const picked = bankOnly(plan("frontend-engineer", "mid", { seenIds, random: seeded(seed) }));
        assert.ok(picked.some((q) => q.id === left!.id));
    }
});

test("gives the same plan for the same seed", () => {
    const ids = (seed: number) => plan("full-stack-developer", "mid", { random: seeded(seed) }).map((q) => q?.id);
    assert.deepEqual(ids(7), ids(7));
    assert.notDeepEqual(ids(7), ids(8));
});

test("leaves the last two technical slots to the model when the interview is tailored", () => {
    const questions = plan("frontend-engineer", "mid", { tailoring: true });
    assert.equal(questions.length, 10);
    // Mid frontend: ..., CSS, performance, frontend system design, behavioural
    assert.deepEqual(questions.map((q) => q === null), [false, false, false, false, false, false, false, true, true, false]);
    assert.equal(questions[9]!.topic, "Behavioural & HR");
    assert.deepEqual(mixOf(bankOnly(questions)), { easy: 2, medium: 5, hard: 1 });
});

test("has no plan for roles without a blueprint", () => {
    assert.equal(planInterview({ role: "product-manager", level: "mid", seenIds: new Set(), tailoring: false }), null);
});

test("replays a session's place in its plan past follow-ups and tailored questions", () => {
    const sessionPlan = ["a", "b", null, "c"];
    assert.deepEqual(planProgress(sessionPlan, []), { cursor: 0, lastWasFollowUp: false });
    assert.deepEqual(planProgress(sessionPlan, ["a"]), { cursor: 1, lastWasFollowUp: false });
    assert.deepEqual(planProgress(sessionPlan, ["a", null]), { cursor: 1, lastWasFollowUp: true });
    assert.deepEqual(planProgress(sessionPlan, ["a", null, "b"]), { cursor: 2, lastWasFollowUp: false });
    assert.deepEqual(planProgress(sessionPlan, ["a", "b", null]), { cursor: 3, lastWasFollowUp: false });
    assert.deepEqual(planProgress(sessionPlan, ["a", "b", null, "c", null]), { cursor: 5, lastWasFollowUp: false });
});

test("recognises a lightly rephrased planned question but not a follow-up", () => {
    const planned = "Explain the difference between Big-O, Big-Theta and Big-Omega, and why we usually quote Big-O.";
    assert.ok(isPlannedQuestion("Switching to complexity: how do Big-O, Big-Theta and Big-Omega differ, and why do we usually quote Big-O?", planned));
    assert.ok(!isPlannedQuestion("Can you give a concrete example of when your cache would return stale data?", planned));
});
