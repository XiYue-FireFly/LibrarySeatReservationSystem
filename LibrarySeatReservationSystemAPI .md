# 实验室座位预约系统 API 文档

## 文档修订信息

| 修订版本 | 修订日期   | 修订人     | 修订说明                            |
| -------- | ---------- | ---------- | ----------------------------------- |
| V1.0     | 2026-03-12 | 系统架构组 | 初始版本，涵盖学生端/管理端全量接口 |

## 一、文档说明

1. 本 API 基于 RESTful 规范设计，所有接口均采用 JSON 格式交互，编码为 UTF-8。
2. 接口分为学生端、管理端、通用接口三类，分别对应不同基础路径。
3. 除登录/注册接口外，所有接口需携带 JWT Token 鉴权，Token 失效时间为 2 小时，可通过刷新接口续期。
4. 接口返回的 `timestamp` 为服务器毫秒级时间戳，用于客户端时间校准。

## 二、通用约定

### 1. 基础路径

| 接口类型 | 基础路径       | 访问权限                               |
| -------- | -------------- | -------------------------------------- |
| 学生端   | `/api/student` | 学生角色（STUDENT）                    |
| 管理端   | `/api/admin`   | 管理员/超级管理员（ADMIN/SUPER_ADMIN） |
| 通用接口 | `/api/common`  | 无需鉴权/所有角色                      |

### 2. 请求头规范

