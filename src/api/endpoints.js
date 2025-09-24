/**
 * API端点管理
 */

// 认证相关端点
export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REGISTER: '/auth/register',
  REFRESH_TOKEN: '/auth/refresh',
  VERIFY_EMAIL: '/auth/verify-email',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  CHANGE_PASSWORD: '/auth/change-password'
};

// 用户相关端点
export const USER_ENDPOINTS = {
  PROFILE: '/user/profile',
  UPDATE_PROFILE: '/user/profile',
  AVATAR: '/user/avatar',
  PREFERENCES: '/user/preferences',
  DELETE_ACCOUNT: '/user/delete'
};

// PDF相关端点
export const PDF_ENDPOINTS = {
  UPLOAD: '/pdf/upload',
  PARSE: '/pdf/parse',
  LIST: '/pdf/list',
  GET: (id) => `/pdf/${id}`,
  DELETE: (id) => `/pdf/${id}`,
  DOWNLOAD: (id) => `/pdf/${id}/download`,
  EXTRACT_TEXT: (id) => `/pdf/${id}/extract-text`,
  EXTRACT_IMAGES: (id) => `/pdf/${id}/extract-images`,
  AI_ANALYZE: (id) => `/pdf/${id}/ai-analyze`
};

// 文件相关端点
export const FILE_ENDPOINTS = {
  UPLOAD: '/files/upload',
  UPLOAD_CHUNK: '/files/upload-chunk',
  MERGE_CHUNKS: '/files/merge-chunks',
  DELETE: (id) => `/files/${id}`,
  DOWNLOAD: (id) => `/files/${id}/download`,
  LIST: '/files/list'
};

// 系统相关端点
export const SYSTEM_ENDPOINTS = {
  HEALTH: '/system/health',
  INFO: '/system/info',
  LOGS: '/system/logs',
  METRICS: '/system/metrics'
};

// 通知相关端点
export const NOTIFICATION_ENDPOINTS = {
  LIST: '/notifications',
  MARK_READ: (id) => `/notifications/${id}/read`,
  MARK_ALL_READ: '/notifications/read-all',
  DELETE: (id) => `/notifications/${id}`,
  PREFERENCES: '/notifications/preferences'
};

// 构建完整URL的工具函数
export const buildUrl = (endpoint, params = {}) => {
  let url = endpoint;
  
  // 替换路径参数
  Object.keys(params).forEach(key => {
    url = url.replace(`:${key}`, params[key]);
  });
  
  return url;
};

// 构建查询字符串
export const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();
  
  Object.keys(params).forEach(key => {
    const value = params[key];
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(item => searchParams.append(key, item));
      } else {
        searchParams.append(key, value);
      }
    }
  });
  
  return searchParams.toString();
};

// 构建完整的API URL
export const buildApiUrl = (endpoint, pathParams = {}, queryParams = {}) => {
  let url = buildUrl(endpoint, pathParams);
  const queryString = buildQueryString(queryParams);
  
  if (queryString) {
    url += `?${queryString}`;
  }
  
  return url;
};