import { test } from "node:test";
import assert from "node:assert/strict";
import { QUESTION_BANK, questionsFor } from "./index";
import { BLUEPRINTS, DIFFICULTY_MIX, type BlueprintSlot } from "./blueprints";
import type { Level } from "./types";

const LEVELS: Level[] = ["fresher", "mid", "senior"];

// The role slugs in apps/frontend/data/roles.ts
const ROLES = [
    "frontend-engineer", "backend-engineer", "full-stack-developer", "data-structures-algorithms",
    "system-design", "machine-learning-engineer", "devops-engineer", "android-developer", "ios-developer",
    "data-engineer", "product-manager", "behavioral-round", "cloud-engineer", "site-reliability-engineer",
    "cybersecurity-engineer", "qa-test-engineer", "data-scientist", "generative-ai-engineer",
    "embedded-systems-engineer", "blockchain-developer", "ui-ux-designer", "game-developer",
    "database-administrator", "technical-program-manager",
];
const WITHOUT_BLUEPRINT = [
    "product-manager", "technical-program-manager", "ui-ux-designer", "game-developer",
    "blockchain-developer", "embedded-systems-engineer", "qa-test-engineer",
];

const slotsAt = (role: string, level: Level) =>
    BLUEPRINTS[role]!.filter((slot) => !slot.levels || slot.levels.includes(level));
const poolOf = (slot: BlueprintSlot, level: Level) =>
    questionsFor(slot.topic, level).filter((q) => !slot.subtopic || q.subtopic === slot.subtopic);
const label = (role: string, level: Level, slot?: BlueprintSlot) =>
    [role, level, slot && (slot.subtopic ?? slot.topic)].filter(Boolean).join(" / ");

test("the bank holds all 962 questions of the doc", () => {
    assert.equal(QUESTION_BANK.length, 962);
});

test("ids are unique and readable", () => {
    const ids = QUESTION_BANK.map((q) => q.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const id of ids) assert.match(id, /^[a-z0-9]+(-[a-z0-9]+)+$/);
});

test("every field is filled", () => {
    for (const q of QUESTION_BANK) {
        for (const text of [q.topic, q.subtopic, q.question, q.source.label]) assert.ok(text.trim(), q.id);
        assert.ok(["easy", "medium", "hard"].includes(q.difficulty), q.id);
        assert.ok(q.levels.length > 0 && new Set(q.levels).size === q.levels.length, q.id);
        assert.ok(q.levels.every((level) => LEVELS.includes(level)), q.id);
        assert.ok(q.companies.every((company) => company.trim()), q.id);
        assert.match(q.source.url, /^https:\/\/\S+$/, q.id);
    }
});

test("blueprints cover every role but the ones the bank does not", () => {
    assert.deepEqual(
        Object.keys(BLUEPRINTS).sort(),
        ROLES.filter((role) => !WITHOUT_BLUEPRINT.includes(role)).sort(),
    );
});

test("each level's mix and blueprint add up to the 10 questions of an interview", () => {
    for (const level of LEVELS) {
        const mix = DIFFICULTY_MIX[level];
        assert.equal(mix.easy + mix.medium + mix.hard, 10, level);
    }
    for (const role of Object.keys(BLUEPRINTS)) {
        for (const level of LEVELS) {
            const total = slotsAt(role, level).reduce((sum, slot) => sum + slot.count, 0);
            assert.equal(total, 10, label(role, level));
        }
    }
});

test("slots draw from separate questions and can each be filled twice without a repeat", () => {
    for (const role of Object.keys(BLUEPRINTS)) {
        for (const level of LEVELS) {
            const slots = slotsAt(role, level);
            const ids = slots.flatMap((slot) => poolOf(slot, level).map((q) => q.id));
            assert.equal(new Set(ids).size, ids.length, `${label(role, level)}: two slots share questions`);
            for (const slot of slots) {
                // The behavioural round asks 10 behavioural questions, and the bank has fewer
                // than 20 for freshers and seniors, so their second interview repeats one or two
                const needed = role === "behavioral-round" ? slot.count : slot.count * 2;
                assert.ok(poolOf(slot, level).length >= needed, label(role, level, slot));
            }
        }
    }
});