| 参数名           | 必选                         | 类型   | 示例值                                           | 说明                                     |
| ---------------- | ---------------------------- | ------ | ------------------------------------------------ | ---------------------------------------- |
| Authorization    | 否（登录/注册除外）          | String | `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | JWT 令牌，格式为 `Bearer + 空格 + Token` |
| Content-Type     | 是                           | String | `application/json`                               | 固定值，标识请求体为 JSON 格式           |
| Super-Admin-Auth | 否（仅超级管理员注册需携带） | String | `SA-2026-TOKEN`                                  | 超级管理员专属校验码                     |

### 3. 响应格式规范

所有接口返回统一结构体，字段说明如下：

```json
{
  "code": 200,        // 业务状态码（200 为成功）
  "msg": "操作成功",   // 提示信息（失败时为具体错误描述）
  "data": {},         // 业务数据（成功且有返回数据时非空）
  "timestamp": 1773241146472 // 服务器时间戳（毫秒）
}
```

### 4. 状态码定义

| 状态码 | 含义       | 典型场景                                                     |
| ------ | ---------- | ------------------------------------------------------------ |
| 200    | 成功       | 接口调用成功，业务逻辑完成                                   |
| 400    | 参数错误   | 请求参数格式错误、必填项缺失、值不符合规则                   |
| 401    | 未授权     | Token 缺失、过期、签名错误                                   |
| 403    | 权限不足   | 学生调用管理端接口、普通管理员调用超级管理员接口             |
| 404    | 资源不存在 | 实验室ID/座位ID/预约ID不存在                                 |
| 409    | 冲突       | 学号重复、预约时间段冲突、座位已被锁定                       |
| 429    | 频率限制   | 密码错误次数超限（5次/小时）、接口调用频率过高（100次/分钟） |
| 500    | 服务器错误 | 后端服务异常（如数据库连接失败、代码逻辑错误）               |

## 三、通用基础功能接口

### 1. 学生登录接口

#### 接口信息

- 路径：`/api/common/login/student`
- 方法：POST
- 鉴权：无需鉴权

#### 请求参数（Body）

| 参数名   | 必选 | 类型    | 规则                | 示例值        |
| -------- | ---- | ------- | ------------------- | ------------- |
| account  | 是   | String  | 学号格式（8位数字） | `20230001`    |
| password | 是   | String  | 长度≥8，含数字+字母 | `Zhangsan123` |
| remember | 否   | Boolean | -                   | `true`        |

#### 响应参数（data）

| 参数名                 | 类型    | 说明            |
| ---------------------- | ------- | --------------- |
| token                  | String  | JWT 访问令牌    |
| refreshToken           | String  | Token 刷新令牌  |
| userInfo               | Object  | 学生基础信息    |
| userInfo.id            | Long    | 学生ID          |
| userInfo.account       | String  | 学号            |
| userInfo.name          | String  | 真实姓名        |
| userInfo.userName      | String  | 自定义用户名    |
| userInfo.avatar        | String  | 头像URL         |
| userInfo.role          | String  | 固定值：STUDENT |
| userInfo.punishStatus  | Boolean | 是否处于惩罚期  |
| userInfo.bookAheadDays | Integer | 可预约提前天数  |

#### 响应示例

```json
{
  "code": 200,
  "msg": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMDAwMSIsIm5hbWUiOiJ5YW5nIiwiaWF0IjoxNzczMjQxMTQ2fQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMDAwMSIsIm5hbWUiOiJ5YW5nIiwiaWF0IjoxNzczMjQxMTQ2fQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
    "userInfo": {
      "id": 10001,
      "account": "20230001",
      "name": "张三",
      "userName": "小张",
      "avatar": "https://lab-system.com/avatar/10001.png",
      "role": "STUDENT",
      "punishStatus": false,
      "bookAheadDays": 7
    }
  },
  "timestamp": 1773241146472
}
```

#### 异常响应示例

```json
{
  "code": 400,
  "msg": "密码错误，剩余4次尝试机会",
  "data": null,
  "timestamp": 1773241146472
}
```

### 2. 管理员登录接口

#### 接口信息

- 路径：`/api/common/login/admin`
- 方法：POST
- 鉴权：无需鉴权

#### 请求参数（Body）

| 参数名   | 必选 | 类型    | 规则                | 示例值        |
| -------- | ---- | ------- | ------------------- | ------------- |
| account  | 是   | String  | 工号格式（6位数字） | `100001`      |
| password | 是   | String  | 长度≥8，含数字+字母 | `Admin123456` |
| remember | 否   | Boolean | -                   | `false`       |

#### 响应参数（data）

| 参数名            | 类型   | 说明              |
| ----------------- | ------ | ----------------- |
| token             | String | JWT 访问令牌      |
| refreshToken      | String | Token 刷新令牌    |
| userInfo          | Object | 管理员基础信息    |
| userInfo.id       | Long   | 管理员ID          |
| userInfo.account  | String | 工号              |
| userInfo.name     | String | 真实姓名          |
| userInfo.userName | String | 自定义用户名      |
| userInfo.avatar   | String | 头像URL           |
| userInfo.role     | String | ADMIN/SUPER_ADMIN |

#### 响应示例

```json
{
  "code": 200,
  "msg": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMDAwMSIsIm5hbWUiOiJhZG1pbiIsImlhdCI6MTc3MzI0MTE0Nn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMDAwMSIsIm5hbWUiOiJhZG1pbiIsImlhdCI6MTc3MzI0MTE0Nn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
    "userInfo": {
      "id": 10001,
      "account": "100001",
      "name": "管理员",
      "userName": "系统管理员",
      "avatar": "https://lab-system.com/avatar/admin.png",
      "role": "ADMIN"
    }
  },
  "timestamp": 1773241146472
}
```

### 3. Token 刷新接口

#### 接口信息

- 路径：`/api/common/refresh-token`
- 方法：POST
- 鉴权：无需鉴权

#### 请求参数（Body）

| 参数名       | 必选 | 类型   | 示例值                                    |
| ------------ | ---- | ------ | ----------------------------------------- |
| refreshToken | 是   | String | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

#### 响应示例

```json
{
  "code": 200,
  "msg": "Token刷新成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMDAwMSIsIm5hbWUiOiJ5YW5nIiwiaWF0IjoxNzczMjQxMTQ2fQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
  },
  "timestamp": 1773241146472
}
```

### 4. 账号唯一性校验接口

#### 接口信息

- 路径：`/api/common/check-account`
- 方法：GET
- 鉴权：无需鉴权

#### 请求参数（Query）

| 参数名  | 必选 | 类型   | 示例值     |
| ------- | ---- | ------ | ---------- |
| account | 是   | String | `20230001` |
| type    | 是   | String | `STUDENT`  |

#### 响应示例

```json
{
  "code": 200,
  "msg": "校验成功",
  "data": {
    "isExist": false
  },
  "timestamp": 1773241146472
}
```

## 四、学生端核心接口

### 一、预约界面相关接口

#### 1. 获取实验室列表接口

##### 接口信息

- 路径：`/api/student/lab/list`
- 方法：GET
- 鉴权：需要（学生角色）

##### 请求参数（Query）

| 参数名      | 必选 | 类型    | 示例值 |
| ----------- | ---- | ------- | ------ |
| isAvailable | 否   | Boolean | `true` |

##### 响应示例

```json
{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "list": [
      {
        "id": 1,
        "name": "计算机实验室1",
        "totalSeats": 50,
        "availableSeats": 45,
        "status": "AVAILABLE",
        "offlineReason": ""
      },
      {
        "id": 2,
        "name": "计算机实验室2",
        "totalSeats": 60,
        "availableSeats": 0,
        "status": "UNAVAILABLE",
        "offlineReason": "设备维护，预计2026-03-15恢复"
      }
    ]
  },
  "timestamp": 1773241146472
}
```

#### 2. 获取实验室座位状态接口

##### 接口信息

- 路径：`/api/student/lab/{labId}/seats/status`
- 方法：GET
- 鉴权：需要（学生角色）

##### 请求参数（Path）

| 参数名 | 必选 | 类型 | 示例值 |
| ------ | ---- | ---- | ------ |
| labId  | 是   | Long | `1`    |

##### 响应示例

```json
{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "labId": 1,
    "seatList": [
      {
        "seatId": 101,
        "seatNo": "A1",
        "status": "FREE",
        "userId": null,
        "userAvatar": "",
        "maintenanceReason": "",
        "maintenanceRestoreTime": "",
        "bookStartTime": "",
        "bookEndTime": ""
      },
      {
        "seatId": 102,
        "seatNo": "A2",
        "status": "BOOKED",
        "userId": 10001,
        "userAvatar": "",
        "maintenanceReason": "",
        "maintenanceRestoreTime": "",
        "bookStartTime": "2026-03-12 14:00",
        "bookEndTime": "2026-03-12 16:00"
      }
    ]
  },
  "timestamp": 1773241146472
}
```

#### 3. 锁定座位接口

##### 接口信息

- 路径：`/api/student/seat/lock`
- 方法：POST
- 鉴权：需要（学生角色）

##### 请求参数（Body）

| 参数名        | 必选 | 类型   | 示例值             |
| ------------- | ---- | ------ | ------------------ |
| labId         | 是   | Long   | `1`                |
| seatId        | 是   | Long   | `101`              |
| bookStartTime | 是   | String | `2026-03-12 14:00` |
| bookEndTime   | 是   | String | `2026-03-12 16:00` |

##### 响应示例

```json
{
  "code": 200,
  "msg": "座位锁定成功，1分钟内未确认将自动释放",
  "data": {
    "lockId": "LOCK20260312140010001",
    "expireTime": "2026-03-12 14:01:30"
  },
  "timestamp": 1773241146472
}
```

#### 4. 预约确认接口

##### 接口信息

- 路径：`/api/student/book/confirm`
- 方法：POST
- 鉴权：需要（学生角色）

##### 请求参数（Body）

| 参数名        | 必选 | 类型   | 示例值                  |
| ------------- | ---- | ------ | ----------------------- |
| lockId        | 是   | String | `LOCK20260312140010001` |
| labId         | 是   | Long   | `1`                     |
| seatIds       | 是   | Array  | `[101]`                 |
| bookStartTime | 是   | String | `2026-03-12 14:00`      |
| bookEndTime   | 是   | String | `2026-03-12 16:00`      |

##### 响应示例

```json
{
  "code": 200,
  "msg": "预约成功",
  "data": {
    "bookIds": [100001]
  },
  "timestamp": 1773241146472
}
```

### 二、个人中心相关接口

#### 1. 修改用户名/头像接口

##### 接口信息

- 路径：`/api/student/user/info/update`
- 方法：PUT
- 鉴权：需要（学生角色）

##### 请求参数（Body）

| 参数名   | 必选 | 类型   | 示例值                                        |
| -------- | ---- | ------ | --------------------------------------------- |
| userName | 否   | String | `新的用户名`                                  |
| avatar   | 否   | String | `https://lab-system.com/avatar/10001_new.png` |

