/**
 * 用户相关API
 */

import { api } from '../index';
import { USER_ENDPOINTS } from '../endpoints';
import { userStorage } from '../../utils/storage';
import logger from '../../utils/logger';

/**
 * 用户API类
 */
class UserAPI {
  /**
   * 获取用户资料
   */
  async getProfile() {
    try {
      const response = await api.get(USER_ENDPOINTS.PROFILE);
      
      // 更新本地存储的用户信息
      userStorage.set(response.data);
      
      logger.user('profile_fetch_success');
      
      return response.data;
    } catch (error) {
      logger.user('profile_fetch_failed', { error: error.message });
      throw error;
    }
  }
  
  /**
   * 更新用户资料
   * @param {Object} profileData 用户资料数据
   */
  async updateProfile(profileData) {
    try {
      const response = await api.put(USER_ENDPOINTS.UPDATE_PROFILE, profileData);
      
      // 更新本地存储的用户信息
      const currentUser = userStorage.get() || {};
      const updatedUser = { ...currentUser, ...response.data };
      userStorage.set(updatedUser);
      
      logger.user('profile_update_success', { 
        updatedFields: Object.keys(profileData) 
      });
      
      return response.data;
    } catch (error) {
      logger.user('profile_update_failed', { 
        error: error.message,
        fields: Object.keys(profileData)
      });
      throw error;
    }
  }
  
  /**
   * 上传用户头像
   * @param {File} avatarFile 头像文件
   * @param {Function} onProgress 上传进度回调
   */
  async uploadAvatar(avatarFile, onProgress = () => {}) {
    try {
      const response = await api.upload(USER_ENDPOINTS.AVATAR, avatarFile, {
        onProgress,
        onSuccess: (data) => {
          logger.user('avatar_upload_success', { avatarUrl: data.avatarUrl });
        },
        onError: (error) => {
          logger.user('avatar_upload_failed', { error: error.message });
        }
      });
      
      // 更新本地存储的用户信息
      const currentUser = userStorage.get() || {};
      const updatedUser = { ...currentUser, avatar: response.data.avatarUrl };
      userStorage.set(updatedUser);
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * 获用户偏好设置
   */
  async getPreferences() {
    try {
      const response = await api.get(USER_ENDPOINTS.PREFERENCES);
      
      logger.user('preferences_fetch_success');
      
      return response.data;
    } catch (error) {
      logger.user('preferences_fetch_failed', { error: error.message });
      throw error;
    }
  }
  
  /**
   * 更新用户偏好设置
   * @param {Object} preferences 偏好设置
   */
  async updatePreferences(preferences) {
    try {
      const response = await api.put(USER_ENDPOINTS.PREFERENCES, preferences);
      
      logger.user('preferences_update_success', {
        updatedKeys: Object.keys(preferences)
      });
      
      return response.data;
    } catch (error) {
      logger.user('preferences_update_failed', { 
        error: error.message,
        keys: Object.keys(preferences)
      });
      throw error;
    }
  }
  
  /**
   * 删除用户账户
   * @param {string} password 确认密码
   * @param {string} reason 删除原因
   */
  async deleteAccount(password, reason = '') {
    try {
      const response = await api.delete(USER_ENDPOINTS.DELETE_ACCOUNT, {
        data: { password, reason }
      });
      
      // 清除本地存储
      userStorage.clear();
      
      logger.user('account_delete_success', { reason });
      
      return response.data;
    } catch (error) {
      logger.user('account_delete_failed', { 
        error: error.message,
        reason 
      });
      throw error;
    }
  }
  
  /**
   * 批量更新用户信息
   * @param {Object} updates 要更新的字段
   */
  async batchUpdate(updates) {
    try {
      const promises = [];
      
      // 分别处理不同类型的更新
      if (updates.profile) {
        promises.push(this.updateProfile(updates.profile));
      }
      
      if (updates.preferences) {
        promises.push(this.updatePreferences(updates.preferences));
      }
      
      if (updates.avatar) {
        promises.push(this.uploadAvatar(updates.avatar));
      }
      
      const results = await Promise.all(promises);
      
      logger.user('batch_update_success', {
        updateTypes: Object.keys(updates)
      });
      
      return results;
    } catch (error) {
      logger.user('batch_update_failed', { 
        error: error.message,
        updateTypes: Object.keys(updates)
      });
      throw error;
    }
  }
  
  /**
   * 获取用户活动日志
   * @param {Object} params 查询参数
   */
  async getActivityLog(params = {}) {
    try {
      const response = await api.get('/user/activity-log', params);
      
      logger.user('activity_log_fetch_success');
      
      return response.data;
    } catch (error) {
      logger.user('activity_log_fetch_failed', { error: error.message });
      throw error;
    }
  }
  
  /**
   * 获取用户统计信息
   */
  async getStats() {
    try {
      const response = await api.get('/user/stats');
      
      logger.user('stats_fetch_success');
      
      return response.data;
    } catch (error) {
      logger.user('stats_fetch_failed', { error: error.message });
      throw error;
    }
  }
  
  /**
   * 检查用户名或邮箱是否可用
   * @param {string} field 字段名 (username/email)
   * @param {string} value 值
   */
  async checkAvailability(field, value) {
    try {
      const response = await api.get('/user/check-availability', {
        [field]: value
      });
      
      return response.data.available;
    } catch (error) {
      logger.user('availability_check_failed', { 
        field, 
        value,
        error: error.message 
      });
      throw error;
    }
  }
}

// 创建实例
const userAPI = new UserAPI();

export default userAPI;

// 导出便利方法
export const {
  getProfile,
  updateProfile,
  uploadAvatar,
  getPreferences,
  updatePreferences,
  deleteAccount,
  batchUpdate,
  getActivityLog,
  getStats,
  checkAvailability
} = userAPI;