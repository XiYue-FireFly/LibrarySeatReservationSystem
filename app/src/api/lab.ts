import { http } from './request';
import { ApiLab, SeatListData } from '../types';

/** 获取实验室列表 */
export function getLabList(): Promise<ApiLab[]> {
  return http.get<ApiLab[]>('/api/student/lab/list');
}

/** 获取所有实验室 (管理员用) */
export function getAllLabs(): Promise<ApiLab[]> {
  return http.get<ApiLab[]>('/api/student/lab/list');
}

/** 获取实验室座位状态 */
export function getSeatList(labId: number, startTime?: string, endTime?: string): Promise<SeatListData> {
  return http.get<SeatListData>('/api/student/seat/list', { labId, startTime, endTime });
}
