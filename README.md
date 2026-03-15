# 实验室座位预约系统 (Library Seat Reservation System)

本项目是一个完整的实验室座位预约管理系统，采用微服务架构开发，包含学生端和管理员端。

## 🏗 架构说明

### 技术栈
- **后端**: Spring Boot 3 + Spring Cloud (Gateway, OpenFeign) + MyBatis-Plus
- **前端**: Vue 3 + Vite + Vanilla CSS (Glassmorphism 风格)
- **数据库**: MySQL 8.0 + Redis (缓存与安全锁定)

### 微服务划分
- `library-gateway`: 统一网关，处理 JWT 鉴权与请求分发。
- `user-service`: 用户账户管理、登录安全校验、头像缓存。
- `reservation-service`: 核心业务，包含实验室管理、座位管理、预约逻辑与反馈系统。
- `library-common`: 通用工具类、公共响应对象与异常处理。

## 🚀 核心功能

### 学生端 (Student Side)
- **实时选座**: 可视化查看实验室座位状态，支持批量预约。
- **个人中心**: 预约记录分类管理 (待签到/已完成等)、一键取消预约。
- **反馈投诉**: 针对具体预约座位提交反馈，查看管理员回复。
- **视觉体验**: 实时显示已占用座位的用户头像快照。

### 管理端 (Admin Side)
- **实验室运维**: 实验室一键上下线、离线业务自动清理与用户通知。
- **座位管理**: 
  - 动态扩排（Resize）：灵活调整实验室座位总数。
  - 高级布局（Layout）：支持多列网格或完全自定义每排座位数。
  - 批量命名（Naming）：支持 1A, 1B 等规则命名或手动单座更名。
- **反馈回复**: 实时响应学生诉求。

## 🛠 快速上手

### 环境要求
- JDK 17+
- MySQL 8.0 & Redis
- Node.js 18+

### 后端启动
1. 导入项目根目录下的 `db.sql` 到 MySQL 数据库。
2. 修改各微服务的 `application.yml` 中的数据库与 Redis 连接配置。
3. 按照 `discovery-service` (如有) -> `common` -> `gateway` -> `user` -> `reservation` 的顺序启动。

### 前端启动
1. 进入 `frontend` 目录。
2. 执行 `npm install`。
3. 执行 `npm run dev` 即可访问。

---
*Created by Antigravity AI - 2026-03-13*
