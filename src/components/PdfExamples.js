/**
 * PDF处理示例组件
 */

import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import pdfAPI from '../api/modules/pdf';

const PdfExamples = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState({ type: '', content: '' });
  const [pdfId, setPdfId] = useState('');
  
  // PDF上传
  const {
    data: uploadResult,
    loading: uploading,
    error: uploadError,
    execute: uploadPdf
  } = useApi(
    ({ file, options }) => pdfAPI.uploadPdf(file, options),
    {
      onSuccess: (data) => {
        setPdfId(data.id);
        setMessage({ type: 'success', content: 'PDF上传成功！' });
      },
      onError: (error) => {
        setMessage({ type: 'error', content: `上传失败: ${error.message}` });
      }
    }
  );
  
  // PDF解析
  const {
    data: parseResult,
    loading: parsing,
    error: parseError,
    execute: parsePdf
  } = useApi(
    ({ pdfId, options }) => pdfAPI.parsePdf(pdfId, options),
    {
      onSuccess: (data) => {
        setMessage({ type: 'success', content: `PDF解析成功！共 ${data.totalPages} 页` });
      },
      onError: (error) => {
        setMessage({ type: 'error', content: `解析失败: ${error.message}` });
      }
    }
  );
  
  // 文本提取
  const {
    data: textResult,
    loading: extractingText,
    error: textError,
    execute: extractText
  } = useApi(
    ({ pdfId, options }) => pdfAPI.extractText(pdfId, options),
    {
      onSuccess: (data) => {
        setMessage({ 
          type: 'success', 
          content: `文本提取成功！提取了 ${data.text?.length || 0} 个字符` 
        });
      },
      onError: (error) => {
        setMessage({ type: 'error', content: `文本提取失败: ${error.message}` });
      }
    }
  );
  
  // AI分析
  const {
    data: aiResult,
    loading: analyzingAI,
    error: aiError,
    execute: analyzeWithAI
  } = useApi(
    ({ pdfId, options }) => pdfAPI.analyzeWithAI(pdfId, options),
    {
      onSuccess: (data) => {
        setMessage({ 
          type: 'success', 
          content: 'AI分析完成！' 
        });
      },
      onError: (error) => {
        setMessage({ type: 'error', content: `AI分析失败: ${error.message}` });
      }
    }
  );
  
  // PDF列表
  const {
    data: pdfList,
    loading: loadingList,
    error: listError,
    execute: loadPdfList
  } = useApi(pdfAPI.getPdfList, {
    onSuccess: (data) => {
      setMessage({ 
        type: 'success', 
        content: `加载了 ${data.data?.length || 0} 个PDF文件` 
      });
    }
  });
  
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    
    if (file && file.type !== 'application/pdf') {
      setMessage({ type: 'error', content: '请选择PDF文件' });
      setSelectedFile(null);
    }
  };
  
  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage({ type: 'error', content: '请先选择文件' });
      return;
    }
    
    await uploadPdf({
      file: selectedFile,
      options: {
        onProgress: ({ percent }) => {
          setUploadProgress(percent);
        },
        metadata: {
          description: '示例PDF文件',
          category: 'demo'
        }
      }
    });
  };
  
  const handleParse = async () => {
    if (!pdfId) {
      setMessage({ type: 'error', content: '请先上传PDF文件' });
      return;
    }
    
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
    if (!pdfId) {
      setMessage({ type: 'error', content: '请先上传PDF文件' });
      return;
    }
    
    await extractText({
      pdfId,
      options: {
        pages: 'all', // 或者指定页码: '1-5'
        format: 'plain' // 或者 'markdown', 'html'
      }
    });
  };
  
  const handleAIAnalysis = async () => {
    if (!pdfId) {
      setMessage({ type: 'error', content: '请先上传PDF文件' });
      return;
    }
    
    await analyzeWithAI({
      pdfId,
      options: {
        analysisType: 'comprehensive',
        language: 'zh-CN',
        includeImages: true,
        includeTables: true,
        customPrompt: '请总结这个PDF文档的主要内容'
      }
    });
  };
  
  const handleLoadList = async () => {
    await loadPdfList({
      page: 1,
      pageSize: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };
  
  return (
    <div className="pdf-examples">
      {/* 文件上传 */}
      <div className="card">
        <h2>PDF文件上传</h2>
        <div className="example-section">
          <input 
            type="file" 
            accept=".pdf"
            onChange={handleFileSelect}
            disabled={uploading}
          />
          
          {selectedFile && (
            <div className="file-info">
              <p><strong>文件名:</strong> {selectedFile.name}</p>
              <p><strong>大小:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          )}
          
          <button 
            className="button" 
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? <span className="loading"></span> : '上传PDF'}
          </button>
          
          {uploading && (
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
          
          {uploadResult && (
            <div className="result">
              <h4>上传结果:</h4>
              <p><strong>PDF ID:</strong> {uploadResult.id}</p>
              <p><strong>文件名:</strong> {uploadResult.fileName}</p>
              <p><strong>状态:</strong> {uploadResult.status}</p>
            </div>
          )}
          
          {uploadError && (
            <div className="error">上传错误: {uploadError.message}</div>
          )}
        </div>
      </div>
      
      {/* PDF解析 */}
      <div className="card">
        <h2>PDF解析</h2>
        <div className="example-section">
          <input 
            type="text" 
            placeholder="输入PDF ID（或使用上传的PDF）"
            value={pdfId}
            onChange={(e) => setPdfId(e.target.value)}
            className="input"
          />
          
          <button 
            className="button" 
            onClick={handleParse}
            disabled={!pdfId || parsing}
          >
            {parsing ? <span className="loading"></span> : '解析PDF'}
          </button>
          
          {parseResult && (
            <div className="result">
              <h4>解析结果:</h4>
              <p><strong>总页数:</strong> {parseResult.totalPages}</p>
              <p><strong>文档标题:</strong> {parseResult.title || '未知'}</p>
              <p><strong>作者:</strong> {parseResult.author || '未知'}</p>
              <p><strong>创建时间:</strong> {parseResult.creationDate || '未知'}</p>
              {parseResult.images && (
                <p><strong>图片数量:</strong> {parseResult.images.length}</p>
              )}
              {parseResult.tables && (
                <p><strong>表格数量:</strong> {parseResult.tables.length}</p>
              )}
            </div>
          )}
          
          {parseError && (
            <div className="error">解析错误: {parseError.message}</div>
          )}
        </div>
      </div>
      
      {/* 文本提取 */}
      <div className="card">
        <h2>文本提取</h2>
        <div className="example-section">
          <button 
            className="button" 
            onClick={handleExtractText}
            disabled={!pdfId || extractingText}
          >
            {extractingText ? <span className="loading"></span> : '提取文本'}
          </button>
          
          {textResult && (
            <div className="result">
              <h4>提取的文本 (前500字符):</h4>
              <div className="text-preview">
                {textResult.text ? textResult.text.substring(0, 500) + '...' : '无文本内容'}
              </div>
              <p><strong>总字符数:</strong> {textResult.text?.length || 0}</p>
              <p><strong>提取页数:</strong> {textResult.pageCount || 0}</p>
            </div>
          )}
          
          {textError && (
            <div className="error">文本提取错误: {textError.message}</div>
          )}
        </div>
      </div>
      
      {/* AI分析 */}
      <div className="card">
        <h2>AI智能分析</h2>
        <div className="example-section">
          <button 
            className="button" 
            onClick={handleAIAnalysis}
            disabled={!pdfId || analyzingAI}
          >
            {analyzingAI ? <span className="loading"></span> : '开始AI分析'}
          </button>
          
          {aiResult && (
            <div className="result">
              <h4>AI分析结果:</h4>
              <div className="ai-analysis">
                <p><strong>分析类型:</strong> {aiResult.analysisType}</p>
                <p><strong>语言:</strong> {aiResult.language}</p>
                <div className="analysis-content">
                  <h5>分析内容:</h5>
                  <div className="analysis-text">
                    {aiResult.analysis || '暂无分析结果'}
                  </div>
                </div>
                {aiResult.summary && (
                  <div className="summary">
                    <h5>摘要:</h5>
                    <p>{aiResult.summary}</p>
                  </div>
                )}
                {aiResult.keywords && (
                  <div className="keywords">
                    <h5>关键词:</h5>
                    <div className="keyword-tags">
                      {aiResult.keywords.map((keyword, index) => (
                        <span key={index} className="keyword-tag">{keyword}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {aiError && (
            <div className="error">AI分析错误: {aiError.message}</div>
          )}
        </div>
      </div>
      
      {/* PDF列表 */}
      <div className="card">
        <h2>PDF文件列表</h2>
        <div className="example-section">
          <button 
            className="button" 
            onClick={handleLoadList}
            disabled={loadingList}
          >
            {loadingList ? <span className="loading"></span> : '加载PDF列表'}
          </button>
          
          {pdfList && (
            <div className="result">
              <h4>PDF文件列表:</h4>
              {pdfList.data && pdfList.data.length > 0 ? (
                <div className="pdf-list">
                  {pdfList.data.map((pdf, index) => (
                    <div key={pdf.id || index} className="pdf-item">
                      <p><strong>ID:</strong> {pdf.id}</p>
                      <p><strong>文件名:</strong> {pdf.fileName}</p>
                      <p><strong>状态:</strong> {pdf.status}</p>
                      <p><strong>创建时间:</strong> {new Date(pdf.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>暂无PDF文件</p>
              )}
              <p><strong>总数:</strong> {pdfList.total || 0}</p>
            </div>
          )}
          
          {listError && (
            <div className="error">列表加载错误: {listError.message}</div>
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
        <h3>PDF处理功能特性</h3>
        <ul>
          <li>✅ 支持大文件分块上传</li>
          <li>✅ 实时上传进度显示</li>
          <li>✅ PDF文档信息解析</li>
          <li>✅ 全文文本提取</li>
          <li>✅ 图片和表格提取</li>
          <li>✅ AI智能内容分析</li>
          <li>✅ 批量文件处理</li>
          <li>✅ 文件下载支持</li>
          <li>✅ 处理状态追踪</li>
        </ul>
      </div>
    </div>
  );
};

export default PdfExamples;