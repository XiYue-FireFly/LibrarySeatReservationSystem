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
