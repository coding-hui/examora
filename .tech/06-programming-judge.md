# Programming Judge

## 目标

打通编程题草稿、正式提交、异步判题、真实沙箱执行。

## 范围

- 草稿保存
- 正式提交
- 提交历史与状态查询
- worker 消费
- mock judge
- sandbox-runner 真正执行

## 数据表

- `submissions`
- `judge_tasks`
- `judge_case_results`
- `answers`

## API

- `PUT /api/client/sessions/:sessionId/programming/:questionSnapshotId/draft`
- `POST /api/client/sessions/:sessionId/programming/:questionSnapshotId/submissions`
- `GET /api/client/sessions/:sessionId/programming/:questionSnapshotId/submissions`
- `GET /api/client/submissions/:submissionId`
- `GET /api/admin/judge/tasks`
- `GET /api/admin/judge/tasks/:taskId`

## 页面/客户端

- Desktop 编程编辑器
- Desktop 提交历史面板
- Desktop 提交状态面板
- 可选 Admin judge 任务监控页

## 实现备注

- 草稿与正式提交必须分离
- worker 负责消费 Redis、拉取提交上下文、调用 sandbox-runner、回写结果
- 先实现 mock 执行，再接真实 compile/run 隔离
- sandbox 层不得访问 PostgreSQL、Redis、业务凭据
- 对考生只展示用户侧结果摘要，不暴露隐藏测试输入
