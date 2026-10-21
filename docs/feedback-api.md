# Feedback API

The frontend expects JSON responses from the following authenticated endpoints. All requests include credentials and use the API base URL configured by `NEXT_PUBLIC_API_URL`.

## Shared types

```ts
type FeedbackSkillScore = Record<string, number>;

interface FeedbackQuestion {
  text: string;
  score: number;
  strongerAnswer: string | null;
}

interface FeedbackSession {
  id: string;
  createdAt: string; // ISO 8601
  durationMin: number;
  role: string;
  category: string;
  score: number;
  skillScores: FeedbackSkillScore;
  topics: string[];
  feedbackNote: string | null;
  questions: FeedbackQuestion[];
}

interface FeedbackGoal {
  targetScore: number;
  targetDate: string | null; // ISO 8601 date
  label: string;
}
```

## `GET /api/feedback/summary`

Returns the aggregate values used by the summary row.

```json
{
  "totalSessions": 12,
  "averageScore": 74.5,
  "passRate": 0.6667,
  "passThreshold": 70,
  "weakestSkill": "technicalDepth",
  "lastUpdatedAt": "2026-10-21T10:30:00.000Z",
  "goal": {
    "targetScore": 85,
    "targetDate": "2026-12-01",
    "label": "Reach a consistent interview-ready score"
  }
}
```

`averageScore`, `passRate`, `weakestSkill`, `lastUpdatedAt`, and `goal` may be `null` when there is not enough data.

## `GET /api/feedback/sessions`

Query parameters:

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `category` | string | no | Exact category filter |
| `q` | string | no | Search text for role, category, or topics |
| `sort` | `newest \| oldest` | no | Sort order |
| `cursor` | string | no | Pagination cursor |
| `limit` | number | no | Maximum number of sessions |

```json
{
  "sessions": [
    {
      "id": "session-id",
      "createdAt": "2026-10-21T10:30:00.000Z",
      "durationMin": 30,
      "role": "Role name",
      "category": "Category name",
      "score": 78,
      "skillScores": {
        "technicalDepth": 80,
        "communication": 76
      },
      "topics": ["Topic name"],
      "feedbackNote": "Feedback note.",
      "questions": [
        {
          "text": "Question text.",
          "score": 75,
          "strongerAnswer": "A stronger answer."
        }
      ]
    }
  ],
  "nextCursor": null
}
```

## `GET /api/feedback/gaps`

```json
[
  {
    "skill": "technicalDepth",
    "occurrences": 4,
    "latestScore": 68,
    "note": "Explain constraints before choosing a tool."
  }
]
```

## `GET /api/feedback/frequency`

```json
{
  "weeks": [
    {
      "weekStart": "2026-10-05",
      "sessionCount": 2
    },
    {
      "weekStart": "2026-10-12",
      "sessionCount": 0
    }
  ]
}
```

Weeks with no practice should be returned with `sessionCount: 0` so the chart can preserve empty weeks.

## `GET /api/feedback/goal`

```json
{
  "goal": null
}
```

When a goal exists, `goal` contains the `FeedbackGoal` shape shown in the summary example.

## `PUT /api/feedback/goal`

Request body:

```json
{
  "targetScore": 85,
  "targetDate": "2026-12-01",
  "label": "Reach a consistent interview-ready score"
}
```

Response:

```json
{
  "goal": {
    "targetScore": 85,
    "targetDate": "2026-12-01",
    "label": "Reach a consistent interview-ready score"
  }
}
```

## Errors

The frontend treats HTTP `401` as an expired authentication session and redirects to `/auth/signin`. Other non-2xx responses should include a useful server-side log and may return a JSON error body; the frontend displays an inline retry state.

