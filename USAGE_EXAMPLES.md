# 使用示例文档

本文档展示了如何使用企业级axios封装系统的各种功能。

## 目录

1. [基础API调用](#基础api调用)
2. [认证管理](#认证管理)
3. [分页数据处理](#分页数据处理)
4. [文件上传下载](#文件上传下载)
5. [错误处理](#错误处理)
6. [批量操作](#批量操作)
7. [PDF处理](#pdf处理)
8. [高级功能](#高级功能)

## 基础API调用

### 使用useApi Hook

```javascript
import { useApi } from './hooks/useApi';
import userAPI from './api/modules/user';

function UserProfile() {
  const {
    data: user,
    loading,
    error,
    execute: fetchUser,
    retry
  } = useApi(userAPI.getProfile, {
    immediate: true, // 组件挂载时立即执行
    onSuccess: (data) => {
      console.log('用户数据：', data);
    },
    onError: (error) => {
      console.error('加载失败：', error);
    }
  });

  if (loading) return <div>加载中...</div>;
  if (error) return (
    <div>
      <div>错误: {error.message}</div>
      <button onClick={retry}>重试</button>
    </div>
  );

  return (
    <div>
      <h2>用户资料</h2>
      <p>姓名: {user?.name}</p>
      <p>邮箱: {user?.email}</p>
      <button onClick={() => fetchUser()}>刷新</button>
    </div>
  );
}
```

### 直接API调用

```javascript
import { api } from './api';
import userAPI from './api/modules/user';

// 使用API模块
async function updateUserProfile(profileData) {
  try {
    const result = await userAPI.updateProfile(profileData);
    console.log('更新成功:', result);
  } catch (error) {
    console.error('更新失败:', error);
  }
}

// 直接使用api实例
async function fetchData() {
  try {
    const response = await api.get('/users', { page: 1, limit: 10 });
    console.log('数据:', response.data);
  } catch (error) {
    console.error('请求失败:', error);
  }
}
```

## 认证管理

### 使用useAuth Hook

```javascript
import { useAuth } from './hooks/useAuth';

function LoginComponent() {
  const { 
    user, 
    isAuthenticated, 
    login, 
    logout, 
    register,
    isLoading 
  } = useAuth();

  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(credentials.email, credentials.password, true);
      alert('登录成功!');
    } catch (error) {
      alert(`登录失败: ${error.message}`);
    }
  };

  const handleRegister = async (userData) => {
    try {
      await register(userData);
      alert('注册成功!');
    } catch (error) {
      alert(`注册失败: ${error.message}`);
    }
  };

  if (isAuthenticated) {
    return (
      <div>
        <h2>欢迎, {user.name}!</h2>
        <button onClick={logout}>登出</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        placeholder="邮箱"
        value={credentials.email}
        onChange={(e) => setCredentials({
          ...credentials,
          email: e.target.value
        })}
      />
      <input
        type="password"
        placeholder="密码"
        value={credentials.password}
        onChange={(e) => setCredentials({
          ...credentials,
          password: e.target.value
        })}
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? '登录中...' : '登录'}
      </button>
    </form>
  );
}
```

### 权限控制

```javascript
import { usePermission } from './hooks/useAuth';

function AdminPanel() {
  const { hasPermission, hasRole } = usePermission();

  if (!hasRole(['admin', 'moderator'])) {
    return <div>权限不足</div>;
  }

  return (
    <div>
      <h2>管理面板</h2>
      {hasPermission(['user:delete']) && (
        <button>删除用户</button>
      )}
      {hasPermission(['system:config']) && (
        <button>系统配置</button>
      )}
    </div>
  );
}
```

## 分页数据处理

### 使用usePaginatedApi Hook

```javascript
import { usePaginatedApi } from './hooks/useApi';

function UserList() {
  const {
    items: users,
    loading,
    error,
    page,
    pageSize,
    total,
    totalPages,
    hasMore,
    load,
    nextPage,
    prevPage,
    goToPage,
    changePageSize,
    refresh
  } = usePaginatedApi(
    ({ page, pageSize, search }) => {
      return api.get('/users', { page, pageSize, search });
    },
    {
      initialPage: 1,
      initialPageSize: 10,
      immediate: true
    }
  );

  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = () => {
    load({ search: searchTerm });
  };

  return (
    <div>
      <div className="search-bar">
        <input
          type="text"
          placeholder="搜索用户..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button onClick={handleSearch}>搜索</button>
      </div>

      {loading && <div>加载中...</div>}
      {error && <div>错误: {error.message}</div>}

      <div className="user-list">
        {users.map(user => (
          <div key={user.id} className="user-item">
            <h3>{user.name}</h3>
            <p>{user.email}</p>
          </div>
        ))}
      </div>

      <div className="pagination">
        <select 
          value={pageSize} 
          onChange={(e) => changePageSize(Number(e.target.value))}
        >
          <option value={5}>5 条/页</option>
          <option value={10}>10 条/页</option>
          <option value={20}>20 条/页</option>
        </select>

        <button onClick={prevPage} disabled={page === 1}>
          上一页
        </button>
        
        <span>第 {page} 页 / 共 {totalPages} 页 (总计 {total} 条)</span>
        
        <button onClick={nextPage} disabled={!hasMore}>
          下一页
        </button>

        <button onClick={refresh}>刷新</button>
      </div>
    </div>
  );
}
```

## 文件上传下载

### 文件上传

```javascript
import { api } from './api';

function FileUpload() {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      const result = await api.upload('/files/upload', file, {
        onProgress: ({ percent, loaded, total }) => {
          setProgress(percent);
          console.log(`上传进度: ${percent}% (${loaded}/${total})`);
        },
        onSuccess: (data) => {
          console.log('上传成功:', data);
          setUploading(false);
        },
        onError: (error) => {
          console.error('上传失败:', error);
          setUploading(false);
        },
        // 大文件启用分块上传
        enableChunked: file.size > 10 * 1024 * 1024,
        // 附加数据
        data: {
          category: 'documents',
          description: '用户上传的文档'
        }
      });
      
      alert('上传成功!');
    } catch (error) {
      alert(`上传失败: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        disabled={uploading}
      />
      
      {file && (
        <div>
          <p>文件: {file.name}</p>
          <p>大小: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
      )}

      <button onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? '上传中...' : '上传文件'}
      </button>

      {uploading && (
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          />
          <span>{progress}%</span>
        </div>
      )}
    </div>
  );
}
```

### 文件下载

```javascript
import { api } from './api';

async function downloadFile(fileId, filename) {
  try {
    await api.download(`/files/${fileId}/download`, filename);
    console.log('下载完成');
  } catch (error) {
    console.error('下载失败:', error);
  }
}

// 使用示例
function FileList({ files }) {
  return (
    <div>
      {files.map(file => (
        <div key={file.id} className="file-item">
          <span>{file.name}</span>
          <button onClick={() => downloadFile(file.id, file.name)}>
            下载
          </button>
        </div>
      ))}
    </div>
  );
}
```

## 错误处理

### 全局错误处理

```javascript
import errorHandler from './utils/error-handler';

// 设置全局错误处理器
errorHandler.setGlobalErrorHandler((error, context) => {
  console.log('全局错误:', error);
  
  // 根据错误类型执行不同操作
  switch (error.type) {
    case 'AUTH_ERROR':
      // 跳转到登录页
      window.location.href = '/login';
      break;
    case 'NETWORK_ERROR':
      // 显示网络错误提示
      showNetworkErrorToast();
      break;
    case 'SERVER_ERROR':
      // 上报服务器错误
      reportServerError(error);
      break;
  }
});

// 注册特定错误回调
errorHandler.onError((error, context) => {
  if (error.status === 429) {
    // 处理限流错误
    showRateLimitWarning();
  }
});
```

### 自定义错误处理

```javascript
import { 
  ApiError, 
  NetworkError, 
  AuthError, 
  ValidationError 
} from './utils/error-handler';

async function handleApiCall() {
  try {
    const result = await api.get('/protected-endpoint');
    return result;
  } catch (error) {
    // 根据错误类型处理
    if (error instanceof AuthError) {
      // 处理认证错误
      redirectToLogin();
    } else if (error instanceof ValidationError) {
      // 处理验证错误
      showValidationErrors(error.errors);
    } else if (error instanceof NetworkError) {
      // 处理网络错误
      showRetryOption();
    } else {
      // 处理其他错误
      showGenericError(error.message);
    }
    
    throw error; // 重新抛出错误
  }
}
```

## 批量操作

### 使用useBatchApi Hook

```javascript
import { useBatchApi } from './hooks/useApi';

function BatchOperations() {
  const userIds = ['1', '2', '3', '4', '5'];
  
  const {
    results,
    errors,
    loading,
    progress,
    completed,
    total,
    execute: executeBatch
  } = useBatchApi(
    userIds.map(id => () => api.get(`/users/${id}`)),
    {
      onSuccess: (results) => {
        console.log('所有请求成功:', results);
      },
      onPartialSuccess: (success, errors) => {
        console.log(`部分成功: ${success.length} 成功, ${errors.length} 失败`);
      },
      onError: (errors) => {
        console.error('批量操作失败:', errors);
      }
    }
  );

  return (
    <div>
      <button onClick={executeBatch} disabled={loading}>
        执行批量操作
      </button>

      {loading && (
        <div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <p>进度: {completed}/{total} ({progress.toFixed(1)}%)</p>
        </div>
      )}

      {results.length > 0 && (
        <div>
          <h3>成功结果:</h3>
          {results.map((result, index) => (
            <div key={index}>
              用户 {index + 1}: {result.name}
            </div>
          ))}
        </div>
      )}

      {errors.length > 0 && (
        <div>
          <h3>失败结果:</h3>
          {errors.map((error, index) => (
            <div key={index} className="error">
              错误 {index + 1}: {error.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 直接批量调用

```javascript
import { api } from './api';

async function batchDeleteUsers(userIds) {
  try {
    const requests = userIds.map(id => ({
      method: 'delete',
      url: `/users/${id}`
    }));
    
    const results = await api.batch(requests);
    console.log('批量删除结果:', results);
    
    return results;
  } catch (error) {
    console.error('批量删除失败:', error);
    throw error;
  }
}
```

## PDF处理

### PDF上传和处理

```javascript
import pdfAPI from './api/modules/pdf';
import { useApi } from './hooks/useApi';

function PdfProcessor() {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfId, setPdfId] = useState('');

  // PDF上传
  const {
    data: uploadResult,
    loading: uploading,
    execute: uploadPdf
  } = useApi(
    ({ file, options }) => pdfAPI.uploadPdf(file, options),
    {
      onSuccess: (data) => {
        setPdfId(data.id);
        console.log('PDF上传成功:', data);
      }
    }
  );

  // PDF解析
  const {
    data: parseResult,
    loading: parsing,
    execute: parsePdf
  } = useApi(pdfAPI.parsePdf);

  // 文本提取
  const {
    data: textResult,
    loading: extractingText,
    execute: extractText
  } = useApi(pdfAPI.extractText);

  // AI分析
  const {
    data: aiResult,
    loading: analyzingAI,
    execute: analyzeWithAI
  } = useApi(pdfAPI.analyzeWithAI);

  const handleUpload = async () => {
    if (!pdfFile) return;

    await uploadPdf({
      file: pdfFile,
      options: {
        onProgress: ({ percent }) => {
          console.log(`上传进度: ${percent}%`);
        },
        metadata: {
          category: 'analysis',
          description: 'AI分析文档'
        }
      }
    });
  };

  const handleParse = async () => {
    await parsePdf({
      pdfId,
      options: {
        extractImages: true,
        extractTables: true,
        language: 'zh-CN'
      }
    });
  };

  const handleExtractText = async () => {
    await extractText({
      pdfId,
      options: {
        pages: 'all',
        format: 'markdown'
      }
    });
  };

  const handleAIAnalysis = async () => {
    await analyzeWithAI({
      pdfId,
      options: {
        analysisType: 'comprehensive',
        language: 'zh-CN',
        customPrompt: '请分析这个文档的主要内容和关键信息'
      }
    });
  };

  return (
    <div>
      {/* 文件选择 */}
      <input
        type="file"
        accept=".pdf"
        onChange={(e) => setPdfFile(e.target.files[0])}
      />
      
      <button onClick={handleUpload} disabled={!pdfFile || uploading}>
        {uploading ? '上传中...' : '上传PDF'}
      </button>

      {/* PDF处理操作 */}
      {pdfId && (
        <div>
          <h3>PDF ID: {pdfId}</h3>
          
          <button onClick={handleParse} disabled={parsing}>
            {parsing ? '解析中...' : '解析PDF'}
          </button>
          
          <button onClick={handleExtractText} disabled={extractingText}>
            {extractingText ? '提取中...' : '提取文本'}
          </button>
          
          <button onClick={handleAIAnalysis} disabled={analyzingAI}>
            {analyzingAI ? '分析中...' : 'AI分析'}
          </button>
        </div>
      )}

      {/* 结果显示 */}
      {parseResult && (
        <div>
          <h3>解析结果:</h3>
          <p>页数: {parseResult.totalPages}</p>
          <p>标题: {parseResult.title}</p>
        </div>
      )}

      {textResult && (
        <div>
          <h3>提取的文本:</h3>
          <pre>{textResult.text.substring(0, 500)}...</pre>
        </div>
      )}

      {aiResult && (
        <div>
          <h3>AI分析结果:</h3>
          <p>{aiResult.analysis}</p>
          {aiResult.keywords && (
            <div>
              <h4>关键词:</h4>
              {aiResult.keywords.map((keyword, index) => (
                <span key={index} className="keyword-tag">
                  {keyword}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

## 高级功能

### 请求重试

```javascript
import { api } from './api';

// 自动重试
async function fetchWithRetry() {
  try {
    const result = await api.retry(
      () => api.get('/unstable-endpoint'),
      3, // 最大重试3次
      1000 // 重试延迟1秒
    );
    return result;
  } catch (error) {
    console.error('重试后仍然失败:', error);
    throw error;
  }
}

// 使用Hook的重试功能
function ComponentWithRetry() {
  const {
    data,
    loading,
    error,
    execute,
    retry
  } = useApi(
    () => api.get('/unreliable-endpoint'),
    {
      retryTimes: 3,
      retryDelay: 1000
    }
  );

  return (
    <div>
      {loading && <div>加载中...</div>}
      {error && (
        <div>
          <div>错误: {error.message}</div>
          <button onClick={retry}>重试</button>
        </div>
      )}
      {data && <div>数据: {JSON.stringify(data)}</div>}
    </div>
  );
}
```

### 请求取消

```javascript
import { cancelManager } from './api';

function CancellableRequest() {
  const [loading, setLoading] = useState(false);

  const handleRequest = async () => {
    setLoading(true);
    
    try {
      // 为请求添加取消token
      const config = cancelManager.addCancelToken({}, 'user-request');
      
      const result = await api.get('/slow-endpoint', {}, config);
      console.log('请求成功:', result);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('请求已取消');
      } else {
        console.error('请求失败:', error);
      }
    } finally {
      setLoading(false);
      cancelManager.cleanup('user-request');
    }
  };

  const handleCancel = () => {
    cancelManager.cancel('user-request', '用户取消请求');
  };

  return (
    <div>
      <button onClick={handleRequest} disabled={loading}>
        发送请求
      </button>
      {loading && (
        <button onClick={handleCancel}>
          取消请求
        </button>
      )}
    </div>
  );
}
```

### 本地存储管理

```javascript
import storage, { tokenStorage, userStorage } from './utils/storage';

// 基础存储操作
function StorageExample() {
  const saveData = () => {
    // 简单存储
    storage.setItem('user_preference', { theme: 'dark', language: 'zh-CN' });
    
    // 带过期时间的存储
    storage.setItem('temp_data', 'temporary value', {
      expires: 5 * 60 * 1000 // 5分钟后过期
    });
    
    // 加密存储
    storage.setItem('sensitive_data', 'secret information', {
      encrypt: true
    });
  };

  const loadData = () => {
    const preference = storage.getItem('user_preference');
    const tempData = storage.getItem('temp_data', 'default value');
    const sensitiveData = storage.getItem('sensitive_data', null, { decrypt: true });
    
    console.log('用户偏好:', preference);
    console.log('临时数据:', tempData);
    console.log('敏感数据:', sensitiveData);
  };

  const clearData = () => {
    storage.removeItem('user_preference');
    storage.clear(); // 清空所有存储
  };

  return (
    <div>
      <button onClick={saveData}>保存数据</button>
      <button onClick={loadData}>加载数据</button>
      <button onClick={clearData}>清空数据</button>
      
      <p>存储大小: {storage.getSize()} 字节</p>
      <p>存储项数量: {storage.keys().length}</p>
    </div>
  );
}
```

### 日志系统

```javascript
import logger from './utils/logger';

function LoggingExample() {
  const testLogging = () => {
    // 不同级别的日志
    logger.error('这是一个错误', { code: 500, details: 'Server error' });
    logger.warn('这是一个警告', { resource: 'memory', usage: '90%' });
    logger.info('这是一个信息', { action: 'user_login', userId: 123 });
    logger.debug('这是调试信息', { query: 'SELECT * FROM users' });

    // 特定类型的日志
    logger.api('GET', '/api/users', null, 200, 150);
    logger.user('button_click', { button: 'submit', page: 'login' });
    logger.performance('page_load', 1200, { page: 'dashboard' });
  };

  const exportLogs = () => {
    logger.exportLogs(); // 导出日志为JSON文件
  };

  const viewLogs = () => {
    const errorLogs = logger.getLogs('error');
    const apiLogs = logger.getLogs(null, 'API');
    const recentLogs = logger.getLogs(null, null, 100);
    
    console.log('错误日志:', errorLogs);
    console.log('API日志:', apiLogs);
    console.log('最近100条日志:', recentLogs);
  };

  return (
    <div>
      <button onClick={testLogging}>测试日志</button>
      <button onClick={exportLogs}>导出日志</button>
      <button onClick={viewLogs}>查看日志</button>
      <button onClick={() => logger.clearLogs()}>清空日志</button>
    </div>
  );
}
```

## 总结

这些示例展示了企业级axios封装系统的各种使用场景：

1. **基础功能**: API调用、认证管理、错误处理
2. **高级功能**: 分页、批量操作、文件处理、请求管理
3. **工具功能**: 日志系统、本地存储、性能监控
4. **React集成**: Hooks使用、组件状态管理、用户体验优化

通过这些示例，你可以快速上手并根据实际需求进行定制化开发。