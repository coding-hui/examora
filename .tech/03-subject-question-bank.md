# Subject And Question Bank

## 目标

完成题库基础管理能力，为组卷和发考提供可复用题目来源。

## 范围

- 科目管理
- 题目 CRUD
- 题型建模
- 编程题测试用例管理

## 数据表

- `subjects`
- `questions`
- `test_cases`

## API

- `GET /api/admin/subjects`
- `POST /api/admin/subjects`
- `GET /api/admin/subjects/:subjectId`
- `PATCH /api/admin/subjects/:subjectId`
- `DELETE /api/admin/subjects/:subjectId`
- `GET /api/admin/questions`
- `POST /api/admin/questions`
- `GET /api/admin/questions/:questionId`
- `PATCH /api/admin/questions/:questionId`
- `DELETE /api/admin/questions/:questionId`

## 页面/客户端

- Admin 科目列表
- Admin 科目新增/编辑
- Admin 题目列表
- Admin 题目新增页
- Admin 题目编辑页

## 实现备注

- 至少支持 `SINGLE_CHOICE`、`MULTIPLE_CHOICE`、`TRUE_FALSE`、`FILL_BLANK`、`PROGRAMMING`
- `answer_json` 只允许出现在 admin DTO
- 编程题公开样例和隐藏测试用例必须分离
