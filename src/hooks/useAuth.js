/**
 * 认证相关React Hook
 */

import { useState, useEffect, useCallback, useContext, createContext } from 'react';
import authAPI from '../api/modules/auth';
import { tokenStorage, userStorage } from '../utils/storage';
import logger from '../utils/logger';

/**
 * 认证上下文
 */
const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: () => {},
  logout: () => {},
  register: () => {},
  refreshToken: () => {},
  clearAuth: () => {}
});

/**
 * 认证Provider组件
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  
  /**
   * 初始化认证状态
   */
  const initializeAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // 检查本地存储的认证信息
      const storedUser = userStorage.get();
      const { token } = tokenStorage.get();
      
      if (token && storedUser) {
        // 验证token有效性（可选：调用API验证）
        try {
          // 可以调用一个验证endpoint来确认token是否仍然有效
          // const profileData = await authAPI.getProfile();
          // setUser(profileData);
          
          // 暂时使用存储的用户信息
          setUser(storedUser);
          setIsAuthenticated(true);
          
          logger.info('Auth initialized from storage', { userId: storedUser.id });
        } catch (error) {
          // token无效，清除认证信息
          logger.warn('Stored token is invalid, clearing auth', error);
          await clearAuth();
        }
      }
    } catch (error) {
      logger.error('Auth initialization failed', error);
      await clearAuth();
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);
  
  /**
   * 登录
   */
  const login = useCallback(async (email, password, rememberMe = false) => {
    try {
      setIsLoading(true);
      
      const result = await authAPI.login(email, password, rememberMe);
      const { user: userData, token, refreshToken } = result;
      
      setUser(userData);
      setIsAuthenticated(true);
      
      logger.user('login_success_hook', { userId: userData.id });
      
      return result;
    } catch (error) {
      logger.user('login_failed_hook', { email, error: error.message });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * 注册
   */
  const register = useCallback(async (userData) => {
    try {
      setIsLoading(true);
      
      const result = await authAPI.register(userData);
      
      logger.user('register_success_hook', { email: userData.email });
      
      return result;
    } catch (error) {
      logger.user('register_failed_hook', { 
        email: userData.email, 
        error: error.message 
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * 登出
   */
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      
      await authAPI.logout();
      
      setUser(null);
      setIsAuthenticated(false);
      
      logger.user('logout_success_hook');
      
      // 触发全局登出事件
      window.dispatchEvent(new CustomEvent('auth:logout'));
      
    } catch (error) {
      // 即使服务端登出失败，也要清除本地状态
      setUser(null);
      setIsAuthenticated(false);
      
      logger.user('logout_error_hook', { error: error.message });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * 刷新Token
   */
  const refreshToken = useCallback(async () => {
    try {
      const result = await authAPI.refreshToken();
      
      logger.user('token_refresh_success_hook');
      
      return result;
    } catch (error) {
      // 刷新失败，清除认证状态
      setUser(null);
      setIsAuthenticated(false);
      
      logger.user('token_refresh_failed_hook', { error: error.message });
      
      throw error;
    }
  }, []);
  
  /**
   * 清除认证信息
   */
  const clearAuth = useCallback(async () => {
    try {
      authAPI.clearAuth();
      setUser(null);
      setIsAuthenticated(false);
      
      logger.user('auth_cleared_hook');
    } catch (error) {
      logger.error('Clear auth failed', error);
    }
  }, []);
  
  /**
   * 更新用户信息
   */
  const updateUser = useCallback((userData) => {
    setUser(prevUser => {
      const updatedUser = { ...prevUser, ...userData };
      userStorage.set(updatedUser);
      return updatedUser;
    });
  }, []);
  
  // 监听全局登出事件
  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      setIsAuthenticated(false);
    };
    
    window.addEventListener('auth:logout', handleLogout);
    
    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, []);
  
  // 初始化认证状态
  useEffect(() => {
    if (!isInitialized) {
      initializeAuth();
    }
  }, [initializeAuth, isInitialized]);
  
  // 自动刷新token（可选功能）
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const { token } = tokenStorage.get();
    if (!token) return;
    
    // 解析token获取过期时间（这里需要根据实际token格式调整）
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expTime = payload.exp * 1000;
      const currentTime = Date.now();
      const timeUntilExpiry = expTime - currentTime;
      
      // 如果token将在5分钟内过期，自动刷新
      if (timeUntilExpiry > 0 && timeUntilExpiry < 5 * 60 * 1000) {
        refreshToken().catch(error => {
          logger.warn('Auto token refresh failed', error);
        });
      }
    } catch (error) {
      // 忽略token解析错误
    }
  }, [isAuthenticated, refreshToken]);
  
  const value = {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    login,
    logout,
    register,
    refreshToken,
    clearAuth,
    updateUser
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * 使用认证Hook
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

/**
 * 权限检查Hook
 */
export const usePermission = (requiredPermissions = []) => {
  const { user, isAuthenticated } = useAuth();
  
  const hasPermission = useCallback((permissions = requiredPermissions) => {
    if (!isAuthenticated || !user) {
      return false;
    }
    
    if (!permissions.length) {
      return true;
    }
    
    const userPermissions = user.permissions || [];
    
    // 检查是否有任一权限
    return permissions.some(permission => 
      userPermissions.includes(permission) || 
      userPermissions.includes('*') // 超级管理员权限
    );
  }, [user, isAuthenticated, requiredPermissions]);
  
  const hasAllPermissions = useCallback((permissions = requiredPermissions) => {
    if (!isAuthenticated || !user) {
      return false;
    }
    
    if (!permissions.length) {
      return true;
    }
    
    const userPermissions = user.permissions || [];
    
    // 检查是否有所有权限
    return permissions.every(permission => 
      userPermissions.includes(permission) || 
      userPermissions.includes('*')
    );
  }, [user, isAuthenticated, requiredPermissions]);
  
  const hasRole = useCallback((roles = []) => {
    if (!isAuthenticated || !user) {
      return false;
    }
    
    if (!roles.length) {
      return true;
    }
    
    const userRoles = user.roles || [];
    
    return roles.some(role => userRoles.includes(role));
  }, [user, isAuthenticated]);
  
  return {
    hasPermission,
    hasAllPermissions,
    hasRole,
    user,
    isAuthenticated
  };
};

/**
 * 登录状态监听Hook
 */
export const useAuthState = () => {
  const [authState, setAuthState] = useState({
    isAuthenticated: authAPI.isAuthenticated(),
    user: authAPI.getCurrentUser()
  });
  
  useEffect(() => {
    const checkAuthState = () => {
      setAuthState({
        isAuthenticated: authAPI.isAuthenticated(),
        user: authAPI.getCurrentUser()
      });
    };
    
    // 监听认证状态变化
    window.addEventListener('auth:login', checkAuthState);
    window.addEventListener('auth:logout', checkAuthState);
    window.addEventListener('auth:refresh', checkAuthState);
    
    return () => {
      window.removeEventListener('auth:login', checkAuthState);
      window.removeEventListener('auth:logout', checkAuthState);
      window.removeEventListener('auth:refresh', checkAuthState);
    };
  }, []);
  
  return authState;
};

export default useAuth;