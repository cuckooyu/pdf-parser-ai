import React, { useState, useEffect } from 'react';
import { Tag } from './types';
import './TagManager.css';

// Mock API function to simulate network request
const fetchInitialTags = async (): Promise<Tag[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return sample Chinese tags
  return [
    { id: '1', content: '标签一' },
    { id: '2', content: '标签二' },
    { id: '3', content: '重要' },
    { id: '4', content: '工作' },
    { id: '5', content: '学习' }
  ];
};

const TagManager: React.FC = () => {
  const [activeTags, setActiveTags] = useState<Tag[]>([]);
  const [deletedTags, setDeletedTags] = useState<Tag[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch initial tags on component mount
  useEffect(() => {
    const loadInitialTags = async () => {
      try {
        const tags = await fetchInitialTags();
        setActiveTags(tags);
      } catch (error) {
        console.error('Failed to fetch initial tags:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialTags();
  }, []);

  // Handle tag deletion
  const handleDeleteTag = (tagToDelete: Tag) => {
    setActiveTags(prev => prev.filter(tag => tag.id !== tagToDelete.id));
    setDeletedTags(prev => [...prev, tagToDelete]);
  };

  // Handle tag restoration
  const handleRestoreTag = (tagToRestore: Tag) => {
    setDeletedTags(prev => prev.filter(tag => tag.id !== tagToRestore.id));
    setActiveTags(prev => [...prev, tagToRestore]);
  };

  // Handle adding new tag
  const handleAddTag = () => {
    const trimmedValue = inputValue.trim();
    
    if (!trimmedValue) {
      return;
    }

    // Check for duplicates based on content
    const isDuplicate = activeTags.some(tag => tag.content === trimmedValue) ||
                       deletedTags.some(tag => tag.content === trimmedValue);
    
    if (isDuplicate) {
      alert('此标签已存在'); // "This tag already exists" in Chinese
      return;
    }

    // Create new tag with unique ID
    const newTag: Tag = {
      id: `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: trimmedValue
    };

    setActiveTags(prev => [...prev, newTag]);
    setInputValue('');
  };

  // Handle input key press
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleAddTag();
    }
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="tag-manager">
      <h1>标签管理系统</h1>
      
      {/* Input section */}
      <div className="input-section">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="输入中文标签..."
          className="tag-input"
        />
        <button onClick={handleAddTag} className="add-button">
          添加
        </button>
      </div>

      {/* Active tags section */}
      <div className="active-tags-section">
        <h2>当前标签</h2>
        <div className="tags-container">
          {activeTags.length === 0 ? (
            <p className="empty-message">暂无标签</p>
          ) : (
            activeTags.map(tag => (
              <div key={tag.id} className="tag active-tag">
                <span className="tag-content">{tag.content}</span>
                <button
                  onClick={() => handleDeleteTag(tag)}
                  className="delete-button"
                  title="删除标签"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Deleted tags section */}
      <div className="deleted-tags-section">
        <h2>最近删除</h2>
        <div className="tags-container">
          {deletedTags.length === 0 ? (
            <p className="empty-message">暂无已删除标签</p>
          ) : (
            deletedTags.map(tag => (
              <div key={tag.id} className="tag deleted-tag" onClick={() => handleRestoreTag(tag)}>
                <span className="tag-content">{tag.content}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TagManager;