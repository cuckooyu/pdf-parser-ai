import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TagManager from './TagManager';

describe('TagManager', () => {
  test('renders loading state initially', () => {
    render(<TagManager />);
    expect(screen.getByText(/加载中/i)).toBeInTheDocument();
  });

  test('loads initial tags from network request', async () => {
    render(<TagManager />);
    
    await waitFor(() => {
      expect(screen.getByText(/标签管理系统/i)).toBeInTheDocument();
    }, { timeout: 5000 });

    // Check that initial tags are loaded
    expect(screen.getByText('标签一')).toBeInTheDocument();
    expect(screen.getByText('标签二')).toBeInTheDocument();
    expect(screen.getByText('重要')).toBeInTheDocument();
    expect(screen.getByText('工作')).toBeInTheDocument();
    expect(screen.getByText('学习')).toBeInTheDocument();
  });

  test('adds new tag when add button is clicked', async () => {
    const user = userEvent.setup();
    render(<TagManager />);
    
    await waitFor(() => {
      expect(screen.getByText(/标签管理系统/i)).toBeInTheDocument();
    }, { timeout: 5000 });

    const input = screen.getByPlaceholderText(/输入中文标签/i);
    const addButton = screen.getByText(/添加/i);

    await user.type(input, '新测试标签');
    await user.click(addButton);

    expect(screen.getByText('新测试标签')).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  test('prevents adding duplicate tags', async () => {
    const user = userEvent.setup();
    
    // Mock window.alert
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(<TagManager />);
    
    await waitFor(() => {
      expect(screen.getByText(/标签管理系统/i)).toBeInTheDocument();
    }, { timeout: 5000 });

    const input = screen.getByPlaceholderText(/输入中文标签/i);
    const addButton = screen.getByText(/添加/i);

    // Try to add a tag that already exists
    await user.type(input, '标签一');
    await user.click(addButton);

    expect(alertSpy).toHaveBeenCalledWith('此标签已存在');
    
    alertSpy.mockRestore();
  });

  test('does not add empty tags', async () => {
    const user = userEvent.setup();
    render(<TagManager />);
    
    await waitFor(() => {
      expect(screen.getByText(/标签管理系统/i)).toBeInTheDocument();
    }, { timeout: 5000 });

    const addButton = screen.getByText(/添加/i);

    // Try to add empty tag
    await user.click(addButton);

    // Should still have the same number of tags (5 initial ones)
    const activeTags = screen.getAllByText(/×/);
    expect(activeTags).toHaveLength(5);
  });
});