import { http } from './request';
import { UserInfo } from '../types';

interface LoginResponse {
  token: string;
  userInfo: UserInfo;
}

/** 学生登录 */
export function loginStudent(account: string, password: string): Promise<LoginResponse> {
  return http.post<LoginResponse>('/api/common/login/student', { account, password });
}

/** 学生注册
 *  POST /api/student/register
 *  字段：account(学号), password, name(真实姓名), userName(可选昵称)
 */
export function registerStudent(params: {
  account: string;
  password: string;
  name: string;
  userName?: string;
}): Promise<void> {
  return http.post<void>('/api/student/register', params);
}

/** 检查账号是否已存在 */
export function checkAccount(account: string): Promise<{ isExist: boolean }> {
  return http.get<{ isExist: boolean }>('/api/common/check-account', { account, type: 'STUDENT' });
}
