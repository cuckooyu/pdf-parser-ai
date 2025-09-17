import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

test('renders tag management system', async () => {
  render(<App />);
  
  // First check for loading state
  expect(screen.getByText(/加载中/i)).toBeInTheDocument();
  
  // Then wait for the main title to appear after loading
  await waitFor(() => {
    const titleElement = screen.getByText(/标签管理系统/i);
    expect(titleElement).toBeInTheDocument();
  });
});
