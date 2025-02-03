import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import axios from 'axios';
import CreateBookClubForm from '../components/CreateBookClubForm';

// Mock axios
jest.mock('axios');

describe('CreateBookClubForm Component', () => {
  const mockOnSuccess = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('token', 'mock-token');
  });

  it('renders form elements correctly', () => {
    render(<CreateBookClubForm onSuccess={mockOnSuccess} />);

    expect(screen.getByLabelText(/Book Club Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Club Image URL/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Meeting Time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Search for Book/i)).toBeInTheDocument();
    expect(screen.getByText(/Create Book Club/i)).toBeInTheDocument();
  });

  it('handles form input changes', async () => {
    render(<CreateBookClubForm onSuccess={mockOnSuccess} />);

    const nameInput = screen.getByLabelText(/Book Club Name/i);
    const descriptionInput = screen.getByLabelText(/Description/i);
    const imageUrlInput = screen.getByLabelText(/Club Image URL/i);
    const meetingTimeInput = screen.getByLabelText(/Meeting Time/i);

    await userEvent.type(nameInput, 'Test Book Club');
    await userEvent.type(descriptionInput, 'Test Description');
    await userEvent.type(imageUrlInput, 'http://test-image.com');
    await userEvent.type(meetingTimeInput, '2024-02-15T18:00');

    expect(nameInput).toHaveValue('Test Book Club');
    expect(descriptionInput).toHaveValue('Test Description');
    expect(imageUrlInput).toHaveValue('http://test-image.com');
    expect(meetingTimeInput).toHaveValue('2024-02-15T18:00');
  });

  it('searches for books successfully', async () => {
    const mockBookResults = {
      data: {
        items: [
          {
            id: 'book1',
            volumeInfo: {
              title: 'Test Book',
              authors: ['Test Author']
            }
          }
        ]
      }
    };

    axios.get.mockResolvedValueOnce(mockBookResults);

    render(<CreateBookClubForm onSuccess={mockOnSuccess} />);

    const searchInput = screen.getByPlaceholderText(/Enter book title or author/i);
    await userEvent.type(searchInput, 'Test Book');
    
    const searchButton = screen.getByText('Search Book');
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText('Test Book by Test Author')).toBeInTheDocument();
    });
  });

  it('handles book selection', async () => {
    const mockBookResults = {
      data: {
        items: [
          {
            id: 'book1',
            volumeInfo: {
              title: 'Test Book',
              authors: ['Test Author']
            }
          }
        ]
      }
    };

    axios.get.mockResolvedValueOnce(mockBookResults);

    render(<CreateBookClubForm onSuccess={mockOnSuccess} />);

    // Search for book
    const searchInput = screen.getByPlaceholderText(/Enter book title or author/i);
    await userEvent.type(searchInput, 'Test Book');
    fireEvent.click(screen.getByText('Search Book'));

    // Wait for results and select book
    await waitFor(() => {
      const bookResult = screen.getByText('Test Book by Test Author');
      fireEvent.click(bookResult);
    });

    expect(screen.getByText(/Selected Book:/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Book by Test Author/i)).toBeInTheDocument();
  });

  it('submits form successfully', async () => {
    const mockBook = {
      id: 'book1',
      volumeInfo: {
        title: 'Test Book',
        authors: ['Test Author'],
        industryIdentifiers: [{ identifier: '1234567890' }]
      }
    };

    axios.post.mockResolvedValueOnce({ data: { id: 1, name: 'Test Book Club' } });

    render(<CreateBookClubForm onSuccess={mockOnSuccess} />);

    // Fill form
    await userEvent.type(screen.getByLabelText(/Book Club Name/i), 'Test Book Club');
    await userEvent.type(screen.getByLabelText(/Description/i), 'Test Description');
    await userEvent.type(screen.getByLabelText(/Meeting Time/i), '2024-02-15T18:00');

    // Mock book selection
    const form = screen.getByRole('form');
    const submitButton = screen.getByText(/Create Book Club/i);

    // Set selected book directly since we can't fully simulate the search and select
    const component = screen.getByTestId('create-book-club-form');
    component.__reactProps.selectedBook = mockBook;

    fireEvent.submit(form);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        '/api/bookClubs',
        expect.objectContaining({
          name: 'Test Book Club',
          description: 'Test Description',
          meeting_time: '2024-02-15T18:00'
        }),
        expect.any(Object)
      );
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('displays error message when form submission fails', async () => {
    axios.post.mockRejectedValueOnce(new Error('Failed to create book club'));

    render(<CreateBookClubForm onSuccess={mockOnSuccess} />);

    // Fill and submit form
    await userEvent.type(screen.getByLabelText(/Book Club Name/i), 'Test Book Club');
    await userEvent.type(screen.getByLabelText(/Description/i), 'Test Description');
    await userEvent.type(screen.getByLabelText(/Meeting Time/i), '2024-02-15T18:00');

    fireEvent.submit(screen.getByRole('form'));

    await waitFor(() => {
      expect(screen.getByText(/Failed to create book club/i)).toBeInTheDocument();
    });
  });

  it('validates required fields', async () => {
    render(<CreateBookClubForm onSuccess={mockOnSuccess} />);

    // Submit form without filling required fields
    fireEvent.submit(screen.getByRole('form'));

    // Check for HTML5 validation
    expect(screen.getByLabelText(/Book Club Name/i)).toBeInvalid();
    expect(screen.getByLabelText(/Description/i)).toBeInvalid();
    expect(screen.getByLabelText(/Meeting Time/i)).toBeInvalid();
  });
});