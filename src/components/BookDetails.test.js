import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import axios from 'axios';
import BookClubDetails from '../components/BookDetails';

// Mock axios
jest.mock('axios');

// Mock BookSearchResults component
jest.mock('../components/BookSearchResults', () => {
  return function MockBookSearchResults({ searchResults, onSelect }) {
    return (
      <div data-testid="mock-book-search">
        {searchResults.map(book => (
          <div 
            key={book.id} 
            onClick={() => onSelect(book)}
            data-testid="search-result-item"
          >
            {book.volumeInfo.title}
          </div>
        ))}
      </div>
    );
  };
});

// Mock useParams hook
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '1' })
}));

describe('BookDetails Component', () => {
  const mockClubDetails = {
    id: 1,
    name: 'Test Book Club',
    description: 'Test Description',
    meeting_time: '2024-02-15T18:00:00Z',
    creator: {
      id: 1,
      username: 'testuser'
    },
    currentBook: {
      id: 1,
      title: 'Current Test Book',
      author: 'Test Author',
      image_url: 'test-image.jpg'
    },
    isMember: true
  };

  const mockForumPosts = [
    {
      id: 1,
      content: 'Test post',
      user: { id: 1, username: 'testuser' },
      created_at: '2024-02-01T12:00:00Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('userId', '1');
  });

  const renderBookDetails = () => {
    render(
      <BrowserRouter>
        <BookClubDetails />
      </BrowserRouter>
    );
  };

  it('renders loading state initially', () => {
    renderBookDetails();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('loads and displays book club details', async () => {
    axios.get
      .mockResolvedValueOnce({ data: mockClubDetails })
      .mockResolvedValueOnce({ data: mockForumPosts });

    renderBookDetails();

    await waitFor(() => {
      expect(screen.getByText('Test Book Club')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText('Current Test Book')).toBeInTheDocument();
    });
  });

  it('handles edit mode for club creator', async () => {
    axios.get
      .mockResolvedValueOnce({ data: mockClubDetails })
      .mockResolvedValueOnce({ data: mockForumPosts });

    renderBookDetails();

    await waitFor(() => {
      const editButton = screen.getByText('Edit Club Details');
      fireEvent.click(editButton);
    });

    expect(screen.getByText('Edit Club Details')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Book Club')).toBeInTheDocument();
  });

  it('handles book search and selection', async () => {
    const mockSearchResults = [{
      id: 'book1',
      volumeInfo: {
        title: 'New Book',
        authors: ['New Author']
      }
    }];

    axios.get
      .mockResolvedValueOnce({ data: mockClubDetails })
      .mockResolvedValueOnce({ data: mockForumPosts });
    axios.put.mockResolvedValueOnce({ data: { ...mockClubDetails, currentBook: mockSearchResults[0] } });

    renderBookDetails();

    await waitFor(() => {
      const changeBookButton = screen.getByText('Change Book');
      fireEvent.click(changeBookButton);
    });

    const searchInput = screen.getByPlaceholderText(/Search for books/i);
    await userEvent.type(searchInput, 'new book');

    expect(screen.getByTestId('mock-book-search')).toBeInTheDocument();
  });

  it('handles forum post submission', async () => {
    axios.get
      .mockResolvedValueOnce({ data: mockClubDetails })
      .mockResolvedValueOnce({ data: mockForumPosts });
    axios.post.mockResolvedValueOnce({ 
      data: {
        id: 2,
        content: 'New post',
        user: { id: 1, username: 'testuser' }
      }
    });

    renderBookDetails();

    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(/Share your thoughts/i);
      fireEvent.change(textarea, { target: { value: 'New post' } });
      const submitButton = screen.getByText('Post');
      fireEvent.click(submitButton);
    });

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/forums/1'),
      expect.objectContaining({ content: 'New post' }),
      expect.any(Object)
    );
  });

  it('toggles spoiler content visibility', async () => {
    const clubDetailsWithSpoilers = {
      ...mockClubDetails,
      forumPosts: [{
        id: 1,
        content: 'Spoiler content',
        contains_spoilers: true,
        user: { id: 1, username: 'testuser' }
      }]
    };

    axios.get
      .mockResolvedValueOnce({ data: clubDetailsWithSpoilers })
      .mockResolvedValueOnce({ data: [] });

    renderBookDetails();

    await waitFor(() => {
      const spoilerToggle = screen.getByLabelText(/Show Spoilers/i);
      expect(screen.queryByText('Spoiler content')).not.toBeInTheDocument();
      fireEvent.click(spoilerToggle);
      expect(screen.getByText('Spoiler content')).toBeInTheDocument();
    });
  });

  it('handles club update submission', async () => {
    axios.get
      .mockResolvedValueOnce({ data: mockClubDetails })
      .mockResolvedValueOnce({ data: mockForumPosts });
    axios.put.mockResolvedValueOnce({ data: { ...mockClubDetails, name: 'Updated Club' } });

    renderBookDetails();

    await waitFor(() => {
      const editButton = screen.getByText('Edit Club Details');
      fireEvent.click(editButton);
    });

    const nameInput = screen.getByDisplayValue('Test Book Club');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Updated Club');

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/bookclubs/1'),
        expect.objectContaining({ name: 'Updated Club' }),
        expect.any(Object)
      );
    });
  });

  it('displays error state when fetch fails', async () => {
    const errorMessage = 'Failed to fetch book club details';
    axios.get.mockRejectedValueOnce(new Error(errorMessage));

    renderBookDetails();

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });
});