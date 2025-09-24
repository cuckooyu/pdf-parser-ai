/**
 * 日志系统
 */

import { LOG_LEVELS } from '../config/constants';
import config from '../config/env';

class Logger {
  constructor() {
    this.enabled = config.ENABLE_LOGS;
    this.debugEnabled = config.ENABLE_DEBUG;
    this.logs = [];
    this.maxLogs = 1000; // 最大日志数量
  }
  
  /**
   * 记录日志
   * @param {string} level 日志级别
   * @param {string} message 消息
   * @param {Object} data 额外数据
   * @param {string} category 分类
   */
  _log(level, message, data = null, category = 'APP') {
    if (!this.enabled && level !== LOG_LEVELS.ERROR) {
      return;
    }
    
    if (level === LOG_LEVELS.DEBUG && !this.debugEnabled) {
      return;
    }
    
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      category,
      message,
      data,
      url: window.location.href,
      userAgent: navigator.userAgent
    };
    
    // 保存到内存
    this._saveToMemory(logEntry);
    
    // 控制台输出
    this._outputToConsole(logEntry);
    
    // 发送到服务器（错误级别）
    if (level === LOG_LEVELS.ERROR) {
      this._sendToServer(logEntry);
    }
  }
  
  /**
   * 保存到内存
   */
  _saveToMemory(logEntry) {
    this.logs.push(logEntry);
    
    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }
  
  /**
   * 输出到控制台
   */
  _outputToConsole(logEntry) {
    const { level, category, message, data, timestamp } = logEntry;
    const prefix = `[${timestamp}] [${category}]`;
    
    switch (level) {
      case LOG_LEVELS.ERROR:
        console.error(prefix, message, data);
        break;
      case LOG_LEVELS.WARN:
        console.warn(prefix, message, data);
        break;
      case LOG_LEVELS.INFO:
        console.info(prefix, message, data);
        break;
      case LOG_LEVELS.DEBUG:
        console.debug(prefix, message, data);
        break;
      default:
        console.log(prefix, message, data);
    }
  }
  
  /**
   * 发送到服务器
   */
  _sendToServer(logEntry) {
    if (!config.IS_PROD) {
      return;
    }
    
    try {
      // 这里可以集成 Sentry、LogRocket 等服务
      // 简单示例：发送到自定义日志接口
      fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logEntry)
      }).catch(error => {
        // 静默处理日志发送错误，避免无限循环
        console.error('Failed to send log to server:', error);
      });
    } catch (error) {
      console.error('Logger sendToServer error:', error);
    }
  }
  
  /**
   * 错误日志
   */
  error(message, data = null, category = 'APP') {
    this._log(LOG_LEVELS.ERROR, message, data, category);
  }
  
  /**
   * 警告日志
   */
  warn(message, data = null, category = 'APP') {
    this._log(LOG_LEVELS.WARN, message, data, category);
  }
  
  /**
   * 信息日志
   */
  info(message, data = null, category = 'APP') {
    this._log(LOG_LEVELS.INFO, message, data, category);
  }
  
  /**
   * 调试日志
   */
  debug(message, data = null, category = 'APP') {
    this._log(LOG_LEVELS.DEBUG, message, data, category);
  }
  
  /**
   * API请求日志
   */
  api(method, url, data = null, status = null, duration = null) {
    const message = `${method.toUpperCase()} ${url}`;
    const logData = {
      method,
      url,
      requestData: data,
      status,
      duration: duration ? `${duration}ms` : null
    };
    
    if (status >= 400) {
      this.error(message, logData, 'API');
    } else {
      this.info(message, logData, 'API');
    }
  }
  
  /**
   * 用户行为日志
   */
  user(action, data = null) {
    this.info(`User action: ${action}`, data, 'USER');
  }
  
  /**
   * 性能日志
   */
  performance(name, duration, data = null) {
    this.info(`Performance: ${name}`, { 
      duration: `${duration}ms`, 
      ...data 
    }, 'PERFORMANCE');
  }
  
  /**
   * 获取所有日志
   */
  getLogs(level = null, category = null, limit = null) {
    let filteredLogs = this.logs;
    
    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }
    
    if (category) {
      filteredLogs = filteredLogs.filter(log => log.category === category);
    }
    
    if (limit) {
      filteredLogs = filteredLogs.slice(-limit);
    }
    
    return filteredLogs;
  }
  
  /**
   * 清空日志
   */
  clearLogs() {
    this.logs = [];
  }
  
  /**
   * 导出日志
   */
  exportLogs() {
    const data = JSON.stringify(this.logs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
}

// 创建全局实例
const logger = new Logger();

// 捕获全局错误
window.addEventListener('error', (event) => {
  logger.error('Global Error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error?.stack
  }, 'GLOBAL');
});

// 捕获未处理的Promise拒绝
window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled Promise Rejection', {
    reason: event.reason
  }, 'PROMISE');
});

export default logger;