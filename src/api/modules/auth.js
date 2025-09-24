/**
 * 认证相关API
 */

import { api } from '../index';
import { AUTH_ENDPOINTS } from '../endpoints';
import { tokenStorage, userStorage } from '../../utils/storage';
import logger from '../../utils/logger';

/**
 * 认证API类
 */
class AuthAPI {
  /**
   * 用户登录
   * @param {string} email 邮箱
   * @param {string} password 密码
   * @param {boolean} rememberMe 记住我
   */
  async login(email, password, rememberMe = false) {
    try {
      logger.user('login_attempt', { email });
      
      const response = await api.post(AUTH_ENDPOINTS.LOGIN, {
        email,
        password,
        rememberMe
      });
      
      const { token, refreshToken, user } = response.data;
      
      // 保存认证信息
      tokenStorage.set(token, refreshToken);
      userStorage.set(user);
      
      logger.user('login_success', { userId: user.id, email: user.email });
      
      return { token, refreshToken, user };
    } catch (error) {
      logger.user('login_failed', { email, error: error.message });
      throw error;
    }
  }
  
  /**
   * 用户注册
   * @param {Object} userData 用户数据
   */
  async register(userData) {
    try {
      logger.user('register_attempt', { email: userData.email });
      
      const response = await api.post(AUTH_ENDPOINTS.REGISTER, userData);
      
      logger.user('register_success', { email: userData.email });
      
      return response.data;
    } catch (error) {
      logger.user('register_failed', { email: userData.email, error: error.message });
      throw error;
    }
  }
  
  /**
   * 用户登出
   */
  async logout() {
    try {
      const { token } = tokenStorage.get();
      
      if (token) {
        // 调用服务端登出接口
        await api.post(AUTH_ENDPOINTS.LOGOUT);
      }
      
      // 清除本地存储
      tokenStorage.clear();
      userStorage.clear();
      
      logger.user('logout_success');
      
      return true;
    } catch (error) {
      // 即使服务端登出失败，也要清除本地存储
      tokenStorage.clear();
      userStorage.clear();
      
      logger.user('logout_error', { error: error.message });
      throw error;
    }
  }
  
  /**
   * 刷新Token
   */
  async refreshToken() {
    try {
      const { refreshToken } = tokenStorage.get();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await api.post(AUTH_ENDPOINTS.REFRESH_TOKEN, {
        refreshToken
      });
      
      const { token: newToken, refreshToken: newRefreshToken } = response.data;
      
      // 更新存储的token
      tokenStorage.set(newToken, newRefreshToken);
      
      logger.user('token_refresh_success');
      
      return { token: newToken, refreshToken: newRefreshToken };
    } catch (error) {
      logger.user('token_refresh_failed', { error: error.message });
      
      // 刷新失败，清除存储
      tokenStorage.clear();
      userStorage.clear();
      
      throw error;
    }
  }
  
  /**
   * 验证邮箱
   * @param {string} token 验证token
   */
  async verifyEmail(token) {
    try {
      const response = await api.post(AUTH_ENDPOINTS.VERIFY_EMAIL, { token });
      
      logger.user('email_verify_success');
      
      return response.data;
    } catch (error) {
      logger.user('email_verify_failed', { error: error.message });
      throw error;
    }
  }
  
  /**
   * 忘记密码
   * @param {string} email 邮箱
   */
  async forgotPassword(email) {
    try {
      const response = await api.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, { email });
      
      logger.user('forgot_password_request', { email });
      
      return response.data;
    } catch (error) {
      logger.user('forgot_password_failed', { email, error: error.message });
      throw error;
    }
  }
  
  /**
   * 重置密码
   * @param {string} token 重置token
   * @param {string} newPassword 新密码
   */
  async resetPassword(token, newPassword) {
    try {
      const response = await api.post(AUTH_ENDPOINTS.RESET_PASSWORD, {
        token,
        newPassword
      });
      
      logger.user('password_reset_success');
      
      return response.data;
    } catch (error) {
      logger.user('password_reset_failed', { error: error.message });
      throw error;
    }
  }
  
  /**
   * 修改密码
   * @param {string} currentPassword 当前密码
   * @param {string} newPassword 新密码
   */
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await api.post(AUTH_ENDPOINTS.CHANGE_PASSWORD, {
        currentPassword,
        newPassword
      });
      
      logger.user('password_change_success');
      
      return response.data;
    } catch (error) {
      logger.user('password_change_failed', { error: error.message });
      throw error;
    }
  }
  
  /**
   * 检查认证状态
   */
  isAuthenticated() {
    const { token } = tokenStorage.get();
    return !!token;
  }
  
  /**
   * 获取当前用户信息
   */
  getCurrentUser() {
    return userStorage.get();
  }
  
  /**
   * 获取当前Token
   */
  getToken() {
    const { token } = tokenStorage.get();
    return token;
  }
  
  /**
   * 清除认证信息
   */
  clearAuth() {
    tokenStorage.clear();
    userStorage.clear();
  }
}

// 创建实例
const authAPI = new AuthAPI();

export default authAPI;

// 导出便利方法
export const {
  login,
  register,
  logout,
  refreshToken,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  isAuthenticated,
  getCurrentUser,
  getToken,
  clearAuth
} = authAPI;