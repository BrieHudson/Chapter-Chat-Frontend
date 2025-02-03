import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import axios from 'axios';
import Library from '../components/Library';

// Mock axios
jest.mock('axios');

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('Library Component', () => {
  const mockReadingLists = {
    toRead: [
      {
        id: 1,
        title: 'Want to Read Book',
        author: 'Author 1',
        description: 'Description 1'
      }
    ],
    reading: [
      {
        id: 2,
        title: 'Currently Reading Book',
        author: 'Author 2',
        description: 'Description 2'
      }
    ],
    completed: [
      {
        id: 3,
        title: 'Completed Book',
        author: 'Author 3',
        description: 'Description 3'
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('mock-token');
  });

  const renderLibrary = () => {
    render(
      <BrowserRouter>
        <Library />
      </BrowserRouter>
    );
  };

  it('renders loading state initially', () => {
    axios.get.mockImplementation(() => new Promise(() => {}));
    renderLibrary();
    
    expect(screen.getByText(/Loading your library/i)).toBeInTheDocument();
  });

  it('renders reading lists successfully', async () => {
    axios.get.mockResolvedValueOnce({ data: mockReadingLists });

    renderLibrary();

    await waitFor(() => {
      expect(screen.getByText('Want to Read Book')).toBeInTheDocument();
      expect(screen.getByText('Currently Reading Book')).toBeInTheDocument();
      expect(screen.getByText('Completed Book')).toBeInTheDocument();
    });
  });

  it('shows error state when fetch fails', async () => {
    const errorMessage = 'Failed to fetch reading lists';
    axios.get.mockRejectedValueOnce(new Error(errorMessage));

    renderLibrary();

    await waitFor(() => {
      expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
    });
  });

  it('toggles list visibility when clicking header', async () => {
    axios.get.mockResolvedValueOnce({ data: mockReadingLists });

    renderLibrary();

    await waitFor(() => {
      const toReadHeader = screen.getByText('Want to Read');
      fireEvent.click(toReadHeader);
      expect(screen.getByText('Want to Read Book')).toBeVisible();

      // Click again to hide
      fireEvent.click(toReadHeader);
      expect(screen.queryByText('Want to Read Book')).not.toBeVisible();
    });
  });

  it('handles moving book between lists', async () => {
    axios.get.mockResolvedValueOnce({ data: mockReadingLists });
    axios.put.mockResolvedValueOnce({ data: { success: true } });

    renderLibrary();

    await waitFor(() => {
      const selectElement = screen.getAllByRole('combobox')[0];
      fireEvent.change(selectElement, { target: { value: 'reading' } });
    });

    expect(axios.put).toHaveBeenCalledWith(
      'http://localhost:5012/api/readingList/move',
      expect.objectContaining({
        fromList: 'want_to_read',
        toList: 'reading'
      }),
      expect.any(Object)
    );
  });

  it('handles removing book from list', async () => {
    axios.get.mockResolvedValueOnce({ data: mockReadingLists });
    axios.delete.mockResolvedValueOnce({ data: { success: true } });

    renderLibrary();

    await waitFor(() => {
      const removeButton = screen.getAllByText('Remove')[0];
      fireEvent.click(removeButton);
    });

    expect(axios.delete).toHaveBeenCalledWith(
      expect.stringContaining('/api/readingList/'),
      expect.any(Object)
    );
  });

  it('updates UI after moving book between lists', async () => {
    axios.get.mockResolvedValueOnce({ data: mockReadingLists });
    axios.put.mockResolvedValueOnce({ data: { success: true } });

    renderLibrary();

    await waitFor(() => {
      const selectElement = screen.getAllByRole('combobox')[0];
      fireEvent.change(selectElement, { target: { value: 'reading' } });
    });

    await waitFor(() => {
      expect(screen.queryByText('Want to Read Book')).not.toBeInTheDocument();
    });
  });

  it('shows empty state when list is empty', async () => {
    const emptyLists = {
      toRead: [],
      reading: [],
      completed: []
    };

    axios.get.mockResolvedValueOnce({ data: emptyLists });

    renderLibrary();

    await waitFor(() => {
      expect(screen.getAllByText('No books saved')).toHaveLength(3);
    });
  });

  it('handles authentication error', async () => {
    mockLocalStorage.getItem.mockReturnValue(null);
    
    renderLibrary();

    await waitFor(() => {
      expect(screen.getByText(/No authentication token found/i)).toBeInTheDocument();
    });
  });

  it('retains list visibility state between updates', async () => {
    axios.get.mockResolvedValueOnce({ data: mockReadingLists });

    renderLibrary();

    await waitFor(() => {
      const toReadHeader = screen.getByText('Want to Read');
      fireEvent.click(toReadHeader);
      expect(screen.getByText('Want to Read Book')).toBeVisible();
    });

    // Simulate an update (e.g., after moving a book)
    axios.get.mockResolvedValueOnce({ data: mockReadingLists });
    await waitFor(() => {
      expect(screen.getByText('Want to Read Book')).toBeVisible();
    });
  });
});