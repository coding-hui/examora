# Auth And Access

## 目标

建立管理员端和考生端的认证、鉴权与访问边界。

## 范围

- 管理员登录
- 考生登录
- API 认证中间件
- 最小 RBAC

## 数据表

- `users`
- `roles`
- `permissions`
- `user_roles`
- `role_permissions`

## API

- `GET /api/auth/me`
- `POST /api/admin/auth/login`
- `POST /api/client/auth/login`
- `POST /api/auth/logout`

## 页面/客户端

- Admin 登录页
- Desktop 考生登录页

## 实现备注

- admin 和 candidate 的登录流即使复用身份源，也要保持路由和权限边界独立
- 权限归 API 所有，前端不做权限真值判断
- MVP 先收敛在 `SUPER_ADMIN`、`TEACHER`、`PROCTOR`、`STUDENT`
