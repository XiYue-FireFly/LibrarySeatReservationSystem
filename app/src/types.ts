// ========================
// 后端 API 数据类型定义
// ========================

/** 后端统一响应结构 */
export interface ApiResponse<T = unknown> {
  code: number;
  msg: string;
  data: T;
  timestamp: number;
}

/** 用户信息（登录返回） */
export interface UserInfo {
  id: number;
  account: string;
  name: string;
  userName: string | null;
  avatar: string | null;
  role: 'STUDENT' | 'ADMIN' | 'SUPER_ADMIN';
  punishStatus: boolean;
  punishEndTime: string | null;
  bookAheadDays: number;
  violationCount: number;
}

/** 实验室（后端返回） */
export interface ApiLab {
  id: number;
  name: string;
  labImageUrl: string | null;
  managerName: string | null;
  managerEmail: string | null;
  totalSeats: number;
  status: 'AVAILABLE' | 'UNAVAILABLE';
  offlineReason: string | null;
  cols: number;
  layoutConfig: string | null;
}

/** 座位（后端返回） */
export interface ApiSeat {
  id: number;
  labId: number;
  seatNo: string;
  status: 'FREE' | 'BOOKED' | 'MAINTENANCE' | 'IN_USE';
  maintenanceReason: string | null;
  restoreTime: string | null;
  userAvatar: string | null;
  bookerId: number | null;
  bookerName: string | null;
  bookerUserName: string | null;
  bookerAccount: string | null;
  bookStartTime: string | null;
  bookEndTime: string | null;
}

/** 座位列表响应 */
export interface SeatListData {
  labId: number;
  labName: string;
  totalSeats: number;
  cols: number;
  layoutConfig: string | null;
  managerName?: string | null;
  managerEmail?: string | null;
  seats: ApiSeat[];
}

/** 预约记录（后端返回） */
export interface ApiBookRecord {
  id: number;
  userId: number;
  labId: number;
  seatId: number;
  bookStartTime: string;
  bookEndTime: string;
  status: 'PENDING' | 'CHECKED_IN' | 'FINISHED' | 'CANCELLED' | 'EXPIRED';
  cancelReason: string | null;
  createTime: string;
  updateTime: string;
  // 前端补充字段（通过查询或状态传递）
  labName?: string;
  seatNo?: string;
}

/** 创建预约请求体 */
export interface CreateBookRequest {
  labId: number;
  seatId: number;
  bookStartTime: string; // 格式: "2026-03-22 09:00:00"
  bookEndTime: string;
}

/** 反馈记录（后端返回） */
export interface ApiFeedback {
  id: number;
  userId: number;
  type: string;
  title: string;
  content: string;
  status: 'PENDING' | 'RESOLVED' | 'REJECTED';
  adminReply?: string;
  createTime: string;
  updateTime: string;
}

/** 系统通知 */
export interface ApiNotification {
  id: number;
  userId: number;
  title: string;
  content: string;
  type: 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO';
  isRead: boolean;
  createTime: string;
}

// ========================
// 前端视图层类型（保留兼容）
// ========================

/** 实验室（前端展示用） */
export interface Lab {
  id: string;
  name: string;
  status: 'available' | 'unavailable';
  totalSeats: number;
  availableSeats?: number;
  labImageUrl?: string | null;
  managerName?: string | null;
  managerEmail?: string | null;
  offlineReason?: string | null;
  cols?: number;
}

/** 预约记录（前端展示用） */
export interface Reservation {
  id: string;
  labName: string;
  seatNo: string;
  bookStartTime: string;
  bookEndTime: string;
  labId?: number;
  seatId?: number;
  status: 'PENDING' | 'CHECKED_IN' | 'FINISHED' | 'CANCELLED';
  createTime?: string;
}

/** 用户（前端） */
export interface User {
  id: string;
  name: string;
  account: string;
  userName?: string | null;
  avatar?: string | null;
  bookAheadDays?: number;
  punishStatus?: boolean;
}
