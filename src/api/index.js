/**
 * Axios实例配置和API客户端
 */

import axios from 'axios';
import config from '../config/env';
import { API_CONFIG } from '../config/constants';
import { setupRequestInterceptor, setupResponseInterceptor, setupCancelToken } from './interceptors';
import errorHandler from '../utils/error-handler';
import logger from '../utils/logger';

/**
 * 创建axios实例
 */
const createAxiosInstance = (customConfig = {}) => {
  const instance = axios.create({
    baseURL: config.API_BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    maxContentLength: API_CONFIG.MAX_CONTENT_LENGTH,
    maxBodyLength: API_CONFIG.MAX_BODY_LENGTH,
    headers: {
      'Content-Type': 'application/json',
    },
    ...customConfig
  });
  
  // 设置拦截器
  setupRequestInterceptor(instance);
  setupResponseInterceptor(instance);
  
  return instance;
};

/**
 * 主API实例
 */
export const apiClient = createAxiosInstance();

/**
 * 文件上传专用实例
 */
export const uploadClient = createAxiosInstance({
  timeout: 300000, // 5分钟超时
  headers: {
    'Content-Type': 'multipart/form-data',
  }
});

/**
 * 请求取消管理
 */
export const cancelManager = setupCancelToken();

/**
 * API客户端类
 */
class ApiClient {
  constructor(axiosInstance = apiClient) {
    this.client = axiosInstance;
    this.defaultConfig = {};
  }
  
  /**
   * 设置默认配置
   */
  setDefaultConfig(config) {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }
  
  /**
   * 合并配置
   */
  _mergeConfig(config = {}) {
    return {
      ...this.defaultConfig,
      ...config
    };
  }
  
  /**
   * GET请求
   */
  async get(url, params = {}, config = {}) {
    try {
      const response = await this.client.get(url, {
        params,
        ...this._mergeConfig(config)
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * POST请求
   */
  async post(url, data = {}, config = {}) {
    try {
      const response = await this.client.post(url, data, this._mergeConfig(config));
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * PUT请求
   */
  async put(url, data = {}, config = {}) {
    try {
      const response = await this.client.put(url, data, this._mergeConfig(config));
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * PATCH请求
   */
  async patch(url, data = {}, config = {}) {
    try {
      const response = await this.client.patch(url, data, this._mergeConfig(config));
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * DELETE请求
   */
  async delete(url, config = {}) {
    try {
      const response = await this.client.delete(url, this._mergeConfig(config));
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * 文件上传
   */
  async upload(url, file, options = {}) {
    const {
      onProgress = () => {},
      onSuccess = () => {},
      onError = () => {},
      chunkSize = 1024 * 1024, // 1MB
      enableChunked = false,
      ...config
    } = options;
    
    try {
      if (enableChunked && file.size > chunkSize) {
        return await this._uploadWithChunks(url, file, { onProgress, onSuccess, onError, chunkSize, ...config });
      } else {
        return await this._uploadDirectly(url, file, { onProgress, onSuccess, onError, ...config });
      }
    } catch (error) {
      onError(error);
      throw error;
    }
  }
  
  /**
   * 直接上传文件
   */
  async _uploadDirectly(url, file, options = {}) {
    const { onProgress, onSuccess, ...config } = options;
    
    const formData = new FormData();
    formData.append('file', file);
    
    // 添加额外字段
    if (config.data) {
      Object.keys(config.data).forEach(key => {
        formData.append(key, config.data[key]);
      });
    }
    
    try {
      const response = await uploadClient.post(url, formData, {
        ...config,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress({ loaded: progressEvent.loaded, total: progressEvent.total, percent: percentCompleted });
        }
      });
      
      onSuccess(response.data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * 分块上传文件
   */
  async _uploadWithChunks(url, file, options = {}) {
    const { onProgress, onSuccess, chunkSize, ...config } = options;
    
    const chunks = Math.ceil(file.size / chunkSize);
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    logger.info(`Starting chunked upload: ${chunks} chunks`, {
      fileName: file.name,
      fileSize: file.size,
      chunkSize,
      uploadId
    });
    
    try {
      // 上传每个分块
      for (let i = 0; i < chunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);
        
        const formData = new FormData();
        formData.append('chunk', chunk);
        formData.append('chunkIndex', i);
        formData.append('totalChunks', chunks);
        formData.append('uploadId', uploadId);
        formData.append('fileName', file.name);
        
        await uploadClient.post(`${url}/chunk`, formData, config);
        
        // 更新进度
        const progress = Math.round(((i + 1) / chunks) * 100);
        onProgress({ loaded: end, total: file.size, percent: progress });
      }
      
      // 合并分块
      const mergeResponse = await this.client.post(`${url}/merge`, {
        uploadId,
        fileName: file.name,
        totalChunks: chunks
      });
      
      onSuccess(mergeResponse.data);
      return mergeResponse.data;
      
    } catch (error) {
      logger.error('Chunked upload failed', error);
      throw error;
    }
  }
  
  /**
   * 文件下载
   */
  async download(url, filename, config = {}) {
    try {
      const response = await this.client.get(url, {
        responseType: 'blob',
        ...this._mergeConfig(config)
      });
      
      // 创建下载链接
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * 批量请求
   */
  async batch(requests) {
    try {
      const promises = requests.map(request => {
        const { method, url, data, config } = request;
        return this[method.toLowerCase()](url, data, config);
      });
      
      return await Promise.all(promises);
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * 重试请求
   */
  async retry(requestFn, maxRetries = API_CONFIG.RETRY_TIMES, delay = API_CONFIG.RETRY_DELAY) {
    return await errorHandler.retry(requestFn, maxRetries, delay);
  }
}

// 创建默认API客户端实例
export const api = new ApiClient(apiClient);

// 导出便利方法
export const { get, post, put, patch, delete: del, upload, download, batch, retry } = api;

export default api;