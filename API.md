# 实验室座位预约系统 API 文档

## 修订信息

| 修订版本 | 修订日期   | 修订人     | 修订说明                                     |
| -------- | ---------- | ---------- | -------------------------------------------- |
| V1.0     | 2026-03-12 | 系统架构组 | 初始版本                                     |
| V1.1     | 2026-03-13 | Antigravity | 完善管理端座位运维、批量重命名、实验室下线等接口 |

## 一、文档说明

1. 本 API 基于 RESTful 规范设计，所有接口均采用 JSON 格式交互。
2. 接口分为学生端 (`/api/student`)、管理端 (`/api/admin`)、通用接口 (`/api/common`)。
3. 除登录/注册外，所有接口需携带 `Authorization: Bearer <token>` 鉴权。

## 二、通用基础功能接口

### 1. 登录接口
- **路径**: `/api/common/login/student` 或 `/api/common/login/admin`
- **方法**: POST
- **请求参数 (Body)**:
  | 参数名   | 必选 | 类型   | 规则                | 示例值        |
  | -------- | ---- | ------ | ------------------- | ------------- |
  | account  | 是   | String | 学号/工号           | `20230001`    |
  | password | 是   | String | 长度≥8              | `123456x`     |
- **响应示例**:
  ```json
  {
    "code": 200,
    "msg": "登录成功",
    "data": {
      "token": "eyJhbGciOi...",
      "userInfo": { "id": 1, "userName": "张三", "role": "STUDENT" }
    }
  }
  ```

---

## 三、学生端核心接口

### 1. 实验室与座位查询
- **接口**: `GET /api/student/seat/list`
- **参数**: `labId` (Long)
- **数据结构 (data.seats)**:
  | 字段名     | 类型   | 说明                 |
  | ---------- | ------ | -------------------- |
  | id         | Long   | 座位ID               |
  | seatNo     | String | 座位编号 (如 1A)     |
  | status     | String | FREE / BOOKED / MAINTENANCE |
  | userAvatar | String | 预约人头像URL (实时透传) |

### 2. 预约操作
- **确认预约**: `POST /api/student/book/confirm`
- **取消预约**: `POST /api/student/book/cancel`
  - **规则**: 仅限 `PENDING` 状态，取消后座位自动释放。

---

## 四、管理端核心接口 (运维专用)

### 1. 实验室下线 (Offline)
- **接口**: `POST /api/admin/lab/offline`
- **请求参数**:
  | 参数名        | 必选 | 类型   | 说明               |
  | ------------- | ---- | ------ | ------------------ |
  | id            | 是   | Long   | 实验室ID           |
  | offlineReason | 是   | String | 下线原因说明       |
- **响应**: 成功后自动取消该室所有预约并通知用户。

### 2. 座位批量管理 (Batch Update)
- **接口**: `PUT /api/admin/seat/status/batch`
- **请求参数**:
  | 参数名            | 必选 | 类型   | 说明                             |
  | ----------------- | ---- | ------ | -------------------------------- |
  | seatIds           | 是   | Array  | 座位ID列表                       |
  | status            | 是   | String | FREE 或 MAINTENANCE              |
  | maintenanceReason | 否   | String | 状态为 MAINTENANCE 时的说明      |

### 3. 座位扩容与缩容 (Resize)
- **接口**: `PUT /api/admin/seat/resize`
- **说明**: 调整实验室总座位数。
- **请求参数**:
  | 参数名     | 必选 | 类型 | 说明           |
  | ---------- | ---- | ---- | -------------- |
  | labId      | 是   | Long | 实验室ID       |
  | totalSeats | 是   | Int  | 目标座位总数   |

### 4. 座位命名配置 (Naming)
- **按行列批量命名**: `POST /api/admin/seat/rename-grid`
  - **参数**: `{ "labId": 1, "columns": 5 }`
  - **逻辑**: 生成 1A, 1B... 2A 样式的逻辑编号。
- **单个座位重命名**: `PUT /api/admin/seat/rename`
  - **参数**: `{ "seatId": 1, "seatNo": "VIP-01" }`

### 5. 预约记录强制取消 (Force Cancel)
- **接口**: `PUT /api/admin/book/cancel/{id}`
- **说明**: 管理员单方面取消预约。
- **请求参数 (Body)**:
  | 参数名       | 必选 | 类型   | 示例值       |
  | ------------ | ---- | ------ | ------------ |
  | cancelReason | 否   | String | 违规使用等   |

---
*文档维护：Antigravity Agentic Coding Team - 2026-03-13*
