import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import BookClubDetails from '../components/BookClubDetails';

// Mock axios
jest.mock('axios');

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: '1' })
}));

describe('BookClubDetails Component', () => {
  const mockClubData = {
    id: 1,
    name: 'Test Book Club',
    description: 'Test Description',
    meeting_time: '2024-02-15T18:00:00Z',
    image_url: 'test-image.jpg',
    creator: {
      id: 1,
      username: 'testuser'
    },
    currentBook: {
      id: 1,
      title: 'Test Book',
      author: 'Test Author',
      description: 'Test Book Description'
    },
    forumPosts: [
      {
        id: 1,
        content: 'Test post',
        contains_spoilers: false,
        user: {
          id: 1,
          username: 'testuser'
        },
        created_at: '2024-02-01T12:00:00Z'
      }
    ],
    isMember: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('userId', '1');
  });

  it('renders loading state initially', () => {
    axios.get.mockImplementation(() => new Promise(() => {}));
    render(
      <BrowserRouter>
        <BookClubDetails />
      </BrowserRouter>
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders book club details successfully', async () => {
    axios.get.mockResolvedValueOnce({ data: mockClubData });

    render(
      <BrowserRouter>
        <BookClubDetails />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Book Club')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText('Test Book')).toBeInTheDocument();
      expect(screen.getByText(/Test Author/)).toBeInTheDocument();
    });
  });

  it('shows error message when fetch fails', async () => {
    const errorMessage = 'Failed to fetch book club details';
    axios.get.mockRejectedValueOnce(new Error(errorMessage));

    render(
      <BrowserRouter>
        <BookClubDetails />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
    });
  });

  it('handles join club functionality', async () => {
    axios.get.mockResolvedValueOnce({ data: { ...mockClubData, isMember: false } });
    axios.post.mockResolvedValueOnce({ data: { message: 'Successfully joined' } });

    render(
      <BrowserRouter>
        <BookClubDetails />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Join Club')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Join Club'));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        '/api/bookclubs/1/join',
        {},
        expect.any(Object)
      );
    });
  });

  it('handles forum post submission', async () => {
    axios.get.mockResolvedValueOnce({ data: mockClubData });
    axios.post.mockResolvedValueOnce({ 
      data: {
        id: 2,
        content: 'New test post',
        user: { id: 1, username: 'testuser' }
      }
    });

    render(
      <BrowserRouter>
        <BookClubDetails />
      </BrowserRouter>
    );

    await waitFor(() => {
      const textarea = screen.getByPlaceholderText('Share your thoughts...');
      fireEvent.change(textarea, { target: { value: 'New test post' } });
      fireEvent.submit(screen.getByRole('form'));
    });

    expect(axios.post).toHaveBeenCalledWith(
      '/api/forums/1',
      expect.objectContaining({
        content: 'New test post',
        contains_spoilers: false
      }),
      expect.any(Object)
    );
  });

  it('toggles spoiler content visibility', async () => {
    const clubDataWithSpoilers = {
      ...mockClubData,
      forumPosts: [
        ...mockClubData.forumPosts,
        {
          id: 2,
          content: 'Spoiler content',
          contains_spoilers: true,
          user: { id: 1, username: 'testuser' },
          created_at: '2024-02-01T12:00:00Z'
        }
      ]
    };

    axios.get.mockResolvedValueOnce({ data: clubDataWithSpoilers });

    render(
      <BrowserRouter>
        <BookClubDetails />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText('Spoiler content')).not.toBeInTheDocument();
    });

    const spoilerToggle = screen.getByLabelText('Show Spoilers');
    fireEvent.click(spoilerToggle);

    await waitFor(() => {
      expect(screen.getByText('Spoiler content')).toBeInTheDocument();
    });
  });

  it('allows creator to delete book club', async () => {
    axios.get.mockResolvedValueOnce({ data: mockClubData });
    axios.delete.mockResolvedValueOnce({ data: { message: 'Successfully deleted' } });
    
    // Mock confirm dialog
    window.confirm = jest.fn(() => true);

    render(
      <BrowserRouter>
        <BookClubDetails />
      </BrowserRouter>
    );

    await waitFor(() => {
      const deleteButton = screen.getByText('Delete Club');
      fireEvent.click(deleteButton);
    });

    expect(window.confirm).toHaveBeenCalled();
    expect(axios.delete).toHaveBeenCalledWith(
      '/api/bookclubs/1',
      expect.any(Object)
    );
    expect(mockNavigate).toHaveBeenCalledWith('/bookclubs');
  });
});