import type { BankQuestion, Level, Topic } from "./types";
import dsa from "./dsa";
import operatingSystems from "./operating-systems";
import databases from "./databases";
import networks from "./networks";
import oopLld from "./oop-lld";
import systemDesign from "./system-design";
import frontend from "./frontend";
import backend from "./backend";
import devops from "./devops";
import mobile from "./mobile";
import dataMl from "./data-ml";
import security from "./security";
import behavioural from "./behavioural";

export type { BankQuestion, Difficulty, Level, Topic } from "./types";

/**
 * Every question in the "DevPrep Interview Question Bank 2026" doc, in doc order,
 * with the doc's wording, levels, difficulty, companies and sources.
 */
export const QUESTION_BANK: readonly BankQuestion[] = [
    ...dsa,
    ...operatingSystems,
    ...databases,
    ...networks,
    ...oopLld,
    ...systemDesign,
    ...frontend,
    ...backend,
    ...devops,
    ...mobile,
    ...dataMl,
    ...security,
    ...behavioural,
];

export const questionById: ReadonlyMap<string, BankQuestion> = new Map(QUESTION_BANK.map((q) => [q.id, q]));

const byTopicLevel = new Map<string, BankQuestion[]>();
for (const q of QUESTION_BANK) {
    for (const level of q.levels) {
        const key = `${q.topic}|${level}`;
        const list = byTopicLevel.get(key);
        if (list) list.push(q);
        else byTopicLevel.set(key, [q]);
    }
}

/** The questions of a topic that are asked at a level. */
export function questionsFor(topic: Topic, level: Level): readonly BankQuestion[] {
    return byTopicLevel.get(`${topic}|${level}`) ?? [];
}