##### 响应示例

```json
{
  "code": 200,
  "msg": "修改成功",
  "data": {
    "userName": "新的用户名",
    "avatar": "https://lab-system.com/avatar/10001_new.png"
  },
  "timestamp": 1773241146472
}
```

#### 2. 获取个人预约记录接口

##### 接口信息

- 路径：`/api/student/book/list`
- 方法：GET
- 鉴权：需要（学生角色）

##### 请求参数（Query）

| 参数名    | 必选 | 类型    | 示例值    |
| --------- | ---- | ------- | --------- |
| timeRange | 否   | String  | `7D`      |
| labId     | 否   | Long    | `1`       |
| status    | 否   | String  | `PENDING` |
| pageNum   | 是   | Integer | `1`       |
| pageSize  | 是   | Integer | `10`      |

##### 响应示例

```json
{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "total": 2,
    "list": [
      {
        "bookId": 100001,
        "labName": "计算机实验室1",
        "seatNo": "A1",
        "bookStartTime": "2026-03-12 14:00",
        "bookEndTime": "2026-03-12 16:00",
        "status": "PENDING",
        "createTime": "2026-03-11 10:00"
      }
    ]
  },
  "timestamp": 1773241146472
}
```

#### 3. 取消预约接口

##### 接口信息

- 路径：`/api/student/book/cancel`
- 方法：POST
- 鉴权：需要（学生角色）

