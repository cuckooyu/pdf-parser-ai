/**
 * API调用React Hook
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api';
import errorHandler from '../utils/error-handler';
import logger from '../utils/logger';

/**
 * API调用Hook
 * @param {Function|Object} apiFunction API函数或配置对象
 * @param {Object} options 选项
 */
export const useApi = (apiFunction, options = {}) => {
  const {
    immediate = false,
    onSuccess = () => {},
    onError = () => {},
    retryTimes = 0,
    retryDelay = 1000,
    transform = (data) => data,
    ...defaultParams
  } = options;
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastParams, setLastParams] = useState(null);
  
  const abortControllerRef = useRef(null);
  const mountedRef = useRef(true);
  
  // 清理函数
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  /**
   * 执行API调用
   */
  const execute = useCallback(async (params = {}) => {
    if (!mountedRef.current) return;
    
    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    const finalParams = { ...defaultParams, ...params };
    setLastParams(finalParams);
    setLoading(true);
    setError(null);
    
    try {
      let result;
      
      if (typeof apiFunction === 'function') {
        // 如果是函数，直接调用
        result = await errorHandler.retry(
          () => apiFunction(finalParams, { signal: abortControllerRef.current.signal }),
          retryTimes,
          retryDelay
        );
      } else if (typeof apiFunction === 'object') {
        // 如果是配置对象，构建API调用
        const { method = 'get', url, ...config } = apiFunction;
        result = await errorHandler.retry(
          () => api[method.toLowerCase()](url, finalParams, {
            ...config,
            signal: abortControllerRef.current.signal
          }),
          retryTimes,
          retryDelay
        );
      } else {
        throw new Error('Invalid API function or configuration');
      }
      
      if (!mountedRef.current) return;
      
      // 转换数据
      const transformedData = transform(result);
      setData(transformedData);
      
      // 成功回调
      onSuccess(transformedData, finalParams);
      
      logger.debug('useApi success', {
        params: finalParams,
        dataLength: JSON.stringify(transformedData).length
      });
      
      return transformedData;
      
    } catch (err) {
      if (!mountedRef.current) return;
      
      // 忽略取消的请求
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        return;
      }
      
      setError(err);
      onError(err, finalParams);
      
      logger.error('useApi error', {
        error: err.message,
        params: finalParams
      });
      
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [apiFunction, defaultParams, onSuccess, onError, retryTimes, retryDelay, transform]);
  
  /**
   * 重试最后一次请求
   */
  const retry = useCallback(() => {
    if (lastParams !== null) {
      return execute(lastParams);
    }
  }, [execute, lastParams]);
  
  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
    setLastParams(null);
  }, []);
  
  /**
   * 取消请求
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);
  
  // 立即执行
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);
  
  return {
    data,
    loading,
    error,
    execute,
    retry,
    reset,
    cancel,
    lastParams
  };
};

/**
 * 分页API Hook
 * @param {Function|Object} apiFunction API函数或配置对象
 * @param {Object} options 选项
 */
