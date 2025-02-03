import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import axios from 'axios';
import HomePage from '../components/Home';

// Mock axios
jest.mock('axios');

// Mock child components
jest.mock('../components/ClubSearchResults', () => {
  return function MockClubSearchResults({ searchResults }) {
    return <div data-testid="mock-search-results">
      {searchResults.map(club => (
        <div key={club.id}>{club.name}</div>
      ))}
    </div>;
  };
});

jest.mock('../components/CreateBookClubForm', () => {
  return function MockCreateBookClubForm({ onSuccess }) {
    return <div data-testid="mock-create-form" onClick={() => onSuccess()}>
      Mock Create Form
    </div>;
  };
});

jest.mock('../components/BookClubCard', () => {
  return function MockBookClubCard({ club }) {
    return <div data-testid="mock-club-card">{club.name}</div>;
  };
});

describe('HomePage Component', () => {
  const mockUserClubs = [
    { id: 1, name: 'Book Club 1' },
    { id: 2, name: 'Book Club 2' }
  ];

  const mockSearchResults = [
    { id: 3, name: 'Search Club 1' },
    { id: 4, name: 'Search Club 2' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('token', 'mock-token');
  });

  const renderHomePage = () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );
  };

  it('renders initial state correctly', async () => {
    axios.get.mockResolvedValueOnce({ data: mockUserClubs });
    
    renderHomePage();

    expect(screen.getByText('Welcome to Chapter Chat!')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search for book clubs/i)).toBeInTheDocument();
    expect(screen.getByText(/Create Book Club/i)).toBeInTheDocument();
  });

  it('fetches and displays user book clubs', async () => {
    axios.get.mockResolvedValueOnce({ data: mockUserClubs });

    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText('Book Club 1')).toBeInTheDocument();
      expect(screen.getByText('Book Club 2')).toBeInTheDocument();
    });
  });

  it('handles search functionality', async () => {
    axios.get
      .mockResolvedValueOnce({ data: mockUserClubs }) // Initial clubs fetch
      .mockResolvedValueOnce({ data: mockSearchResults }); // Search results

    renderHomePage();

    const searchInput = screen.getByPlaceholderText(/Search for book clubs/i);
    await userEvent.type(searchInput, 'test search');

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/bookClubs/search'),
        expect.any(Object)
      );
      expect(screen.getByText('Search Club 1')).toBeInTheDocument();
      expect(screen.getByText('Search Club 2')).toBeInTheDocument();
    });
  });

  it('toggles create form visibility', async () => {
    axios.get.mockResolvedValueOnce({ data: mockUserClubs });

    renderHomePage();

    const createButton = screen.getByText(/Create Book Club/i);
    
    // Show form
    fireEvent.click(createButton);
    expect(screen.getByTestId('mock-create-form')).toBeInTheDocument();
    
    // Hide form
    fireEvent.click(createButton);
    expect(screen.queryByTestId('mock-create-form')).not.toBeInTheDocument();
  });

  it('handles create form success', async () => {
    axios.get
      .mockResolvedValueOnce({ data: mockUserClubs })
      .mockResolvedValueOnce({ data: [...mockUserClubs, { id: 3, name: 'New Club' }] });

    renderHomePage();

    const createButton = screen.getByText(/Create Book Club/i);
    fireEvent.click(createButton);

    const createForm = screen.getByTestId('mock-create-form');
    fireEvent.click(createForm); // Triggers onSuccess

    await waitFor(() => {
      expect(screen.queryByTestId('mock-create-form')).not.toBeInTheDocument();
      expect(axios.get).toHaveBeenCalledTimes(2);
    });
  });

  it('displays error message when club fetch fails', async () => {
    const errorMessage = 'Failed to fetch your book clubs';
    axios.get.mockRejectedValueOnce(new Error(errorMessage));

    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('handles search errors gracefully', async () => {
    axios.get
      .mockResolvedValueOnce({ data: mockUserClubs })
      .mockRejectedValueOnce(new Error('Search failed'));

    renderHomePage();

    const searchInput = screen.getByPlaceholderText(/Search for book clubs/i);
    await userEvent.type(searchInput, 'test');

    await waitFor(() => {
      expect(screen.getByText(/Failed to search book clubs/i)).toBeInTheDocument();
    });
  });

  it('shows empty state when user has no clubs', async () => {
    axios.get.mockResolvedValueOnce({ data: [] });

    renderHomePage();

    await waitFor(() => {
      expect(screen.getByText(/You haven't joined any book clubs yet/i)).toBeInTheDocument();
    });
  });

  it('debounces search requests', async () => {
    jest.useFakeTimers();
    axios.get.mockResolvedValueOnce({ data: mockUserClubs });

    renderHomePage();

    const searchInput = screen.getByPlaceholderText(/Search for book clubs/i);
    await userEvent.type(searchInput, 'test');

    // Fast typing shouldn't trigger immediate requests
    expect(axios.get).toHaveBeenCalledTimes(1); // Only initial clubs fetch

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(2); // Search request after debounce
    });

    jest.useRealTimers();
  });
});