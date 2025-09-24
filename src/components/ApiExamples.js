/**
 * API调用示例组件
 */

import React, { useState } from 'react';
import { useApi, usePaginatedApi, useBatchApi } from '../hooks/useApi';
import { api } from '../api';
import userAPI from '../api/modules/user';

const ApiExamples = () => {
  const [message, setMessage] = useState({ type: '', content: '' });
  
  // 基础API调用示例
  const {
    data: userProfile,
    loading: profileLoading,
    error: profileError,
    execute: fetchProfile,
    retry: retryProfile
  } = useApi(userAPI.getProfile, {
    onSuccess: (data) => {
      setMessage({ type: 'success', content: '用户资料加载成功！' });
    },
    onError: (error) => {
      setMessage({ type: 'error', content: `加载失败: ${error.message}` });
    }
  });
  
  // 分页API示例
  const {
    items: userList,
    loading: listLoading,
    error: listError,
    page,
    pageSize,
    total,
    hasMore,
    totalPages,
    load: loadUsers,
    nextPage,
    prevPage,
    goToPage,
    changePageSize
  } = usePaginatedApi(
    ({ page, pageSize, search = '' }) => {
      // 模拟用户列表API调用
      return api.get('/users', { page, pageSize, search });
    },
    {
      initialPage: 1,
      initialPageSize: 10,
      onSuccess: (data) => {
        setMessage({ type: 'success', content: `加载了 ${data.data.length} 条用户记录` });
      }
    }
  );
  
  // 批量API调用示例
  const batchApiCalls = [
    () => userAPI.getProfile(),
    () => userAPI.getPreferences(),
    () => userAPI.getStats()
  ];
  
  const {
    results: batchResults,
    loading: batchLoading,
    errors: batchErrors,
    progress: batchProgress,
    execute: executeBatch
  } = useBatchApi(batchApiCalls, {
    onSuccess: (results) => {
      setMessage({ 
        type: 'success', 
        content: `批量调用成功，获取了 ${results.length} 个响应` 
      });
    },
    onPartialSuccess: (success, errors) => {
      setMessage({ 
        type: 'warning', 
        content: `部分成功：${success.length} 成功，${errors.length} 失败` 
      });
    }
  });
  
  // 文件上传示例
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setUploadStatus('uploading');
    setUploadProgress(0);
    
    try {
      await api.upload('/files/upload', file, {
        onProgress: ({ percent }) => {
          setUploadProgress(percent);
        },
        onSuccess: (data) => {
          setUploadStatus('success');
          setMessage({ type: 'success', content: '文件上传成功！' });
        },
        onError: (error) => {
          setUploadStatus('error');
          setMessage({ type: 'error', content: `上传失败: ${error.message}` });
        }
      });
    } catch (error) {
      setUploadStatus('error');
      setMessage({ type: 'error', content: `上传失败: ${error.message}` });
    }
  };
  
  // 请求重试示例
  const [retryCount, setRetryCount] = useState(0);
  const handleRetryExample = async () => {
    setRetryCount(0);
    try {
      await api.retry(
        async () => {
          setRetryCount(prev => prev + 1);
          // 模拟不稳定的API调用
          if (Math.random() < 0.7) {
            throw new Error('模拟网络错误');
          }
          return { success: true, data: 'Success after retry' };
        },
        3, // 最大重试3次
        1000 // 1秒延迟
      );
      setMessage({ type: 'success', content: `重试成功！共尝试了 ${retryCount} 次` });
    } catch (error) {
      setMessage({ type: 'error', content: `重试失败: ${error.message}` });
    }
  };
  
  return (
    <div className="api-examples">
      {/* 基础API调用 */}
      <div className="card">
        <h2>基础API调用示例</h2>
        <div className="example-section">
          <button 
            className="button" 
            onClick={fetchProfile}
            disabled={profileLoading}
          >
            {profileLoading ? <span className="loading"></span> : '获取用户资料'}
          </button>
          
          {profileError && (
            <div>
              <div className="error">错误: {profileError.message}</div>
              <button className="button" onClick={retryProfile}>
                重试
              </button>
            </div>
          )}
          
          {userProfile && (
            <div className="result">
              <h4>用户资料:</h4>
              <pre>{JSON.stringify(userProfile, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
      
      {/* 分页API调用 */}
      <div className="card">
        <h2>分页API调用示例</h2>
        <div className="example-section">
          <div className="pagination-controls">
            <button 
              className="button" 
              onClick={() => loadUsers()}
              disabled={listLoading}
            >
              {listLoading ? <span className="loading"></span> : '加载用户列表'}
            </button>
            
            <select 
              value={pageSize} 
              onChange={(e) => changePageSize(Number(e.target.value))}
              disabled={listLoading}
            >
              <option value={5}>5 条/页</option>
              <option value={10}>10 条/页</option>
              <option value={20}>20 条/页</option>
            </select>
          </div>
          
          {listError && (
            <div className="error">错误: {listError.message}</div>
          )}
          
          {userList && userList.length > 0 && (
            <div className="result">
              <h4>用户列表 (第 {page} 页，共 {totalPages} 页，总计 {total} 条):</h4>
              <ul>
                {userList.map((user, index) => (
                  <li key={index}>用户 {index + 1}: {JSON.stringify(user)}</li>
                ))}
              </ul>
              
              <div className="pagination">
                <button 
                  className="button" 
                  onClick={prevPage}
                  disabled={page === 1 || listLoading}
                >
                  上一页
                </button>
                
                <span>第 {page} 页 / 共 {totalPages} 页</span>
                
                <button 
                  className="button" 
                  onClick={nextPage}
                  disabled={!hasMore || listLoading}
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 批量API调用 */}
      <div className="card">
        <h2>批量API调用示例</h2>
        <div className="example-section">
          <button 
            className="button" 
            onClick={executeBatch}
            disabled={batchLoading}
          >
            {batchLoading ? <span className="loading"></span> : '执行批量调用'}
          </button>
          
          {batchLoading && (
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${batchProgress}%` }}
                ></div>
              </div>
              <div>进度: {batchProgress.toFixed(1)}%</div>
            </div>
          )}
          
          {batchResults.length > 0 && (
            <div className="result">
              <h4>批量调用结果:</h4>
              {batchResults.map((result, index) => (
                <div key={index}>
                  <strong>调用 {index + 1}:</strong>
                  <pre>{JSON.stringify(result, null, 2)}</pre>
                </div>
              ))}
            </div>
          )}
          
          {batchErrors.length > 0 && (
            <div className="error">
              <h4>批量调用错误:</h4>
              {batchErrors.map((error, index) => (
                <div key={index}>错误 {index + 1}: {error.message}</div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* 文件上传 */}
      <div className="card">
        <h2>文件上传示例</h2>
        <div className="example-section">
          <input 
            type="file" 
            onChange={handleFileUpload}
            disabled={uploadStatus === 'uploading'}
          />
          
          {uploadStatus === 'uploading' && (
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <div>上传进度: {uploadProgress}%</div>
            </div>
          )}
          
          {uploadStatus === 'success' && (
            <div className="success">文件上传成功！</div>
          )}
          
          {uploadStatus === 'error' && (
            <div className="error">文件上传失败！</div>
          )}
        </div>
      </div>
      
      {/* 请求重试 */}
      <div className="card">
        <h2>请求重试示例</h2>
        <div className="example-section">
          <button 
            className="button" 
            onClick={handleRetryExample}
          >
            测试重试机制
          </button>
          
          {retryCount > 0 && (
            <div className="info">
              当前尝试次数: {retryCount}
            </div>
          )}
        </div>
      </div>
      
      {/* 消息显示 */}
      {message.content && (
        <div className={`message ${message.type}`}>
          {message.content}
        </div>
      )}
      
      {/* 功能说明 */}
      <div className="card">
        <h3>API封装功能特性</h3>
        <ul>
          <li>✅ 统一的请求/响应处理</li>
          <li>✅ 自动错误处理和重试机制</li>
          <li>✅ 请求和响应拦截器</li>
          <li>✅ 加载状态和错误状态管理</li>
          <li>✅ 分页数据自动处理</li>
          <li>✅ 批量API调用支持</li>
          <li>✅ 文件上传进度追踪</li>
          <li>✅ 请求取消支持</li>
          <li>✅ React Hooks深度集成</li>
        </ul>
      </div>
    </div>
  );
};

export default ApiExamples;