import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Custom render that includes Router
const renderWithRouter = (ui, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test page', route);

  return render(ui, { wrapper: BrowserRouter });
};

// Mock localStorage
const mockLocalStorage = () => {
  const storage = {};
  return {
    getItem: jest.fn((key) => storage[key]),
    setItem: jest.fn((key, value) => {
      storage[key] = value;
    }),
    removeItem: jest.fn((key) => {
      delete storage[key];
    }),
    clear: jest.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key]);
    }),
  };
};

// Mock IntersectionObserver
const mockIntersectionObserver = () => {
  return jest.fn().mockImplementation(() => ({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null
  }));
};

export { renderWithRouter, mockLocalStorage, mockIntersectionObserver };