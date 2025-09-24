# PDF Parser AI - 企业级Axios封装解决方案

基于Chrome内置AI的PDF解析工具，集成了完整的企业级axios封装系统。

## 🚀 功能特性

### 核心功能
- ✅ **模块化API管理** - 按业务功能划分API模块
- ✅ **统一错误处理** - 全局错误捕获和用户友好的错误提示
- ✅ **请求/响应拦截器** - 自动添加认证头、日志记录
- ✅ **Token自动刷新** - 无感知的认证状态维护
- ✅ **React Hooks集成** - 完整的Hook生态系统
- ✅ **文件上传/下载** - 支持进度显示和分块上传
- ✅ **请求取消和重试** - 智能的请求管理
- ✅ **完整的日志系统** - 开发和生产环境的日志管理

### PDF处理功能
- 📄 PDF文件上传和解析
- 🔍 全文文本提取
- 🖼️ 图片和表格提取
- 🤖 AI智能内容分析
- 📊 批量文件处理

## 🏗️ 项目结构

```
src/
├── api/                        # API层
│   ├── index.js               # axios实例配置
│   ├── interceptors.js        # 请求/响应拦截器
│   ├── endpoints.js           # API端点管理
│   └── modules/               # 业务API模块
│       ├── auth.js           # 认证相关API
│       ├── user.js           # 用户相关API
│       └── pdf.js            # PDF处理API
├── config/                    # 配置管理
│   ├── constants.js          # 应用常量
│   └── env.js                # 环境配置
├── utils/                     # 工具函数
│   ├── storage.js            # 本地存储管理
│   ├── error-handler.js      # 错误处理器
│   └── logger.js             # 日志系统
├── hooks/                     # React Hooks
│   ├── useApi.js             # API调用Hooks
│   └── useAuth.js            # 认证相关Hooks
└── components/                # React组件
    ├── AuthExamples.js       # 认证示例
    ├── ApiExamples.js        # API调用示例
    └── PdfExamples.js        # PDF处理示例
```

## 📦 安装和使用

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env` 文件：

```env
REACT_APP_API_BASE_URL=http://localhost:3001/api
REACT_APP_MOCK_API=true
NODE_ENV=development
```

### 3. 启动开发服务器

```bash
npm start
```

## 🔧 核心API使用示例

### 基础API调用

```javascript
import { useApi } from './hooks/useApi';
import userAPI from './api/modules/user';

function UserProfile() {
  const {
    data: user,
    loading,
    error,
    execute: fetchUser
  } = useApi(userAPI.getProfile, {
    onSuccess: (data) => console.log('用户数据加载成功', data),
    onError: (error) => console.error('加载失败', error)
  });

  return (
    <div>
      {loading && <div>加载中...</div>}
      {error && <div>错误: {error.message}</div>}
      {user && <div>欢迎, {user.name}!</div>}
      <button onClick={fetchUser}>刷新用户信息</button>
    </div>
  );
}
```

### 分页API调用

```javascript
import { usePaginatedApi } from './hooks/useApi';

function UserList() {
  const {
    items,
    loading,
    page,
    total,
    hasMore,
    nextPage,
    prevPage
  } = usePaginatedApi(
    ({ page, pageSize }) => api.get('/users', { page, pageSize }),
    { initialPageSize: 10 }
  );

  return (
    <div>
      {items.map(user => <div key={user.id}>{user.name}</div>)}
      <button onClick={prevPage} disabled={page === 1}>上一页</button>
      <button onClick={nextPage} disabled={!hasMore}>下一页</button>
    </div>
  );
}
```

### 文件上传

```javascript
import { api } from './api';

async function uploadFile(file) {
  try {
    const result = await api.upload('/files/upload', file, {
      onProgress: ({ percent }) => {
        console.log(`上传进度: ${percent}%`);
      },
      enableChunked: true, // 大文件分块上传
      data: { category: 'documents' }
    });
    
    console.log('上传成功:', result);
  } catch (error) {
    console.error('上传失败:', error);
  }
}
```

### 认证管理

```javascript
import { useAuth } from './hooks/useAuth';