##### 请求参数（Body）

| 参数名  | 必选 | 类型  | 示例值     |
| ------- | ---- | ----- | ---------- |
| bookIds | 是   | Array | `[100001]` |

##### 响应示例

```json
{
  "code": 200,
  "msg": "取消成功，您的可预约提前期已调整为3天",
  "data": {
    "newBookAheadDays": 3
  },
  "timestamp": 1773241146472
}
```

#### 4. 提交反馈接口

##### 接口信息

- 路径：`/api/student/feedback/submit`
- 方法：POST
- 鉴权：需要（学生角色）

##### 请求参数（Body）

| 参数名      | 必选 | 类型   | 示例值                             |
| ----------- | ---- | ------ | ---------------------------------- |
| bookId      | 是   | Long   | `100001`                           |
| labId       | 是   | Long   | `1`                                |
| seatId      | 是   | Long   | `101`                              |
| type        | 是   | String | `BROKEN`                           |
| description | 是   | String | `座位的鼠标无法使用，影响实验操作` |

##### 响应示例

```json
{
  "code": 200,
  "msg": "反馈提交成功，待管理员处理",
  "data": {
    "feedbackId": 20001
  },
  "timestamp": 1773241146472
}
```

## 五、管理端核心接口

### 一、预约管理接口

#### 1. 查看所有预约信息接口

##### 接口信息

- 路径：`/api/admin/book/list`
- 方法：GET
- 鉴权：需要（管理员/超级管理员）

##### 请求参数（Query）

| 参数名    | 必选 | 类型    | 示例值             |
| --------- | ---- | ------- | ------------------ |
| labId     | 否   | Long    | `1`                |
| startTime | 否   | String  | `2026-03-12 00:00` |
| endTime   | 否   | String  | `2026-03-12 23:59` |
| account   | 否   | String  | `20230001`         |
| status    | 否   | String  | `PENDING`          |
| pageNum   | 是   | Integer | `1`                |
| pageSize  | 是   | Integer | `10`               |

##### 响应示例

```json
{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "total": 1,
    "list": [
      {
        "bookId": 100001,
        "studentAccount": "20230001",
        "studentName": "张三",
        "studentUserName": "小张",
        "labName": "计算机实验室1",
        "seatNo": "A1",
        "bookStartTime": "2026-03-12 14:00",
        "bookEndTime": "2026-03-12 16:00",
        "status": "PENDING",
        "checkInStatus": false
      }
    ]
  },
  "timestamp": 1773241146472
}
```

#### 2. 管理员取消用户预约接口

##### 接口信息

- 路径：`/api/admin/book/cancel`
- 方法：POST
- 鉴权：需要（管理员/超级管理员）

##### 请求参数（Body）

| 参数名     | 必选 | 类型   | 示例值                     |
| ---------- | ---- | ------ | -------------------------- |
| bookId     | 是   | Long   | `100001`                   |
| reasonType | 是   | String | `MAINTENANCE`              |
| reasonDesc | 是   | String | `座位设备故障，需紧急维修` |

##### 响应示例

```json
{
  "code": 200,
  "msg": "取消成功，已发送系统通知给用户",
  "data": null,
  "timestamp": 1773241146472
}
```

### 二、实验室管理接口

#### 1. 实验室上下线接口

##### 接口信息

- 路径：`/api/admin/lab/status/update`
- 方法：PUT
- 鉴权：需要（管理员/超级管理员）

