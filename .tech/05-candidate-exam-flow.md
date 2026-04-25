# Candidate Exam Flow

## 目标

打通考生考试主链路，包括进场、作答、自动保存、交卷和客观题评分。

## 范围

- 考试列表
- 考试会话创建与恢复
- 试题快照加载
- 作答保存
- 自动保存
- 最终提交
- 客观题评分

## 数据表

- `exam_sessions`
- `answers`
- `scores`

## API

- `GET /api/client/exams`
- `POST /api/client/exams/:examId/sessions`
- `GET /api/client/sessions/:sessionId`
- `GET /api/client/sessions/:sessionId/paper`
- `POST /api/client/sessions/:sessionId/heartbeat`
- `GET /api/client/sessions/:sessionId/answers`
- `PUT /api/client/sessions/:sessionId/answers/:questionSnapshotId`
- `POST /api/client/sessions/:sessionId/autosave`
- `POST /api/client/sessions/:sessionId/submit`
- `GET /api/client/sessions/:sessionId/result`
- `GET /api/admin/exams/:examId/scores`
- `GET /api/admin/sessions/:sessionId/score`

## 页面/客户端

- Desktop 考试列表
- Desktop 开考/续考流程
- Desktop 考试主壳
- Desktop 题目导航
- Desktop 作答区
- Desktop 自动保存状态
- Desktop 交卷确认
- Desktop 结果摘要
- Admin 成绩列表
- Admin 成绩详情

## 实现备注

- session 状态至少包括 `NOT_STARTED`、`ONGOING`、`SUBMITTED`、`EXPIRED`、`CANCELLED`
- 剩余时间以后端为准
- 客观题评分必须基于 snapshot，不读 source question
- MVP 可暂缓主观题人工评分
