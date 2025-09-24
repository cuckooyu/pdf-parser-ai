/**
 * 主应用组件 - 展示axios封装系统的使用示例
 */

import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import ApiExamples from './components/ApiExamples';
import AuthExamples from './components/AuthExamples';
import PdfExamples from './components/PdfExamples';
import './App.css';

function App() {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('auth');
  
  if (isLoading) {
    return (
      <div className="app">
        <div className="loading-container">
          <div className="loading"></div>
          <p>初始化应用中...</p>
        </div>
      </div>
    );
  }
  
  const tabs = [
    { id: 'auth', label: '认证示例', component: AuthExamples },
    { id: 'api', label: 'API调用示例', component: ApiExamples },
    { id: 'pdf', label: 'PDF处理示例', component: PdfExamples }
  ];
  
  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;
  
  return (
    <div className="app">
      <header className="app-header">
        <h1>PDF Parser AI - 企业级Axios封装示例</h1>
        <p className="subtitle">
          展示模块化API管理、请求拦截、错误处理、React Hooks集成等功能
        </p>
      </header>
      
      <nav className="tab-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      
      <main className="main-content">
        <div className="container">
          {/* 认证状态指示器 */}
          <div className="auth-status">
            <span className={`status-indicator ${isAuthenticated ? 'authenticated' : 'unauthenticated'}`}>
              {isAuthenticated ? '已登录' : '未登录'}
            </span>
          </div>
          
          {/* 活动组件 */}
          {ActiveComponent && <ActiveComponent />}
        </div>
      </main>
      
      <footer className="app-footer">
        <div className="container">
          <p>
            这是一个完整的企业级axios封装解决方案示例，包含：
          </p>
          <ul>
            <li>✅ 模块化API管理</li>
            <li>✅ 请求/响应拦截器</li>
            <li>✅ 统一错误处理</li>
            <li>✅ Token自动刷新</li>
            <li>✅ React Hooks集成</li>
            <li>✅ 文件上传/下载</li>
            <li>✅ 请求取消和重试</li>
            <li>✅ 日志系统</li>
          </ul>
        </div>
      </footer>
    </div>
  );
}

export default App;