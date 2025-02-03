import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BookCard from '../components/BookCard';

// Mock fetch function
global.fetch = jest.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('BookCard Component', () => {
  const mockBook = {
    volumeInfo: {
      title: 'Test Book',
      authors: ['Test Author'],
      description: 'Test description that is long enough to test truncation of the description text',
      imageLinks: {
        thumbnail: 'test-image-url'
      }
    }
  };

  const mockLibraryBook = {
    title: 'Library Book',
    author: 'Library Author',
    description: 'Library book description',
    coverImage: 'library-image-url'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockClear();
    mockLocalStorage.getItem.mockClear();
  });

  it('renders book information correctly for search results', () => {
    render(<BookCard book={mockBook} />);

    expect(screen.getByText('Test Book')).toBeInTheDocument();
    expect(screen.getByText('Test Author')).toBeInTheDocument();
    expect(screen.getByText(/Test description/)).toBeInTheDocument();
    expect(screen.getByAltText('Test Book')).toHaveAttribute('src', 'test-image-url');
  });

  it('renders book information correctly for library view', () => {
    render(<BookCard book={mockLibraryBook} listType="toRead" />);

    expect(screen.getByText('Library Book')).toBeInTheDocument();
    expect(screen.getByText('Library Author')).toBeInTheDocument();
    expect(screen.getByText(/Library book description/)).toBeInTheDocument();
    expect(screen.getByAltText('Library Book')).toHaveAttribute('src', 'library-image-url');
  });

  it('shows "No Image" placeholder when image is not available', () => {
    const bookWithoutImage = {
      volumeInfo: {
        title: 'No Image Book',
        authors: ['Author']
      }
    };

    render(<BookCard book={bookWithoutImage} />);
    expect(screen.getByText('No Image')).toBeInTheDocument();
  });

  it('handles list change in search view', () => {
    const onListChange = jest.fn();
    render(<BookCard book={mockBook} onListChange={onListChange} />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'reading' } });

    expect(onListChange).toHaveBeenCalledWith(mockBook, 'reading');
  });

  it('handles list change in library view', () => {
    const onListChange = jest.fn();
    render(
      <BookCard 
        book={mockLibraryBook} 
        listType="toRead" 
        onListChange={onListChange} 
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'reading' } });

    expect(onListChange).toHaveBeenCalledWith(mockLibraryBook, 'reading');
  });

  it('handles remove book in library view', () => {
    const onRemoveFromList = jest.fn();
    render(
      <BookCard 
        book={mockLibraryBook} 
        listType="toRead" 
        onRemoveFromList={onRemoveFromList} 
      />
    );

    const removeButton = screen.getByText('Remove');
    fireEvent.click(removeButton);

    expect(onRemoveFromList).toHaveBeenCalledWith(mockLibraryBook);
  });

  it('handles adding book to list', async () => {
    mockLocalStorage.getItem.mockReturnValue('mock-token');
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
    );

    render(<BookCard book={mockBook} />);

    const addButton = screen.getByText('Add to List');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5012/api/readingList/add',
        expect.any(Object)
      );
    });
  });

  it('displays error when adding book fails', async () => {
    mockLocalStorage.getItem.mockReturnValue('mock-token');
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to add book' })
      })
    );

    const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(<BookCard book={mockBook} />);

    const addButton = screen.getByText('Add to List');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(expect.stringContaining('Failed to add book'));
    });

    mockAlert.mockRestore();
  });
});