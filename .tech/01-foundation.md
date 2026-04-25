# Foundation

## 目标

完成项目基础对齐，建立可持续开发的工程底座。

## 范围

- 文档与目录命名对齐
- 环境变量、端口、依赖服务说明
- 共享类型与 API Client 基础能力

## 数据表

- 无直接新增业务表

## API

- `GET /api/auth/me`
- 为 `/api/auth/*`、`/api/admin/*`、`/api/client/*` 建立共享 DTO 边界

## 页面/客户端

- website 文档首页
- getting started
- 对外 roadmap

## 实现备注

- `packages/types` 负责 admin/candidate DTO 分离
- `packages/client` 在前端真实接 API 之前先补齐基础方法
- 清理 README、website、实际目录之间的不一致
- 明确 MinIO 是否进入 MVP
