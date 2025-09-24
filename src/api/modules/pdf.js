/**
 * PDF相关API
 */

import { api, uploadClient } from '../index';
import { PDF_ENDPOINTS, buildApiUrl } from '../endpoints';
import { UPLOAD_CONFIG } from '../../config/constants';
import logger from '../../utils/logger';

/**
 * PDF API类
 */
class PdfAPI {
  /**
   * 上传PDF文件
   * @param {File} file PDF文件
   * @param {Object} options 上传选项
   */
  async uploadPdf(file, options = {}) {
    try {
      // 验证文件类型
      if (!this._validatePdfFile(file)) {
        throw new Error('Invalid file type. Only PDF files are allowed.');
      }
      
      const {
        onProgress = () => {},
        onSuccess = () => {},
        onError = () => {},
        enableChunked = file.size > UPLOAD_CONFIG.CHUNK_SIZE,
        metadata = {},
        ...config
      } = options;
      
      logger.user('pdf_upload_start', {
        fileName: file.name,
        fileSize: file.size,
        enableChunked
      });
      
      const response = await api.upload(PDF_ENDPOINTS.UPLOAD, file, {
        onProgress: (progress) => {
          logger.debug('PDF upload progress', progress);
          onProgress(progress);
        },
        onSuccess: (data) => {
          logger.user('pdf_upload_success', {
            fileName: file.name,
            pdfId: data.id
          });
          onSuccess(data);
        },
        onError: (error) => {
          logger.user('pdf_upload_failed', {
            fileName: file.name,
            error: error.message
          });
          onError(error);
        },
        enableChunked,
        data: metadata,
        ...config
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * 解析PDF文件
   * @param {string} pdfId PDF文件ID
   * @param {Object} options 解析选项
   */
  async parsePdf(pdfId, options = {}) {
    try {
      logger.user('pdf_parse_start', { pdfId, options });
      
      const response = await api.post(PDF_ENDPOINTS.PARSE, {
        pdfId,
        ...options
      });
      
      logger.user('pdf_parse_success', { 
        pdfId,
        pages: response.data.totalPages 
      });
      
      return response.data;
    } catch (error) {
      logger.user('pdf_parse_failed', { pdfId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 获取PDF列表
   * @param {Object} params 查询参数
   */
  async getPdfList(params = {}) {
    try {
      const {
        page = 1,
        pageSize = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search = '',
        status = '',
        ...otherParams
      } = params;
      
      const response = await api.get(PDF_ENDPOINTS.LIST, {
        page,
        pageSize,
        sortBy,
        sortOrder,
        search,
        status,
        ...otherParams
      });
      
      logger.user('pdf_list_fetch_success', {
        total: response.data.total,
        page
      });
      
      return response.data;
    } catch (error) {
      logger.user('pdf_list_fetch_failed', { error: error.message });
      throw error;
    }
  }
  
  /**
   * 获取PDF详情
   * @param {string} pdfId PDF文件ID
   */
  async getPdfDetails(pdfId) {
    try {
      const response = await api.get(PDF_ENDPOINTS.GET(pdfId));
      
      logger.user('pdf_details_fetch_success', { pdfId });
      
      return response.data;
    } catch (error) {
      logger.user('pdf_details_fetch_failed', { 
        pdfId, 
        error: error.message 
      });
      throw error;
    }
  }
  
  /**
   * 删除PDF文件
   * @param {string} pdfId PDF文件ID
   */
  async deletePdf(pdfId) {
    try {
      const response = await api.delete(PDF_ENDPOINTS.DELETE(pdfId));
      
      logger.user('pdf_delete_success', { pdfId });
      
      return response.data;
    } catch (error) {
      logger.user('pdf_delete_failed', { pdfId, error: error.message });
      throw error;
    }
  }
  
  /**
   * 下载PDF文件
   * @param {string} pdfId PDF文件ID
   * @param {string} filename 文件名
   */
  async downloadPdf(pdfId, filename) {
    try {
      const response = await api.download(
        PDF_ENDPOINTS.DOWNLOAD(pdfId),
        filename
      );
      
      logger.user('pdf_download_success', { pdfId, filename });
      
      return response;
    } catch (error) {
      logger.user('pdf_download_failed', { 
        pdfId, 
        filename,
        error: error.message 
      });
      throw error;
    }
  }
  
  /**
   * 提取PDF文本
   * @param {string} pdfId PDF文件ID
   * @param {Object} options 提取选项
   */
  async extractText(pdfId, options = {}) {
    try {
      const response = await api.post(PDF_ENDPOINTS.EXTRACT_TEXT(pdfId), options);
      
      logger.user('pdf_text_extract_success', { 
        pdfId,
        textLength: response.data.text?.length || 0
      });
      
      return response.data;
    } catch (error) {
      logger.user('pdf_text_extract_failed', { 
        pdfId, 
        error: error.message 
      });
      throw error;
    }
  }
  
  /**
   * 提取PDF图片
   * @param {string} pdfId PDF文件ID
   * @param {Object} options 提取选项
   */
  async extractImages(pdfId, options = {}) {
    try {
      const response = await api.post(PDF_ENDPOINTS.EXTRACT_IMAGES(pdfId), options);
      
      logger.user('pdf_images_extract_success', { 
        pdfId,
        imageCount: response.data.images?.length || 0
      });
      
      return response.data;
    } catch (error) {
      logger.user('pdf_images_extract_failed', { 
        pdfId, 
        error: error.message 
      });
      throw error;
    }
  }
  
  /**
   * AI分析PDF
   * @param {string} pdfId PDF文件ID
   * @param {Object} analysisOptions 分析选项
   */
  async analyzeWithAI(pdfId, analysisOptions = {}) {
    try {
      const {
        analysisType = 'comprehensive',
        language = 'zh-CN',
        includeImages = true,
        includeTables = true,
        customPrompt = '',
        ...otherOptions
      } = analysisOptions;
      
      logger.user('pdf_ai_analysis_start', { 
        pdfId, 
        analysisType,
        language
      });
      
      const response = await api.post(PDF_ENDPOINTS.AI_ANALYZE(pdfId), {
        analysisType,
        language,
        includeImages,
        includeTables,
        customPrompt,
        ...otherOptions
      });
      
      logger.user('pdf_ai_analysis_success', { 
        pdfId,
        analysisType,
        resultLength: response.data.analysis?.length || 0
      });
      
      return response.data;
    } catch (error) {
      logger.user('pdf_ai_analysis_failed', { 
        pdfId, 
        analysisType: analysisOptions.analysisType,
        error: error.message 
      });
      throw error;
    }
  }
  
  /**
   * 批量处理PDF
   * @param {Array} pdfIds PDF文件ID数组
   * @param {string} operation 操作类型
   * @param {Object} options 操作选项
   */
  async batchProcess(pdfIds, operation, options = {}) {
    try {
      logger.user('pdf_batch_process_start', {
        pdfIds,
        operation,
        count: pdfIds.length
      });
      
      const response = await api.post('/pdf/batch', {
        pdfIds,
        operation,
        options
      });
      
      logger.user('pdf_batch_process_success', {
        operation,
        processedCount: response.data.processed?.length || 0,
        failedCount: response.data.failed?.length || 0
      });
      
      return response.data;
    } catch (error) {
      logger.user('pdf_batch_process_failed', {
        operation,
        count: pdfIds.length,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * 获取PDF处理状态
   * @param {string} taskId 任务ID
   */
  async getProcessingStatus(taskId) {
    try {
      const response = await api.get(`/pdf/status/${taskId}`);
      return response.data;
    } catch (error) {
      logger.user('pdf_status_fetch_failed', { 
        taskId, 
        error: error.message 
      });
      throw error;
    }
  }
  
  /**
   * 验证PDF文件
   * @param {File} file 文件对象
   * @returns {boolean} 是否为有效的PDF文件
   */
  _validatePdfFile(file) {
    // 检查文件类型
    if (!UPLOAD_CONFIG.ALLOWED_TYPES.includes(file.type) && file.type !== 'application/pdf') {
      return false;
    }
    
    // 检查文件大小
    if (file.size > UPLOAD_CONFIG.MAX_SIZE) {
      throw new Error(`File size exceeds maximum limit of ${UPLOAD_CONFIG.MAX_SIZE / 1024 / 1024}MB`);
    }
    
    // 检查文件扩展名
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.pdf')) {
      return false;
    }
    
    return true;
  }
}

// 创建实例
const pdfAPI = new PdfAPI();

export default pdfAPI;

// 导出便利方法
export const {
  uploadPdf,
  parsePdf,
  getPdfList,
  getPdfDetails,
  deletePdf,
  downloadPdf,
  extractText,
  extractImages,
  analyzeWithAI,
  batchProcess,
  getProcessingStatus
} = pdfAPI;