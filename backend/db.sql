-- MySQL Init Script for Library Seat Reservation System
CREATE DATABASE IF NOT EXISTS `library_system` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `library_system`;

-- 1. 用户表 (包含管理端与学生端)
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `account` varchar(32) NOT NULL COMMENT '账号(学号/工号)',
  `password` varchar(128) NOT NULL COMMENT '密码(MD5盐值加密)',
  `name` varchar(64) NOT NULL COMMENT '真实姓名',
  `user_name` varchar(64) DEFAULT NULL COMMENT '用户名',
  `avatar` varchar(255) DEFAULT NULL COMMENT '头像URL',
  `role` varchar(32) NOT NULL DEFAULT 'STUDENT' COMMENT '角色: STUDENT, ADMIN, SUPER_ADMIN',
  `punish_status` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0正常;1受罚期禁止预约',
  `book_ahead_days` int(11) NOT NULL DEFAULT 7 COMMENT '提前预约天数限制',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_account` (`account`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 2. 实验室表
DROP TABLE IF EXISTS `lab`;
CREATE TABLE `lab` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '实验室的主键ID',
  `name` varchar(128) NOT NULL COMMENT '实验室名称',
  `lab_image_url` varchar(255) DEFAULT NULL COMMENT '实验室图片URL',
  `manager_name` varchar(100) DEFAULT NULL COMMENT '实验室负责人姓名',
  `manager_email` varchar(100) DEFAULT NULL COMMENT '实验室负责人邮箱',
  `total_seats` int(11) NOT NULL DEFAULT 0 COMMENT '总座位数',
  `status` varchar(32) NOT NULL DEFAULT 'AVAILABLE' COMMENT '状态: AVAILABLE, UNAVAILABLE',
  `offline_reason` varchar(255) DEFAULT NULL COMMENT '下线原因',
  `cols` int(11) DEFAULT 5 COMMENT '默认布局列数',
  `layout_config` varchar(255) DEFAULT NULL COMMENT '自定义布局配置',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='实验室表';

-- 3. 座位表
DROP TABLE IF EXISTS `seat`;
CREATE TABLE `seat` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '座位主键',
  `lab_id` bigint(20) NOT NULL COMMENT '所属实验室ID',
  `seat_no` varchar(32) NOT NULL COMMENT '座位号(如: A1, B2)',
  `status` varchar(32) NOT NULL DEFAULT 'FREE' COMMENT '状态: FREE, MAINTENANCE',
  `maintenance_reason` varchar(255) DEFAULT NULL COMMENT '维护原因',
  `restore_time` datetime DEFAULT NULL COMMENT '预计恢复时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_lab_seat` (`lab_id`,`seat_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='座位底层基本配置表';

-- 4. 预约记录表
DROP TABLE IF EXISTS `book_record`;
CREATE TABLE `book_record` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '预约主键ID',
  `user_id` bigint(20) NOT NULL COMMENT '预约人用户ID',
  `lab_id` bigint(20) NOT NULL COMMENT '实验室ID',
  `seat_id` bigint(20) NOT NULL COMMENT '座位ID',
  `book_start_time` datetime NOT NULL COMMENT '预约开始时间',
  `book_end_time` datetime NOT NULL COMMENT '预约结束时间',
  `status` varchar(32) NOT NULL DEFAULT 'PENDING' COMMENT '状态: PENDING(待签到), CHECKED_IN, FINISHED, CANCELLED',
  `cancel_reason` varchar(255) DEFAULT NULL COMMENT '取消原因',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '预约创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_lab_period` (`lab_id`, `book_start_time`, `book_end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='预约记录表';

-- 5. 座位反馈表
DROP TABLE IF EXISTS `feedback`;
CREATE TABLE `feedback` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '反馈记录ID',
  `book_id` bigint(20) NOT NULL COMMENT '关联预约ID',
  `user_id` bigint(20) NOT NULL COMMENT '发起用户ID',
  `lab_id` bigint(20) NOT NULL COMMENT '实验室ID',
  `seat_id` bigint(20) NOT NULL COMMENT '座位ID',
  `type` varchar(32) NOT NULL COMMENT '类型: BROKEN/LOST/OTHER',
  `description` text NOT NULL COMMENT '问题描述文字',
  `status` varchar(32) NOT NULL DEFAULT 'PENDING' COMMENT '状态: PENDING/PROCESSING/RESOLVED',
  `admin_reply` text DEFAULT NULL COMMENT '管理员回复',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发起时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户提交的反馈表';


-- 插入初始模拟数据 -------------------------------------------------------------------------
-- 明文密码为123456x，MD5值为 cb5df09477fd6fa1ca1ee5ce71f54c9a (为简单示例暂不加盐或统一使用纯MD5)
-- （注：生产环境应使用 BCrypt 或加盐 MD5。本Demo模拟全网统一MD5校验）

INSERT INTO `user` (`id`, `account`, `password`, `name`, `user_name`, `role`) VALUES 
(10001, '2409131047', 'cb5df09477fd6fa1ca1ee5ce71f54c9a', '小测学生', '测试生01', 'STUDENT'),
(88888, '240913', 'cb5df09477fd6fa1ca1ee5ce71f54c9a', '超管大佬', '最高权限', 'SUPER_ADMIN');

INSERT INTO `lab` (`id`, `name`, `total_seats`, `status`) VALUES 
(1, '计算机实验室1', 30, 'AVAILABLE'),
(2, '物理研究室', 20, 'AVAILABLE');

-- 初始化实验室1的座位 (10个模拟座位)
INSERT INTO `seat` (`id`, `lab_id`, `seat_no`, `status`) VALUES 
(101, 1, 'A1', 'FREE'), (102, 1, 'A2', 'FREE'), (103, 1, 'A3', 'FREE'), (104, 1, 'B1', 'FREE'), (105, 1, 'B2', 'FREE'),
(106, 1, 'B3', 'FREE'), (107, 1, 'C1', 'MAINTENANCE'), (108, 1, 'C2', 'FREE');

-- 初始化实验室2的座位 (5个模拟座位)
INSERT INTO `seat` (`id`, `lab_id`, `seat_no`, `status`) VALUES 
(201, 2, 'Z1', 'FREE'), (202, 2, 'Z2', 'FREE'), (203, 2, 'Z3', 'FREE');