function LoginComponent() {
  const { login, logout, user, isAuthenticated } = useAuth();

  const handleLogin = async () => {
    try {
      await login('user@example.com', 'password123');
      console.log('登录成功');
    } catch (error) {
      console.error('登录失败:', error);
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>欢迎, {user.name}!</p>
          <button onClick={logout}>登出</button>
        </div>
      ) : (
        <button onClick={handleLogin}>登录</button>
      )}
    </div>
  );
}
```

## 🛠️ 高级功能

### 错误处理

系统提供了完整的错误处理机制：

```javascript
import errorHandler from './utils/error-handler';

// 全局错误处理器
errorHandler.setGlobalErrorHandler((error, context) => {
  console.log('全局错误:', error.message);
  // 可以在这里集成错误上报服务
});

// 自定义错误处理
errorHandler.onError((error, context) => {
  if (error.type === 'AUTH_ERROR') {
    // 处理认证错误
    window.location.href = '/login';
  }
});
```

### 请求重试

```javascript
import { api } from './api';

// 自动重试机制
const result = await api.retry(
  () => api.get('/unstable-endpoint'),
  3, // 最大重试3次
  1000 // 1秒延迟
);
```

### 批量API调用

```javascript
import { useBatchApi } from './hooks/useApi';

function BatchOperations() {
  const {
    results,
    loading,
    progress,
    execute
  } = useBatchApi([
    () => api.get('/users'),
    () => api.get('/orders'),
    () => api.get('/products')
  ]);

  return (
    <div>
      <button onClick={() => execute()}>执行批量调用</button>
      {loading && <div>进度: {progress.toFixed(1)}%</div>}
      {results.map((result, index) => (
        <div key={index}>结果 {index + 1}: {JSON.stringify(result)}</div>
      ))}
    </div>
  );
}
```

### 日志系统

```javascript
import logger from './utils/logger';

// 不同级别的日志
logger.error('发生错误', { error: 'details' });
logger.warn('警告信息', { context: 'data' });
logger.info('信息日志', { action: 'user_action' });
logger.debug('调试信息', { debug: 'data' });

// API专用日志
logger.api('GET', '/users', null, 200, 150);

// 用户行为日志
logger.user('button_click', { button: 'submit' });

// 性能日志
logger.performance('page_load', 1200);
```

### 本地存储管理

```javascript
import storage, { tokenStorage, userStorage } from './utils/storage';

// 基础存储
storage.setItem('key', 'value', {
  expires: 24 * 60 * 60 * 1000, // 24小时过期
  encrypt: true // 加密存储
});

// 认证信息存储
tokenStorage.set('access_token', 'refresh_token');
const { token, refreshToken } = tokenStorage.get();

// 用户信息存储
userStorage.set({ id: 1, name: 'John' });
const user = userStorage.get();
```

## 🌍 环境配置

系统支持多环境配置：

```javascript
// config/env.js
const configs = {
  development: {
    API_BASE_URL: 'http://localhost:3001/api',
    ENABLE_LOGS: true,
    ENABLE_DEBUG: true
  },
  production: {
    API_BASE_URL: 'https://api.example.com/api',
    ENABLE_LOGS: false,
    ENABLE_DEBUG: false
  }
};
```

## 📱 响应式支持

所有组件都支持响应式设计，在移动设备上也有良好的体验。

## 🔒 安全特性

- ✅ 自动XSS防护
- ✅ CSRF保护
- ✅ 安全的Token存储
- ✅ 请求签名验证
- ✅ 敏感数据加密

## 🚀 性能优化

- ✅ 请求缓存机制
- ✅ 图片懒加载
- ✅ 代码分割
- ✅ 服务端渲染支持
- ✅ CDN资源优化

## 📊 监控和分析

系统集成了完整的监控功能：

- 📈 性能监控
- 🐛 错误追踪
- 📊 用户行为分析
- 🔍 API调用统计

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目使用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙋‍♂️ 支持

如果您有任何问题或建议，请：

1. 查看 [FAQ](docs/FAQ.md)
2. 搜索现有的 [Issues](https://github.com/cuckooyu/pdf-parser-ai/issues)
3. 创建新的 Issue

---

**注意**: 这是一个演示项目，展示了企业级axios封装的最佳实践。在生产环境中使用时，请根据实际需求进行调整和优化。
