# 实验室座位预约系统 - 实现方案汇总 (Implementations Archive)

本文件详细记录了项目各核心模块的技术选型与实现细节。

---

## [V3] 头像修改与用户信息查看 (2026-03-13)

### 1. 技术方案
- **姓名脱敏**: 在 `UserController` 中增加 `maskName` 方法，保留姓氏，名字转为 `*`。登录后将脱敏姓名缓存至 Redis。
- **文件清理逻辑**: 在 `updateUserInfo` 接口中，比较新旧头像 URL。若旧头像是 `/uploads/` 路径下的本地文件，则调用 `File.delete()` 物理删除。
- **座位信息弹窗**: 学生端点击 `BOOKED` 座位时，根据 `Seat` 对象中的 `bookerName` 和 `userAvatar` 渲染 Glassmorphism 弹窗。

### 2. 数据库变更
- 无（利用 `Seat` 实体的 `@TableField(exist = false)` 字段进行透传）。

---

## [V2] 本地头像上传与布局持久化 (2026-03-13)

### 1. 本地存储实现
- **接口**: `POST /api/common/upload/avatar` -> 移动 MultipartFile 至项目根目录 `uploads/avatars/`。
- **映射**: `WebConfig` 注册资源处理器，将 `/uploads/**` 路由至本地磁盘。
- **配置**: `application.yml` 设置 `servlet.multipart.max-file-size: 5MB`。

### 2. 布局同步方案
- **字段扩展**: `lab` 表新增 `cols` (int) 和 `layoutConfig` (text)。
- **同步链条**: 
    - 管理端 Dashboard `saveLayout` (PUT /admin/lab/layout)。
    - 学生端 `fetchSeats` 时获取 `layoutConfig` -> `computedRowSeats` 计算渲染数组。

---

## [V1] 管理面板与动态渲染基础 (2026-03-12)

### 1. 管理端逻辑
- **扩缩容**: 通过 `seatMapper.delete` (物理删除空闲) 和 `seatMapper.insert` 实现。
- **自动命名**: 后端遍历座位列表，依据 `labCols` 计算行列并生成 `1A` 等字符串。

### 2. 座位可视化
- **头像透传**: `StudentLabController` 在查询座位时，联表查询或从 Redis 读取当前预约人的 `userAvatar`。
- **Glassmorphism UI**: 使用 `backdrop-filter: blur` 和 `rgba` 半透明色值构建统一的前端视觉体系。
