# Examora MVP v1 API Contract

## Conventions

- Base path: `/api`
- Access and refresh tokens are issued by `/api/auth/*`
- Admin APIs live under `/api/admin/*`
- Candidate desktop APIs live under `/api/client/*`
- All timestamps use ISO 8601 UTC strings

## Auth

### `POST /api/auth/login`

Request:

```json
{
  "username": "student01",
  "password": "secret",
  "clientType": "DESKTOP"
}
```

Response:

```json
{
  "accessToken": "jwt",
  "refreshToken": "jwt",
  "user": {
    "id": 1,
    "username": "student01",
    "name": "Student 01",
    "roles": ["STUDENT"]
  }
}
```

## Admin APIs

### `GET /api/admin/subjects`

Returns source subject records for management.

### `POST /api/admin/questions`

Admin-only source question creation.

Request shape:

```json
{
  "subjectId": 10,
  "type": "PROGRAMMING",
  "title": "A + B",
  "content": "Read two integers and print their sum.",
  "score": 20,
  "difficulty": "EASY",
  "tags": ["intro", "math"],
  "configJson": {
    "languages": ["cpp17", "python3"],
    "timeLimitMs": 1000,
    "memoryLimitMb": 256,
    "samples": [
      {
        "input": "1 2",
        "output": "3"
      }
    ]
  },
  "answerJson": {
    "judgeMode": "standard"
  }
}
```

Rules:

- `configJson` is presentation and interaction config only
- `answerJson` holds scoring truth only
- Hidden test cases are created separately and are never returned by candidate APIs

### `POST /api/admin/exams/{examId}/publish`

Publish action freezes source paper/question data into snapshot tables.

Response:

```json
{
  "examId": 100,
  "status": "PUBLISHED",
  "snapshotVersion": 1,
  "publishedAt": "2026-04-25T01:00:00Z"
}
```

## Candidate APIs

### `GET /api/client/exams`

Returns only exams visible to the authenticated student.

### `POST /api/client/exams/{examId}/sessions`

Creates or resumes the single allowed attempt for this MVP.

Request:

```json
{
  "clientDeviceId": "device-123",
  "clientVersion": "0.1.0"
}
```

### `GET /api/client/exam-sessions/{sessionId}/paper`

Returns frozen, candidate-safe paper snapshot content.

Response excerpt:

```json
{
  "sessionId": 301,
  "exam": {
    "id": 100,
    "title": "Spring Mock Exam",
    "remainingSeconds": 5400
  },
  "questions": [
    {
      "questionSnapshotId": 9001,
      "questionId": 88,
      "type": "PROGRAMMING",
      "title": "A + B",
      "content": "Read two integers and print their sum.",
      "score": 20,
      "config": {
        "languages": ["cpp17", "python3"],
        "timeLimitMs": 1000,
        "memoryLimitMb": 256,
        "samples": [
          {
            "input": "1 2",
            "output": "3"
          }
        ]
      }
    }
  ]
}
```

Never included:

- `answerJson`
- hidden test cases
- grading notes intended for admins

### `PUT /api/client/exam-sessions/{sessionId}/answers/{questionSnapshotId}`

Upserts the current draft answer for one question.

Programming draft example:

```json
{
  "answerJson": {
    "language": "python3",
    "draftCode": "a, b = map(int, input().split())\nprint(a + b)\n",
    "finalSubmissionId": null
  }
}
```

### `POST /api/client/programming/submissions`

Creates a formal programming submission and judge task.

Request:

```json
{
  "sessionId": 301,
  "questionSnapshotId": 9001,
  "language": "python3",
  "sourceCode": "a, b = map(int, input().split())\nprint(a + b)\n"
}
```

Response:

```json
{
  "submissionId": 501,
  "status": "PENDING"
}
```

### `POST /api/client/exam-sessions/{sessionId}/submit`

Finalizes the exam session.

Server responsibilities:

- lock the session
- auto-score objective questions
- read programming results from final submission IDs
- write `scores`
- mark the session as `SUBMITTED`

## Error Rules

- `401`: unauthenticated
- `403`: authenticated but forbidden
- `404`: resource not visible to the caller
- `409`: invalid state transition, such as submitting an already submitted session
- `422`: validation error
