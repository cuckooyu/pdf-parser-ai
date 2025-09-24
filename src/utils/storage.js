/**
 * 本地存储管理工具
 */

import { STORAGE_KEYS } from '../config/constants';

class StorageManager {
  /**
   * 设置存储项
   * @param {string} key 键名
   * @param {any} value 值
   * @param {Object} options 选项
   * @param {boolean} options.encrypt 是否加密
   * @param {number} options.expires 过期时间（毫秒）
   */
  setItem(key, value, options = {}) {
    try {
      const { encrypt = false, expires } = options;
      
      let data = {
        value,
        timestamp: Date.now()
      };
      
      if (expires) {
        data.expires = Date.now() + expires;
      }
      
      let serializedData = JSON.stringify(data);
      
      if (encrypt) {
        serializedData = this._encrypt(serializedData);
      }
      
      localStorage.setItem(key, serializedData);
      return true;
    } catch (error) {
      console.error('Storage setItem error:', error);
      return false;
    }
  }
  
  /**
   * 获取存储项
   * @param {string} key 键名
   * @param {any} defaultValue 默认值
   * @param {Object} options 选项
   * @param {boolean} options.decrypt 是否解密
   */
  getItem(key, defaultValue = null, options = {}) {
    try {
      const { decrypt = false } = options;
      let serializedData = localStorage.getItem(key);
      
      if (!serializedData) {
        return defaultValue;
      }
      
      if (decrypt) {
        serializedData = this._decrypt(serializedData);
      }
      
      const data = JSON.parse(serializedData);
      
      // 检查是否过期
      if (data.expires && Date.now() > data.expires) {
        this.removeItem(key);
        return defaultValue;
      }
      
      return data.value;
    } catch (error) {
      console.error('Storage getItem error:', error);
      return defaultValue;
    }
  }
  
  /**
   * 移除存储项
   * @param {string} key 键名
   */
  removeItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Storage removeItem error:', error);
      return false;
    }
  }
  
  /**
   * 清空所有存储
   */
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  }
  
  /**
   * 获取所有键名
   */
  keys() {
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error('Storage keys error:', error);
      return [];
    }
  }
  
  /**
   * 检查存储项是否存在
   * @param {string} key 键名
   */
  hasItem(key) {
    return localStorage.getItem(key) !== null;
  }
  
  /**
   * 获取存储大小（字节）
   */
  getSize() {
    try {
      let total = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length + key.length;
        }
      }
      return total;
    } catch (error) {
      console.error('Storage getSize error:', error);
      return 0;
    }
  }
  
  /**
   * 简单加密（仅用于演示，生产环境建议使用更安全的加密方法）
   * @param {string} text 要加密的文本
   */
  _encrypt(text) {
    return btoa(encodeURIComponent(text));
  }
  
  /**
   * 简单解密
   * @param {string} encryptedText 加密的文本
   */
  _decrypt(encryptedText) {
    return decodeURIComponent(atob(encryptedText));
  }
}

// 创建实例
const storage = new StorageManager();

// 便利方法
export const tokenStorage = {
  set: (token, refreshToken) => {
    storage.setItem(STORAGE_KEYS.TOKEN, token, { encrypt: true });
    if (refreshToken) {
      storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken, { encrypt: true });
    }
  },
  get: () => ({
    token: storage.getItem(STORAGE_KEYS.TOKEN, null, { decrypt: true }),
    refreshToken: storage.getItem(STORAGE_KEYS.REFRESH_TOKEN, null, { decrypt: true })
  }),
  clear: () => {
    storage.removeItem(STORAGE_KEYS.TOKEN);
    storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  }
};

export const userStorage = {
  set: (userInfo) => {
    storage.setItem(STORAGE_KEYS.USER_INFO, userInfo);
  },
  get: () => storage.getItem(STORAGE_KEYS.USER_INFO),
  clear: () => storage.removeItem(STORAGE_KEYS.USER_INFO)
};

export default storage;