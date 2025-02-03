import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

// Mock axios
jest.mock('axios');

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('Navbar Component', () => {
  const mockSetAuth = jest.fn();
  const mockSetSearchResults = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  const renderNavbar = (isLoggedIn = true) => {
    render(
      <BrowserRouter>
        <Navbar 
          setAuth={mockSetAuth} 
          isLoggedIn={isLoggedIn}
          setSearchResults={mockSetSearchResults}
        />
      </BrowserRouter>
    );
  };

  it('does not render when user is not logged in', () => {
    renderNavbar(false);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('renders navigation elements when user is logged in', () => {
    renderNavbar(true);
    
    expect(screen.getByPlaceholderText(/Search books/i)).toBeInTheDocument();
    expect(screen.getByText(/My Library/i)).toBeInTheDocument();
    expect(screen.getByText(/Home/i)).toBeInTheDocument();
    expect(screen.getByText(/Logout/i)).toBeInTheDocument();
  });

  it('handles book search successfully', async () => {
    const mockSearchResults = {
      data: {
        items: [
          {
            id: 'book1',
            volumeInfo: {
              title: 'Test Book'
            }
          }
        ]
      }
    };
    axios.get.mockResolvedValueOnce(mockSearchResults);

    renderNavbar(true);

    const searchInput = screen.getByPlaceholderText(/Search books/i);
    await userEvent.type(searchInput, 'test book');

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('volumes?q=test book')
      );
      expect(mockSetSearchResults).toHaveBeenCalledWith(mockSearchResults.data.items);
      expect(mockNavigate).toHaveBeenCalledWith('/booksearch');
    });
  });

  it('handles empty search query', async () => {
    renderNavbar(true);

    const searchInput = screen.getByPlaceholderText(/Search books/i);
    await userEvent.type(searchInput, '   ');

    expect(mockSetSearchResults).toHaveBeenCalledWith([]);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('handles search error gracefully', async () => {
    axios.get.mockRejectedValueOnce(new Error('API Error'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    renderNavbar(true);

    const searchInput = screen.getByPlaceholderText(/Search books/i);
    await userEvent.type(searchInput, 'test book');

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it('handles logout correctly', () => {
    localStorage.setItem('token', 'test-token');
    renderNavbar(true);

    const logoutButton = screen.getByText(/Logout/i);
    fireEvent.click(logoutButton);

    expect(localStorage.getItem('token')).toBeNull();
    expect(mockSetAuth).toHaveBeenCalledWith(false);
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('toggles mobile menu on hamburger click', () => {
    renderNavbar(true);

    const hamburgerButton = screen.getByRole('button', { name: '' });
    const mobileMenu = screen.getByTestId('mobile-menu');

    // Initial state
    expect(mobileMenu).not.toHaveClass('show');

    // Open menu
    fireEvent.click(hamburgerButton);
    expect(mobileMenu).toHaveClass('show');

    // Close menu
    fireEvent.click(hamburgerButton);
    expect(mobileMenu).not.toHaveClass('show');
  });

  it('closes mobile menu when clicking a link', () => {
    renderNavbar(true);

    // Open mobile menu
    const hamburgerButton = screen.getByRole('button', { name: '' });
    fireEvent.click(hamburgerButton);

    // Click a link
    const libraryLink = screen.getByText(/My Library/i);
    fireEvent.click(libraryLink);

    expect(screen.getByTestId('mobile-menu')).not.toHaveClass('show');
  });

  it('displays loading spinner during search', async () => {
    axios.get.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
    
    renderNavbar(true);

    const searchInput = screen.getByPlaceholderText(/Search books/i);
    await userEvent.type(searchInput, 'test book');

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});