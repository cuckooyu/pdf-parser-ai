/**
 * 统一错误处理工具
 */

import { ERROR_TYPES, HTTP_STATUS } from '../config/constants';
import logger from './logger';

/**
 * API错误类
 */
export class ApiError extends Error {
  constructor(message, type = ERROR_TYPES.UNKNOWN, status = null, data = null) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.status = status;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * 网络错误类
 */
export class NetworkError extends ApiError {
  constructor(message = '网络连接失败，请检查网络设置') {
    super(message, ERROR_TYPES.NETWORK);
    this.name = 'NetworkError';
  }
}

/**
 * 超时错误类
 */
export class TimeoutError extends ApiError {
  constructor(message = '请求超时，请稍后重试') {
    super(message, ERROR_TYPES.TIMEOUT);
    this.name = 'TimeoutError';
  }
}

/**
 * 认证错误类
 */
export class AuthError extends ApiError {
  constructor(message = '认证失败，请重新登录') {
    super(message, ERROR_TYPES.AUTH, HTTP_STATUS.UNAUTHORIZED);
    this.name = 'AuthError';
  }
}

/**
 * 验证错误类
 */
export class ValidationError extends ApiError {
  constructor(message = '数据验证失败', errors = []) {
    super(message, ERROR_TYPES.VALIDATION, HTTP_STATUS.BAD_REQUEST);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * 服务器错误类
 */
export class ServerError extends ApiError {
  constructor(message = '服务器内部错误') {
    super(message, ERROR_TYPES.SERVER, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    this.name = 'ServerError';
  }
}

/**
 * 错误处理器类
 */
class ErrorHandler {
  constructor() {
    this.errorCallbacks = [];
    this.globalErrorHandler = null;
  }
  
  /**
   * 注册错误回调
   * @param {Function} callback 错误回调函数
   */
  onError(callback) {
    if (typeof callback === 'function') {
      this.errorCallbacks.push(callback);
    }
  }
  
  /**
   * 移除错误回调
   * @param {Function} callback 要移除的回调函数
   */
  offError(callback) {
    const index = this.errorCallbacks.indexOf(callback);
    if (index > -1) {
      this.errorCallbacks.splice(index, 1);
    }
  }
  
  /**
   * 设置全局错误处理器
   * @param {Function} handler 全局错误处理函数
   */
  setGlobalErrorHandler(handler) {
    this.globalErrorHandler = handler;
  }
  
  /**
   * 处理错误
   * @param {Error} error 错误对象
   * @param {Object} context 上下文信息
   */
  handle(error, context = {}) {
    // 记录错误日志
    logger.error('Error handled', {
      error: {
        name: error.name,
        message: error.message,
        type: error.type,
        status: error.status,
        stack: error.stack
      },
      context
    });
    
    // 触发错误回调
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error, context);
      } catch (callbackError) {
        logger.error('Error in error callback', callbackError);
      }
    });
    
    // 触发全局错误处理器
    if (this.globalErrorHandler) {
      try {
        this.globalErrorHandler(error, context);
      } catch (handlerError) {
        logger.error('Error in global error handler', handlerError);
      }
    }
    
    return this._formatErrorForUser(error);
  }
  
  /**
   * 格式化用户友好的错误信息
   * @param {Error} error 错误对象
   */
  _formatErrorForUser(error) {
    const userFriendlyMessages = {
      [ERROR_TYPES.NETWORK]: '网络连接失败，请检查网络设置',
      [ERROR_TYPES.TIMEOUT]: '请求超时，请稍后重试',
      [ERROR_TYPES.AUTH]: '登录已过期，请重新登录',
      [ERROR_TYPES.VALIDATION]: '输入数据有误，请检查后重试',
      [ERROR_TYPES.SERVER]: '服务器繁忙，请稍后重试',
      [ERROR_TYPES.UNKNOWN]: '发生未知错误，请稍后重试'
    };
    
    return {
      type: error.type || ERROR_TYPES.UNKNOWN,
      message: error.message || userFriendlyMessages[error.type] || userFriendlyMessages[ERROR_TYPES.UNKNOWN],
      status: error.status,
      timestamp: error.timestamp || new Date().toISOString()
    };
  }
  
  /**
   * 从HTTP响应创建错误
   * @param {Object} response axios响应对象
   * @param {Object} request axios请求配置
   */
  createFromResponse(response, request = {}) {
    const { status, data } = response;
    const { url, method } = request;
    
    let error;
    const context = { url, method, status };
    
    switch (status) {
      case HTTP_STATUS.BAD_REQUEST:
        error = new ValidationError(
          data?.message || '请求参数错误',
          data?.errors || []
        );
        break;
        
      case HTTP_STATUS.UNAUTHORIZED:
        error = new AuthError(data?.message || '认证失败');
        break;
        
      case HTTP_STATUS.FORBIDDEN:
        error = new ApiError(
          data?.message || '权限不足',
          ERROR_TYPES.AUTH,
          status
        );
        break;
        
      case HTTP_STATUS.NOT_FOUND:
        error = new ApiError(
          data?.message || '请求的资源不存在',
          ERROR_TYPES.UNKNOWN,
          status
        );
        break;
        
      case HTTP_STATUS.INTERNAL_SERVER_ERROR:
      case HTTP_STATUS.BAD_GATEWAY:
      case HTTP_STATUS.SERVICE_UNAVAILABLE:
        error = new ServerError(data?.message || '服务器错误');
        break;
        
      default:
        if (status >= 400 && status < 500) {
          error = new ApiError(
            data?.message || '客户端请求错误',
            ERROR_TYPES.VALIDATION,
            status
          );
        } else if (status >= 500) {
          error = new ServerError(data?.message || '服务器错误');
        } else {
          error = new ApiError(
            data?.message || '未知错误',
            ERROR_TYPES.UNKNOWN,
            status
          );
        }
    }
    
    error.data = data;
    return this.handle(error, context);
  }
  
  /**
   * 从axios错误创建错误
   * @param {Object} axiosError axios错误对象
   */
  createFromAxiosError(axiosError) {
    const { response, request, message, code } = axiosError;
    
    if (response) {
      // 服务器响应了错误状态码
      return this.createFromResponse(response, request?.config);
    } else if (request) {
      // 请求已发出但没有收到响应
      if (code === 'ECONNABORTED' || message.includes('timeout')) {
        const error = new TimeoutError();
        return this.handle(error, { url: request.config?.url });
      } else {
        const error = new NetworkError();
        return this.handle(error, { url: request.config?.url });
      }
    } else {
      // 其他错误
      const error = new ApiError(message, ERROR_TYPES.UNKNOWN);
      return this.handle(error);
    }
  }
  
  /**
   * 重试逻辑
   * @param {Function} fn 要重试的函数
   * @param {number} maxRetries 最大重试次数
   * @param {number} delay 重试延迟
   */
  async retry(fn, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (i === maxRetries) {
          throw error;
        }
        
        // 某些错误不应该重试
        if (error instanceof AuthError || error instanceof ValidationError) {
          throw error;
        }
        
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        
        logger.warn(`Retrying operation (${i + 1}/${maxRetries})`, {
          error: error.message,
          delay: delay * Math.pow(2, i)
        });
      }
    }
    
    throw lastError;
  }
}

// 创建全局实例
const errorHandler = new ErrorHandler();

export default errorHandler;