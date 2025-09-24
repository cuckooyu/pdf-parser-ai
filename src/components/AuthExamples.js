/**
 * 认证功能示例组件
 */

import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const AuthExamples = () => {
  const { user, isAuthenticated, login, logout, register, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: 'demo@example.com',
    password: 'password123',
    name: 'Demo User',
    rememberMe: false
  });
  const [message, setMessage] = useState({ type: '', content: '' });
  const [activeForm, setActiveForm] = useState('login');
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage({ type: '', content: '' });
    
    try {
      await login(formData.email, formData.password, formData.rememberMe);
      setMessage({ type: 'success', content: '登录成功！' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        content: error.message || '登录失败，请检查邮箱和密码' 
      });
    }
  };
  
  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage({ type: '', content: '' });
    
    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      setMessage({ type: 'success', content: '注册成功！请查收验证邮件。' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        content: error.message || '注册失败，请稍后重试' 
      });
    }
  };
  
  const handleLogout = async () => {
    setMessage({ type: '', content: '' });
    
    try {
      await logout();
      setMessage({ type: 'success', content: '已成功登出' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        content: error.message || '登出失败' 
      });
    }
  };
  
  if (isAuthenticated) {
    return (
      <div className="auth-examples">
        <div className="card">
          <h2>已登录用户信息</h2>
          <div className="user-info">
            <p><strong>用户ID:</strong> {user?.id}</p>
            <p><strong>姓名:</strong> {user?.name}</p>
            <p><strong>邮箱:</strong> {user?.email}</p>
            <p><strong>注册时间:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleString() : '未知'}</p>
            {user?.avatar && (
              <div className="avatar">
                <img src={user.avatar} alt="用户头像" width="60" height="60" style={{borderRadius: '50%'}} />
              </div>
            )}
          </div>
          
          <div className="actions">
            <button 
              className="button" 
              onClick={handleLogout}
              disabled={isLoading}
            >
              {isLoading ? <span className="loading"></span> : '登出'}
            </button>
          </div>
          
          {message.content && (
            <div className={message.type === 'error' ? 'error' : 'success'}>
              {message.content}
            </div>
          )}
        </div>
        
        <div className="card">
          <h3>认证功能说明</h3>
          <ul>
            <li>✅ 自动token管理和存储</li>
            <li>✅ 请求拦截器自动添加认证头</li>
            <li>✅ Token过期自动刷新</li>
            <li>✅ 登出时清除所有认证信息</li>
            <li>✅ 页面刷新后保持登录状态</li>
            <li>✅ 全局认证状态管理</li>
          </ul>
        </div>
      </div>
    );
  }
  
  return (
    <div className="auth-examples">
      <div className="card">
        <div className="form-tabs">
          <button 
            className={`tab-button ${activeForm === 'login' ? 'active' : ''}`}
            onClick={() => setActiveForm('login')}
          >
            登录
          </button>
          <button 
            className={`tab-button ${activeForm === 'register' ? 'active' : ''}`}
            onClick={() => setActiveForm('register')}
          >
            注册
          </button>
        </div>
        
        {activeForm === 'login' ? (
          <form onSubmit={handleLogin} className="auth-form">
            <h2>用户登录</h2>
            
            <div className="form-group">
              <label>邮箱地址</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="input"
                required
              />
            </div>
            
            <div className="form-group">
              <label>密码</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="input"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                />
                记住我
              </label>
            </div>
            
            <button 
              type="submit" 
              className="button"
              disabled={isLoading}
            >
              {isLoading ? <span className="loading"></span> : '登录'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="auth-form">
            <h2>用户注册</h2>
            
            <div className="form-group">
              <label>姓名</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="input"
                required
              />
            </div>
            
            <div className="form-group">
              <label>邮箱地址</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="input"
                required
              />
            </div>
            
            <div className="form-group">
              <label>密码</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="input"
                required
                minLength="6"
              />
            </div>
            
            <button 
              type="submit" 
              className="button"
              disabled={isLoading}
            >
              {isLoading ? <span className="loading"></span> : '注册'}
            </button>
          </form>
        )}
        
        {message.content && (
          <div className={message.type === 'error' ? 'error' : 'success'}>
            {message.content}
          </div>
        )}
      </div>
      
      <div className="card">
        <h3>演示说明</h3>
        <p>这是一个模拟的认证系统演示。在实际应用中：</p>
        <ul>
          <li>登录请求会发送到真实的API端点</li>
          <li>服务器会验证凭据并返回JWT token</li>
          <li>Token会被安全存储并用于后续API调用</li>
          <li>系统会自动处理token刷新和过期</li>
        </ul>
        
        <div className="demo-credentials">
          <h4>演示凭据：</h4>
          <p>邮箱: demo@example.com</p>
          <p>密码: password123</p>
        </div>
      </div>
    </div>
  );
};

export default AuthExamples;