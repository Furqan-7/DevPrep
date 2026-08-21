/**
 * DevPrep — Interview Session Analytics
 * ──────────────────────────────────────
 * Run from the repo root:
 *   npx tsx scripts/db-analytics.ts
 *
 * Requires DATABASE_URL in packages/database/.env  (already set for Neon).
 *
 * What this queries:
 *   1. Total interview sessions
 *   2. Unique users who started at least one session
 *   3. Average session duration  (first question createdAt → last question createdAt)
 *      Only sessions with ≥ 2 answered questions contribute to the average.
 *   4. Voice vs text-only sessions
 *      ⚠ The schema has no explicit voiceMode flag.
 *      Heuristic: sessions where the GROQ transcription endpoint was used
 *      tend to produce answers that are longer prose (> 200 chars avg per answer).
 *   5. Difficulty breakdown, top roles, and avg scores from reports
 */

import { PrismaClient } from "../packages/database/generated/prisma/index.js";
import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";

// ── Load DATABASE_URL from packages/database/.env ────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../packages/database/.env") });

const prisma = new PrismaClient();

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDuration(ms: number): string {
  if (ms < 0 || isNaN(ms)) return "—";
  const totalSecs = Math.round(ms / 1000);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n  DevPrep — DB Analytics");
  console.log("  Querying Neon Postgres …\n");

  // ── 1. Total sessions ────────────────────────────────────────────────────
  const totalSessions = await prisma.interviewSession.count();

  // ── 2. Unique users ──────────────────────────────────────────────────────
  const uniqueUserRows = await prisma.interviewSession.groupBy({
    by: ["userId"],
    _count: { userId: true },
  });
  const uniqueUsers = uniqueUserRows.length;

  // ── 3. Session status breakdown ──────────────────────────────────────────
  const statusGroups = await prisma.interviewSession.groupBy({
    by: ["status"],
    _count: { id: true },
  });
  const statusMap = Object.fromEntries(
    statusGroups.map((g) => [g.status, g._count.id])
  );
  const completedSessions = statusMap["completed"] ?? 0;
  const activeSessions = statusMap["active"] ?? 0;

  // ── 4. Average session duration ──────────────────────────────────────────
  //   Group InterviewQuestion rows by sessionId, grab min/max createdAt per session
  const questionTimings = await prisma.interviewQuestion.groupBy({
    by: ["sessionId"],
    _min: { createdAt: true },
    _max: { createdAt: true },
    _count: { id: true },
    having: {
      id: { _count: { gte: 2 } }, // need ≥ 2 questions for a meaningful spread
    },
  });

  const durations = questionTimings
    .map((row) => {
      const start = row._min.createdAt?.getTime() ?? 0;
      const end = row._max.createdAt?.getTime() ?? 0;
      return end - start;
    })
    .filter((d) => d > 0);

  const avgDurationMs =
    durations.length > 0
      ? durations.reduce((acc, d) => acc + d, 0) / durations.length
      : 0;

  // ── 5. Voice vs text heuristic ───────────────────────────────────────────
  //   Raw query: avg char length of answers per session.
  //   The GROQ voice→text pipeline tends to produce longer, more
  //   conversational answers than quickly typed text replies.
  //   Threshold: avg answer > 200 chars  →  likely voice session.
  const rawRows: Array<{ session_id: number; avg_len: number | null }> =
    await prisma.$queryRaw`
      SELECT
        "sessionId" AS session_id,
        AVG(LENGTH(answer))::float AS avg_len
      FROM "InterviewQuestion"
      WHERE answer IS NOT NULL AND answer <> ''
      GROUP BY "sessionId"
    `;

  const VOICE_THRESHOLD = 200; // chars — tune if needed
  let voiceSessions = 0;
  let textSessions = 0;

  const sessionsWithAnswers = new Set(rawRows.map((r) => r.session_id));
  const unansweredSessions = totalSessions - sessionsWithAnswers.size;

  for (const row of rawRows) {
    if (row.avg_len !== null && row.avg_len > VOICE_THRESHOLD) {
      voiceSessions++;
    } else {
      textSessions++;
    }
  }

  // ── 6. Difficulty breakdown ──────────────────────────────────────────────
  const difficultyGroups = await prisma.interviewSession.groupBy({
    by: ["difficulty"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  // ── 7. Top 5 roles ───────────────────────────────────────────────────────
  const roleGroups = await prisma.interviewSession.groupBy({
    by: ["role"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 5,
  });

  // ── 8. Reports / scores ──────────────────────────────────────────────────
  const reportsCount = await prisma.interviewReport.count();
  const avgScore = await prisma.interviewReport.aggregate({
    _avg: {
      overallScore: true,
      communication: true,
      technical: true,
      confidence: true,
    },
  });

  // ── OUTPUT ────────────────────────────────────────────────────────────────

  console.log("═══════════════════════════════════════════════════");
  console.log("  1. SESSION OVERVIEW");
  console.log("═══════════════════════════════════════════════════");
  console.table([
    { Metric: "Total sessions created",        Value: totalSessions },
    { Metric: "Unique users",                  Value: uniqueUsers },
    { Metric: "Completed sessions",            Value: completedSessions },
    { Metric: "Active (incomplete) sessions",  Value: activeSessions },
    { Metric: "Reports generated",             Value: reportsCount },
    {
      Metric: "Avg session duration*",
      Value:
        durations.length > 0
          ? `${fmtDuration(avgDurationMs)} (over ${durations.length} sessions)`
          : "Not enough data",
    },
  ]);

  console.log("\n═══════════════════════════════════════════════════");
  console.log("  2. VOICE vs TEXT  (heuristic — no voiceMode flag in schema)");
  console.log("═══════════════════════════════════════════════════");
  console.table([
    {
      Mode: "Voice  (avg answer > 200 chars)",
      Sessions: voiceSessions,
      "% of Answered":
        sessionsWithAnswers.size > 0
          ? ((voiceSessions / sessionsWithAnswers.size) * 100).toFixed(1) + "%"
          : "—",
    },
    {
      Mode: "Text-only  (avg answer <= 200 chars)",
      Sessions: textSessions,
      "% of Answered":
        sessionsWithAnswers.size > 0
          ? ((textSessions / sessionsWithAnswers.size) * 100).toFixed(1) + "%"
          : "—",
    },
    {
      Mode: "No answers recorded yet",
      Sessions: unansweredSessions,
      "% of Answered": "—",
    },
  ]);

  if (difficultyGroups.length > 0) {
    console.log("\n═══════════════════════════════════════════════════");
    console.log("  3. DIFFICULTY BREAKDOWN");
    console.log("═══════════════════════════════════════════════════");
    console.table(
      difficultyGroups.map((g) => ({
        Difficulty: g.difficulty,
        Sessions: g._count.id,
        "%": totalSessions > 0
          ? ((g._count.id / totalSessions) * 100).toFixed(1) + "%"
          : "—",
      }))
    );
  }

  if (roleGroups.length > 0) {
    console.log("\n═══════════════════════════════════════════════════");
    console.log("  4. TOP ROLES");
    console.log("═══════════════════════════════════════════════════");
    console.table(
      roleGroups.map((g) => ({
        Role: g.role,
        Sessions: g._count.id,
      }))
    );
  }

  if (reportsCount > 0) {
    console.log("\n═══════════════════════════════════════════════════");
    console.log("  5. AVERAGE SCORES  (from generated reports)");
    console.log("═══════════════════════════════════════════════════");
    console.table([
      { Category: "Overall Score",   AvgScore: avgScore._avg.overallScore?.toFixed(1) ?? "—" },
      { Category: "Communication",   AvgScore: avgScore._avg.communication?.toFixed(1) ?? "—" },
      { Category: "Technical",       AvgScore: avgScore._avg.technical?.toFixed(1) ?? "—" },
      { Category: "Confidence",      AvgScore: avgScore._avg.confidence?.toFixed(1) ?? "—" },
    ]);
  } else {
    console.log("\n  (No reports generated yet — scores section skipped)");
  }

  console.log(`
───────────────────────────────────────────────────
NOTES
  * Duration  = time between first and last InterviewQuestion.createdAt.
                Only sessions with ≥ 2 questions contribute to this average.
  * Voice heuristic: avg answer char length > 200 chars per session.
    The schema has no voiceMode field. For exact tracking, consider adding:
      voiceMode  Boolean  @default(false)
    to the InterviewSession model.
───────────────────────────────────────────────────
`);
}

main()
  .catch((e) => {
    console.error("\n❌  Query failed:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
