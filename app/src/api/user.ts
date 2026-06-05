import { http } from './request';
import { ApiBookRecord, CreateBookRequest } from '../types';

/** 获取我的预约记录 */
export function getMyBookList(): Promise<ApiBookRecord[]> {
  return http.get<ApiBookRecord[]>('/api/student/book/my');
}

/** 创建预约 */
export function createBook(records: CreateBookRequest[]): Promise<void> {
  return http.post<void>('/api/student/book/create', records);
}

/** 取消预约（传入预约ID列表） */
export function cancelBook(ids: number[]): Promise<void> {
  return http.post<void>('/api/student/book/cancel', ids);
}

/** 修改用户信息（用户名、头像） */
export function updateUserInfo(params: { userName?: string; avatar?: string }): Promise<void> {
  return http.put<void>('/api/student/user/info/update', params);
}

/** 上传头像，返回访问URL */
export async function uploadAvatar(file: File): Promise<string> {
  const token = localStorage.getItem('token');
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch('/api/common/upload/avatar', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!response.ok) throw new Error('上传失败');
  const result = await response.json();
  if (result.code !== 200) throw new Error(result.msg || '上传失败');
  return result.data as string;
}

/** 获取通知列表 */
export function getNotifications(): Promise<import('../types').ApiNotification[]> {
  return http.get<import('../types').ApiNotification[]>('/api/student/notification/my');
}

/** 标记已读 */
export function markAsRead(id: number): Promise<void> {
  return http.put<void>(`/api/student/notification/read/${id}`);
}

export function getStudentInfo(): Promise<import('../types').UserInfo> {
  return http.get<import('../types').UserInfo>('/api/student/user/info');
}

/** [ADMIN] 获取所有预约分页 */
export function getAdminBookPage(params: { current: number, size: number, account?: string, labId?: number }): Promise<any> {
  return http.get<any>('/api/admin/book/page', params);
}

/** [ADMIN] 获取扫码 Token */
export function getAdminQRToken(id: number, type: 'IN' | 'OUT'): Promise<{ token: string, bookingId: string, type: string }> {
  return http.get<{ token: string, bookingId: string, type: string }>('/api/admin/book/qr-token', { id, type });
}

/** 扫码验证（签到/签退） */
export function verifyQRToken(data: { token: string; bookingId: string; type: string }): Promise<void> {
  return http.post<void>('/api/student/book/qr-verify', data);
}