##### 请求参数（Body）

| 参数名        | 必选 | 类型    | 示例值                         |
| ------------- | ---- | ------- | ------------------------------ |
| labId         | 是   | Long    | `2`                            |
| status        | 是   | String  | `UNAVAILABLE`                  |
| offlineReason | 是   | String  | `设备维护，预计2026-03-15恢复` |
| cancelBook    | 否   | Boolean | `true`                         |

##### 响应示例

```json
{
  "code": 200,
  "msg": "实验室已下线，共取消10个预约记录",
  "data": {
    "cancelCount": 10
  },
  "timestamp": 1773241146472
}
```

### 三、座位管理接口

#### 1. 修改实验室座位数接口

##### 接口信息

- 路径：`/api/admin/lab/seats/count/update`
- 方法：PUT
- 鉴权：需要（管理员/超级管理员）

##### 请求参数（Body）

| 参数名     | 必选 | 类型    | 示例值 |
| ---------- | ---- | ------- | ------ |
| labId      | 是   | Long    | `1`    |
| totalSeats | 是   | Integer | `60`   |

##### 响应示例

```json
{
  "code": 200,
  "msg": "座位数修改成功",
  "data": null,
  "timestamp": 1773241146472
}
```

#### 2. 批量修改座位维护状态接口

##### 接口信息

- 路径：`/api/admin/seat/maintenance/update`
- 方法：PUT
- 鉴权：需要（管理员/超级管理员）

##### 请求参数（Body）

| 参数名            | 必选 | 类型   | 示例值             |
| ----------------- | ---- | ------ | ------------------ |
| seatIds           | 是   | Array  | `[101, 102]`       |
| status            | 是   | String | `MAINTENANCE`      |
| maintenanceReason | 是   | String | `座椅损坏`         |
| restoreTime       | 是   | String | `2026-03-15 10:00` |

##### 响应示例

```json
{
  "code": 200,
  "msg": "成功标记2个座位为维护中",
  "data": null,
  "timestamp": 1773241146472
}
```

### 四、反馈管理接口

#### 1. 获取所有用户反馈接口

##### 接口信息

- 路径：`/api/admin/feedback/list`
- 方法：GET
- 鉴权：需要（管理员/超级管理员）

##### 请求参数（Query）

| 参数名    | 必选 | 类型    | 示例值             |
| --------- | ---- | ------- | ------------------ |
| labId     | 否   | Long    | `1`                |
| status    | 否   | String  | `PENDING`          |
| startTime | 否   | String  | `2026-03-01 00:00` |
| endTime   | 否   | String  | `2026-03-12 23:59` |
| pageNum   | 是   | Integer | `1`                |
| pageSize  | 是   | Integer | `10`               |

##### 响应示例

```json
{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "total": 1,
    "list": [
      {
        "feedbackId": 20001,
        "studentAccount": "20230001",
        "studentName": "张三",
        "labName": "计算机实验室1",
        "seatNo": "A1",
        "type": "BROKEN",
        "description": "座位的鼠标无法使用，影响实验操作",
        "status": "PENDING",
        "adminReply": "",
        "createTime": "2026-03-11 14:00"
      }
    ]
  },
  "timestamp": 1773241146472
}
```

#### 2. 回复并更新反馈状态接口

##### 接口信息

- 路径：`/api/admin/feedback/reply`
- 方法：POST
- 鉴权：需要（管理员/超级管理员）

##### 请求参数（Body）

| 参数名       | 必选 | 类型   | 示例值                                   |
| ------------ | ---- | ------ | ---------------------------------------- |
| feedbackId   | 是   | Long   | `20001`                                  |
| status       | 是   | String | `PROCESSING`                             |
| replyContent | 是   | String | `已安排维修人员处理，预计今天18点前修复` |

##### 响应示例

```json
{
  "code": 200,
  "msg": "回复成功，反馈状态已更新为处理中",
  "data": null,
  "timestamp": 1773241146472
}
```

### 五、通知管理接口

#### 1. 发送系统通知接口

##### 接口信息

- 路径：`/api/admin/notice/send`
- 方法：POST
- 鉴权：需要（管理员/超级管理员）

##### 请求参数（Body）

| 参数名     | 必选 | 类型   | 示例值                                            |
| ---------- | ---- | ------ | ------------------------------------------------- |
| targetType | 是   | String | `LAB`                                             |
| targetIds  | 是   | Array  | `[2]`                                             |
| content    | 是   | String | `计算机实验室2因设备维护，将于2026-03-15暂停使用` |

