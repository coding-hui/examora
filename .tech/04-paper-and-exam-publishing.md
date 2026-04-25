# Paper And Exam Publishing

## 目标

实现组卷、考试创建与快照发布，冻结考试交付内容。

## 范围

- 试卷管理
- 试卷组题
- 考试创建
- 发布与取消
- snapshot 冻结

## 数据表

- `papers`
- `paper_questions`
- `exams`
- `paper_snapshots`
- `paper_question_snapshots`

## API

- `GET /api/admin/papers`
- `POST /api/admin/papers`
- `GET /api/admin/papers/:paperId`
- `PATCH /api/admin/papers/:paperId`
- `DELETE /api/admin/papers/:paperId`
- `PUT /api/admin/papers/:paperId/questions`
- `GET /api/admin/exams`
- `POST /api/admin/exams`
- `GET /api/admin/exams/:examId`
- `PATCH /api/admin/exams/:examId`
- `POST /api/admin/exams/:examId/publish`
- `POST /api/admin/exams/:examId/cancel`

## 页面/客户端

- Admin 试卷列表
- Admin 试卷编辑器
- Admin 考试列表
- Admin 考试创建/编辑页
- Admin 发布确认流程

## 实现备注

- 发布时必须冻结试卷和题目内容到 snapshot 表
- 考生端交付和发布后评分都只能读取 snapshot
- 发布后修改 source question 不得影响已发布考试