export const usePaginatedApi = (apiFunction, options = {}) => {
  const {
    initialPage = 1,
    initialPageSize = 20,
    immediate = false,
    onSuccess = () => {},
    onError = () => {},
    ...otherOptions
  } = options;
  
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [total, setTotal] = useState(0);
  const [items, setItems] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  
  const {
    data,
    loading,
    error,
    execute,
    retry,
    reset: resetApi,
    cancel
  } = useApi(apiFunction, {
    ...otherOptions,
    immediate: false,
    onSuccess: (result) => {
      const { data: resultData = [], total: resultTotal = 0, ...rest } = result.data || result;
      
      setItems(resultData);
      setTotal(resultTotal);
      setHasMore(resultData.length === pageSize && (page * pageSize) < resultTotal);
      
      onSuccess({ data: resultData, total: resultTotal, ...rest });
    },
    onError
  });
  
  /**
   * 加载数据
   */
  const load = useCallback((params = {}) => {
    return execute({
      page,
      pageSize,
      ...params
    });
  }, [execute, page, pageSize]);
  
  /**
   * 刷新当前页
   */
  const refresh = useCallback((params = {}) => {
    return load(params);
  }, [load]);
  
  /**
   * 跳转到指定页
   */
  const goToPage = useCallback((newPage, params = {}) => {
    setPage(newPage);
    return execute({
      page: newPage,
      pageSize,
      ...params
    });
  }, [execute, pageSize]);
  
  /**
   * 下一页
   */
  const nextPage = useCallback((params = {}) => {
    if (hasMore) {
      return goToPage(page + 1, params);
    }
  }, [goToPage, page, hasMore]);
  
  /**
   * 上一页
   */
  const prevPage = useCallback((params = {}) => {
    if (page > 1) {
      return goToPage(page - 1, params);
    }
  }, [goToPage, page]);
  
  /**
   * 更改页面大小
   */
  const changePageSize = useCallback((newPageSize, params = {}) => {
    setPageSize(newPageSize);
    setPage(1);
    return execute({
      page: 1,
      pageSize: newPageSize,
      ...params
    });
  }, [execute]);
  
  /**
   * 重置分页状态
   */
  const reset = useCallback(() => {
    setPage(initialPage);
    setPageSize(initialPageSize);
    setTotal(0);
    setItems([]);
    setHasMore(true);
    resetApi();
  }, [initialPage, initialPageSize, resetApi]);
  
  // 立即加载
  useEffect(() => {
    if (immediate) {
      load();
    }
  }, [immediate, load]);
  
  return {
    // 数据
    items,
    total,
    loading,
    error,
    
    // 分页信息
    page,
    pageSize,
    hasMore,
    totalPages: Math.ceil(total / pageSize),
    
    // 操作方法
    load,
    refresh,
    goToPage,
    nextPage,
    prevPage,
    changePageSize,
    reset,
    retry,
    cancel
  };
};

/**
 * 批量API调用Hook
 * @param {Array} apiFunctions API函数数组
 * @param {Object} options 选项
 */
export const useBatchApi = (apiFunctions = [], options = {}) => {
  const {
    immediate = false,
    onSuccess = () => {},
    onError = () => {},
    onPartialSuccess = () => {},
    ...otherOptions
  } = options;
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(apiFunctions.length);
  
  const mountedRef = useRef(true);
  
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  /**
   * 执行批量API调用
   */
  const execute = useCallback(async (params = {}) => {
    if (!mountedRef.current || !apiFunctions.length) return;
    
    setLoading(true);
    setResults([]);
    setErrors([]);
    setCompleted(0);
    setTotal(apiFunctions.length);
    
    const promises = apiFunctions.map(async (apiFunction, index) => {
      try {
        const result = await apiFunction(params);
        
        if (!mountedRef.current) return;
        
        setResults(prev => {
          const newResults = [...prev];
          newResults[index] = result;
          return newResults;
        });
        
        setCompleted(prev => prev + 1);
        
        onPartialSuccess(result, index);
        
        return { index, result, error: null };
      } catch (error) {
        if (!mountedRef.current) return;
        
        setErrors(prev => {
          const newErrors = [...prev];
          newErrors[index] = error;
          return newErrors;
        });
        
        setCompleted(prev => prev + 1);
        
        return { index, result: null, error };
      }
    });
    
    try {
      const allResults = await Promise.all(promises);
      
      if (!mountedRef.current) return;
      
      const successResults = allResults.filter(r => r && !r.error).map(r => r.result);
      const errorResults = allResults.filter(r => r && r.error).map(r => r.error);
      
      if (errorResults.length === 0) {
        onSuccess(successResults);
      } else if (successResults.length > 0) {
        onPartialSuccess(successResults, errorResults);
      } else {
        onError(errorResults);
      }
      
      return { results: successResults, errors: errorResults };
      
    } catch (error) {
      if (!mountedRef.current) return;
      
      onError([error]);
      throw error;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [apiFunctions, onSuccess, onError, onPartialSuccess]);
  
  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    setResults([]);
    setErrors([]);
    setCompleted(0);
    setTotal(apiFunctions.length);
    setLoading(false);
  }, [apiFunctions.length]);
  
  // 立即执行
  useEffect(() => {
    if (immediate && apiFunctions.length > 0) {
      execute();
    }
  }, [immediate, execute, apiFunctions.length]);
  
  return {
    results,
    errors,
    loading,
    completed,
    total,
    progress: total > 0 ? (completed / total) * 100 : 0,
    execute,
    reset
  };
};

export default useApi;