##### 响应示例

```json
{
  "code": 200,
  "msg": "通知发送成功，共发送给50个用户",
  "data": {
    "noticeId": 30001,
    "sendCount": 50
  },
  "timestamp": 1773241146472
}
```

### 六、用户信用管理接口

#### 1. 查看用户信用记录接口

##### 接口信息

- 路径：`/api/admin/user/credit/list`
- 方法：GET
- 鉴权：需要（管理员/超级管理员）

##### 请求参数（Query）

| 参数名         | 必选 | 类型    | 示例值     |
| -------------- | ---- | ------- | ---------- |
| account        | 否   | String  | `20230001` |
| punishStatus   | 否   | Boolean | `true`     |
| cancelCountMin | 否   | Integer | `3`        |
| pageNum        | 是   | Integer | `1`        |
| pageSize       | 是   | Integer | `10`       |

##### 响应示例

```json
{
  "code": 200,
  "msg": "查询成功",
  "data": {
    "total": 1,
    "list": [
      {
        "studentId": 10001,
        "studentAccount": "20230001",
        "studentName": "张三",
        "cancelCount": 3,
        "bookAheadDays": 3,
        "punishStatus": true,
        "lastCancelTime": "2026-03-10 11:00"
      }
    ]
  },
  "timestamp": 1773241146472
}
```

#### 2. 重置用户预约提前期接口

##### 接口信息

- 路径：`/api/admin/user/credit/reset`
- 方法：POST
- 鉴权：需要（管理员/超级管理员）

##### 请求参数（Body）

| 参数名    | 必选 | 类型    | 示例值  |
| --------- | ---- | ------- | ------- |
| studentId | 是   | Long    | `10001` |
| resetDays | 是   | Integer | `7`     |

##### 响应示例

```json
{
  "code": 200,
  "msg": "重置成功，该用户可预约提前期已恢复为7天",
  "data": null,
  "timestamp": 1773241146472
}
```

## 六、接口调用示例（Postman/Curl）

### 1. 学生登录（Curl）

```bash
curl --location --request POST 'http://localhost:8080/api/common/login/student' \
--header 'Content-Type: application/json' \
--data-raw '{
    "account": "20230001",
    "password": "Zhangsan123",
    "remember": true
}'
```

### 2. 获取实验室列表（Curl）

```bash
curl --location --request GET 'http://localhost:8080/api/student/lab/list?isAvailable=true' \
--header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
--header 'Content-Type: application/json'
```

## 七、附录

### 1. 字段枚举值说明

| 枚举字段        | 枚举值      | 说明             |
| --------------- | ----------- | ---------------- |
| userInfo.role   | STUDENT     | 学生角色         |
| userInfo.role   | ADMIN       | 普通管理员       |
| userInfo.role   | SUPER_ADMIN | 超级管理员       |
| lab.status      | AVAILABLE   | 实验室可预约     |
| lab.status      | UNAVAILABLE | 实验室不可预约   |
| seat.status     | FREE        | 座位空闲         |
| seat.status     | BOOKED      | 座位已预约未签到 |
| seat.status     | OCCUPIED    | 座位已占用       |
| seat.status     | MAINTENANCE | 座位维护中       |
| book.status     | PENDING     | 预约待签到       |
| book.status     | CHECKED     | 预约已签到       |
| book.status     | FINISHED    | 预约已结束       |
| book.status     | CANCELED    | 预约已取消       |
| feedback.type   | LOST        | 遗失物品         |
| feedback.type   | BROKEN      | 座位故障         |
| feedback.type   | OTHER       | 其他问题         |
| feedback.status | PENDING     | 反馈待处理       |
| feedback.status | PROCESSING  | 反馈处理中       |
| feedback.status | SOLVED      | 反馈已解决       |

### 2. 接口调用限制

| 接口类型 | 限制规则              | 超出限制处理                    |
| -------- | --------------------- | ------------------------------- |
| 登录接口 | 密码错误≤5次/小时     | 账号锁定1小时                   |
| 所有接口 | 单IP≤100次/分钟       | 返回429状态码，提示频率限制     |
| 预约接口 | 单用户≤5个有效预约/天 | 返回403状态码，提示预约数量超限 |