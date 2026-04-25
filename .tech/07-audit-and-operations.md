# Audit And Operations

## 目标

补齐桌面审计能力与可运维基础，支持试运行。

## 范围

- 客户端事件采集
- 心跳
- 管理端审计查看
- migrations
- seed
- logs
- metrics
- tests
- CI

## 数据表

- `client_logs`
- migration metadata tables

## API

- `POST /api/client/sessions/:sessionId/events`
- `GET /api/admin/sessions/:sessionId/events`
- `GET /api/admin/exams/:examId/events`
- `GET /health`
- `GET /api/health`

## 页面/客户端

- Desktop 事件上报集成
- Admin 会话审计时间线
- Admin 考试审计列表

## 实现备注

- 事件类型先覆盖 `APP_START`、`WINDOW_BLUR`、`FULLSCREEN_EXIT`、`COPY_ATTEMPT`、`NETWORK_OFFLINE`
- 审计日志是留痕证据，不直接等于作弊判定
- 基础可观测性尽早铺底，但在主链路稳定后再深化
