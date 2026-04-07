import { http } from './request';
import { ApiLab, SeatListData } from '../types';

/** 获取实验室列表 */
export function getLabList(): Promise<ApiLab[]> {
  return http.get<ApiLab[]>('/api/student/lab/list');
}

/** 获取实验室座位状态 */
export function getSeatList(labId: number): Promise<SeatListData> {
  return http.get<SeatListData>('/api/student/seat/list', { labId });
}
