import { http } from './request';
import { ApiFeedback, ApiResponse } from '../types';

export async function submitFeedback(feedback: { title: string; content: string; type: string }): Promise<void> {
  const res = await http.post<ApiResponse<void>>('/api/student/feedback/submit', feedback);
  if (res.code !== 200) {
    throw new Error(res.msg || '提交反馈失败');
  }
}

export async function getMyFeedback(): Promise<ApiFeedback[]> {
  const res = await http.get<ApiResponse<ApiFeedback[]>>('/api/student/feedback/my');
  if (res.code !== 200) {
    throw new Error(res.msg || '获取反馈列表失败');
  }
  return res.data;
}
