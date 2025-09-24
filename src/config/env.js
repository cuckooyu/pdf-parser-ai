/**
 * 环境配置管理
 */

// 环境类型
const ENV_TYPES = {
  DEVELOPMENT: 'development',
  TESTING: 'testing',
  STAGING: 'staging',
  PRODUCTION: 'production'
};

// 获取当前环境
const getCurrentEnv = () => {
  return process.env.NODE_ENV || ENV_TYPES.DEVELOPMENT;
};

// 各环境配置
const configs = {
  [ENV_TYPES.DEVELOPMENT]: {
    API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api',
    ENABLE_LOGS: true,
    ENABLE_DEBUG: true,
    MOCK_API: process.env.REACT_APP_MOCK_API === 'true',
    SENTRY_DSN: '',
    GA_TRACKING_ID: ''
  },
  
  [ENV_TYPES.TESTING]: {
    API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'https://test-api.example.com/api',
    ENABLE_LOGS: true,
    ENABLE_DEBUG: true,
    MOCK_API: false,
    SENTRY_DSN: '',
    GA_TRACKING_ID: ''
  },
  
  [ENV_TYPES.STAGING]: {
    API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'https://staging-api.example.com/api',
    ENABLE_LOGS: true,
    ENABLE_DEBUG: false,
    MOCK_API: false,
    SENTRY_DSN: process.env.REACT_APP_SENTRY_DSN || '',
    GA_TRACKING_ID: process.env.REACT_APP_GA_TRACKING_ID || ''
  },
  
  [ENV_TYPES.PRODUCTION]: {
    API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'https://api.example.com/api',
    ENABLE_LOGS: false,
    ENABLE_DEBUG: false,
    MOCK_API: false,
    SENTRY_DSN: process.env.REACT_APP_SENTRY_DSN || '',
    GA_TRACKING_ID: process.env.REACT_APP_GA_TRACKING_ID || ''
  }
};

// 获取当前环境配置
const getConfig = () => {
  const env = getCurrentEnv();
  return {
    ...configs[env],
    ENV: env,
    IS_DEV: env === ENV_TYPES.DEVELOPMENT,
    IS_TEST: env === ENV_TYPES.TESTING,
    IS_STAGING: env === ENV_TYPES.STAGING,
    IS_PROD: env === ENV_TYPES.PRODUCTION
  };
};

export default getConfig();
export { ENV_TYPES, getCurrentEnv };