import { ApiResponse } from '../types';

const BASE_URL = '';

/** 从 localStorage 获取 Token */
function getToken(): string | null {
  return localStorage.getItem('token');
}

/** 统一请求函数 */
async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // 尝试从响应体获取更详细的错误信息
    try {
      const errBody = await response.json();
      throw new Error(errBody.msg || errBody.message || `服务器错误 (${response.status})`);
    } catch (parseErr) {
      if (parseErr instanceof Error && parseErr.message !== `服务器错误 (${response.status})`) {
        // json 解析失败，parseErr 不是我们抛出的
        if (parseErr.message.startsWith('服务器错误') || parseErr.message !== 'Unexpected end of JSON input') {
          throw parseErr;
        }
      } else {
        throw parseErr;
      }
      throw new Error(`服务器错误 (${response.status})`);
    }
  }

  const result: ApiResponse<T> = await response.json();

  if (result.code !== 200) {
    throw new Error(result.msg || '请求失败');
  }

  return result.data;
}

export const http = {
  get<T>(url: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    let fullUrl = url;
    if (params) {
      const query = Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&');
      if (query) fullUrl += `?${query}`;
    }
    return request<T>(fullUrl, { method: 'GET' });
  },

  post<T>(url: string, body?: unknown): Promise<T> {
    return request<T>(url, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(url: string, body?: unknown): Promise<T> {
    return request<T>(url, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },
};
