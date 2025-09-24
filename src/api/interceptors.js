/**
 * Axios拦截器配置
 */

import axios from 'axios';
import { tokenStorage } from '../utils/storage';
import errorHandler from '../utils/error-handler';
import logger from '../utils/logger';
import { AUTH_ENDPOINTS } from './endpoints';

/**
 * 请求拦截器
 */
export const setupRequestInterceptor = (axiosInstance) => {
  axiosInstance.interceptors.request.use(
    (config) => {
      const startTime = Date.now();
      config.metadata = { startTime };
      
      // 添加认证token
      const { token } = tokenStorage.get();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // 添加通用请求头
      config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json';
      config.headers['Accept'] = 'application/json';
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
      
      // 添加请求ID用于追踪
      const requestId = generateRequestId();
      config.headers['X-Request-ID'] = requestId;
      config.metadata.requestId = requestId;
      
      // 记录请求日志
      logger.api(
        config.method?.toUpperCase() || 'GET',
        config.url,
        config.data,
        null,
        null
      );
      
      logger.debug('Request sent', {
        requestId,
        method: config.method,
        url: config.url,
        headers: config.headers,
        data: config.data
      });
      
      return config;
    },
    (error) => {
      logger.error('Request interceptor error', error);
      return Promise.reject(errorHandler.createFromAxiosError(error));
    }
  );
};

/**
 * 响应拦截器
 */
export const setupResponseInterceptor = (axiosInstance) => {
  axiosInstance.interceptors.response.use(
    (response) => {
      const { config } = response;
      const duration = config.metadata ? Date.now() - config.metadata.startTime : 0;
      const requestId = config.metadata?.requestId;
      
      // 记录响应日志
      logger.api(
        config.method?.toUpperCase() || 'GET',
        config.url,
        null,
        response.status,
        duration
      );
      
      logger.debug('Response received', {
        requestId,
        status: response.status,
        duration: `${duration}ms`,
        data: response.data
      });
      
      // 处理成功响应
      return handleSuccessResponse(response);
    },
    async (error) => {
      const { config, response } = error;
      const duration = config?.metadata ? Date.now() - config.metadata.startTime : 0;
      const requestId = config?.metadata?.requestId;
      
      // 记录错误日志
      logger.api(
        config?.method?.toUpperCase() || 'GET',
        config?.url,
        null,
        response?.status,
        duration
      );
      
      logger.debug('Response error', {
        requestId,
        status: response?.status,
        duration: `${duration}ms`,
        error: error.message
      });
      
      // 处理token过期
      if (response?.status === 401 && !config?.url?.includes(AUTH_ENDPOINTS.REFRESH_TOKEN)) {
        const refreshResult = await handleTokenRefresh(axiosInstance, config);
        if (refreshResult) {
          return refreshResult;
        }
      }
      
      return Promise.reject(errorHandler.createFromAxiosError(error));
    }
  );
};

/**
 * 处理成功响应
 */
const handleSuccessResponse = (response) => {
  const { data } = response;
  
  // 标准化响应格式
  if (data && typeof data === 'object') {
    // 如果后端返回的数据已经是标准格式，直接返回
    if (data.hasOwnProperty('success') || data.hasOwnProperty('code')) {
      return response;
    }
    
    // 包装为标准格式
    response.data = {
      success: true,
      code: response.status,
      message: 'Success',
      data: data,
      timestamp: new Date().toISOString()
    };
  }
  
  return response;
};

/**
 * 处理token刷新
 */
const handleTokenRefresh = async (axiosInstance, originalConfig) => {
  try {
    const { refreshToken } = tokenStorage.get();
    
    if (!refreshToken) {
      // 没有refresh token，直接跳转到登录页
      handleLogout();
      return null;
    }
    
    logger.info('Attempting to refresh token');
    
    // 调用刷新token接口
    const response = await axiosInstance.post(AUTH_ENDPOINTS.REFRESH_TOKEN, {
      refreshToken
    });
    
    const { token: newToken, refreshToken: newRefreshToken } = response.data.data;
    
    // 保存新的token
    tokenStorage.set(newToken, newRefreshToken);
    
    logger.info('Token refreshed successfully');
    
    // 重新发送原始请求
    originalConfig.headers.Authorization = `Bearer ${newToken}`;
    return axiosInstance(originalConfig);
    
  } catch (refreshError) {
    logger.error('Token refresh failed', refreshError);
    
    // 刷新失败，清除token并跳转到登录页
    handleLogout();
    return null;
  }
};

/**
 * 处理退出登录
 */
const handleLogout = () => {
  // 清除存储的认证信息
  tokenStorage.clear();
  
  // 触发全局登出事件
  window.dispatchEvent(new CustomEvent('auth:logout'));
  
  // 如果在浏览器环境且有history，跳转到登录页
  if (typeof window !== 'undefined' && window.history) {
    window.location.href = '/login';
  }
};

/**
 * 生成请求ID
 */
const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 设置请求取消功能
 */
export const setupCancelToken = () => {
  const cancelTokens = new Map();
  
  return {
    // 为请求添加取消token
    addCancelToken: (config, key) => {
      const controller = new AbortController();
      config.signal = controller.signal;
      cancelTokens.set(key, controller);
      return config;
    },
    
    // 取消指定请求
    cancel: (key, message = 'Request canceled') => {
      const controller = cancelTokens.get(key);
      if (controller) {
        controller.abort();
        cancelTokens.delete(key);
      }
    },
    
    // 取消所有请求
    cancelAll: (message = 'All requests canceled') => {
      cancelTokens.forEach((controller, key) => {
        controller.abort();
      });
      cancelTokens.clear();
    },
    
    // 清理已完成的请求token
    cleanup: (key) => {
      cancelTokens.delete(key);
    }
  };
};