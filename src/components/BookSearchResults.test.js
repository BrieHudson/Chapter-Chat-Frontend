import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import BookSearchResults from '../components/BookSearchResults';

// Mock BookCard component
jest.mock('../components/BookCard', () => {
  return function MockBookCard({ book, onSelect, onListChange }) {
    return (
      <div data-testid="mock-book-card" onClick={() => onSelect && onSelect(book)}>
        <h3>{book.volumeInfo.title}</h3>
        <select onChange={(e) => onListChange(book, e.target.value)}>
          <option value="toRead">Want to Read</option>
          <option value="reading">Currently Reading</option>
          <option value="completed">Read</option>
        </select>
      </div>
    );
  };
});

// Mock fetch
global.fetch = jest.fn();

describe('BookSearchResults Component', () => {
  const mockSearchResults = [
    {
      id: '1',
      volumeInfo: {
        title: 'Test Book 1',
        authors: ['Author 1'],
        description: 'Description 1',
        imageLinks: {
          thumbnail: 'image1.jpg'
        },
        publishedDate: '2024',
        categories: ['Fiction'],
        industryIdentifiers: [
          { identifier: '1234567890' }
        ]
      }
    },
    {
      id: '2',
      volumeInfo: {
        title: 'Test Book 2',
        authors: ['Author 2'],
        description: 'Description 2',
        imageLinks: {
          thumbnail: 'image2.jpg'
        }
      }
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('token', 'mock-token');
  });

  it('renders no results message when no search results', () => {
    render(<BookSearchResults searchResults={[]} />);
    expect(screen.getByText('No books found')).toBeInTheDocument();
  });

  it('renders search results correctly', () => {
    render(<BookSearchResults searchResults={mockSearchResults} />);
    
    expect(screen.getByText('Test Book 1')).toBeInTheDocument();
    expect(screen.getByText('Test Book 2')).toBeInTheDocument();
  });

  it('opens book details modal on book selection', () => {
    render(<BookSearchResults searchResults={mockSearchResults} />);

    fireEvent.click(screen.getByText('Test Book 1'));

    expect(screen.getByText('by Author 1')).toBeInTheDocument();
    expect(screen.getByText('Published: 2024')).toBeInTheDocument();
    expect(screen.getByText('Categories: Fiction')).toBeInTheDocument();
    expect(screen.getByText('ISBN: 1234567890')).toBeInTheDocument();
    expect(screen.getByText('Description 1')).toBeInTheDocument();
  });

  it('closes book details modal', () => {
    render(<BookSearchResults searchResults={mockSearchResults} />);

    // Open modal
    fireEvent.click(screen.getByText('Test Book 1'));
    expect(screen.getByText('by Author 1')).toBeInTheDocument();

    // Close modal using close button
    fireEvent.click(screen.getByText('×'));
    expect(screen.queryByText('by Author 1')).not.toBeInTheDocument();
  });

  it('handles adding book to reading list', async () => {
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
    );

    render(<BookSearchResults searchResults={mockSearchResults} />);

    const selectElement = screen.getAllByRole('combobox')[0];
    fireEvent.change(selectElement, { target: { value: 'reading' } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5012/api/readingList/add',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          })
        })
      );
    });
  });

  it('handles API error when adding book', async () => {
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to add book' })
      })
    );

    const alertMock = jest.spyOn(window, 'alert').mockImplementation();

    render(<BookSearchResults searchResults={mockSearchResults} />);

    const selectElement = screen.getAllByRole('combobox')[0];
    fireEvent.change(selectElement, { target: { value: 'reading' } });

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith(expect.stringContaining('Failed to add book'));
    });

    alertMock.mockRestore();
  });

  it('maintains selected books state between list changes', async () => {
    global.fetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
    );

    render(<BookSearchResults searchResults={mockSearchResults} />);

    const selectElement = screen.getAllByRole('combobox')[0];
    
    // Change to 'reading'
    fireEvent.change(selectElement, { target: { value: 'reading' } });
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('reading')
        })
      );
    });

    // Change to 'completed'
    fireEvent.change(selectElement, { target: { value: 'completed' } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('completed')
        })
      );
    });
  });

  it('displays loading state while adding book', async () => {
    let resolvePromise;
    global.fetch.mockImplementationOnce(() =>
      new Promise((resolve) => {
        resolvePromise = resolve;
      })
    );

    render(<BookSearchResults searchResults={mockSearchResults} />);

    const selectElement = screen.getAllByRole('combobox')[0];
    fireEvent.change(selectElement, { target: { value: 'reading' } });

    expect(selectElement).toBeDisabled();

    resolvePromise({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });

    await waitFor(() => {
      expect(selectElement).not.toBeDisabled();
    });
  });
});