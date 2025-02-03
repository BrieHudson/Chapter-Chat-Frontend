import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import axios from 'axios';
import LoginForm from '../components/LoginForm';

// Mock axios
jest.mock('axios');

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('LoginForm Component', () => {
  const mockSetAuth = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  const renderLoginForm = () => {
    render(
      <BrowserRouter>
        <LoginForm setAuth={mockSetAuth} />
      </BrowserRouter>
    );
  };

  it('renders login form elements correctly', () => {
    renderLoginForm();

    expect(screen.getByPlaceholderText(/Username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Log In/i })).toBeInTheDocument();
    expect(screen.getByText(/Don't have an account/i)).toBeInTheDocument();
    expect(screen.getByText(/Sign Up/i)).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    const mockResponse = {
      data: {
        token: 'mock-token',
        message: 'Login successful!'
      }
    };
    axios.post.mockResolvedValueOnce(mockResponse);

    renderLoginForm();

    await userEvent.type(screen.getByPlaceholderText(/Username/i), 'testuser');
    await userEvent.type(screen.getByPlaceholderText(/Password/i), 'password123');
    
    fireEvent.click(screen.getByRole('button', { name: /Log In/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:5012/api/authRoutes/login',
        {
          username: 'testuser',
          password: 'password123'
        }
      );
      expect(localStorage.getItem('token')).toBe('mock-token');
      expect(mockSetAuth).toHaveBeenCalledWith(true);
      expect(mockNavigate).toHaveBeenCalledWith('/home');
      expect(screen.getByText('Login successful!')).toBeInTheDocument();
    });
  });

  it('handles login failure', async () => {
    const errorMessage = 'Invalid credentials';
    axios.post.mockRejectedValueOnce({
      response: { data: { error: errorMessage } }
    });

    renderLoginForm();

    await userEvent.type(screen.getByPlaceholderText(/Username/i), 'wronguser');
    await userEvent.type(screen.getByPlaceholderText(/Password/i), 'wrongpass');
    
    fireEvent.click(screen.getByRole('button', { name: /Log In/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(localStorage.getItem('token')).toBeNull();
      expect(mockSetAuth).not.toHaveBeenCalled();
    });
  });

  it('handles network error', async () => {
    axios.post.mockRejectedValueOnce(new Error('Network Error'));

    renderLoginForm();

    await userEvent.type(screen.getByPlaceholderText(/Username/i), 'testuser');
    await userEvent.type(screen.getByPlaceholderText(/Password/i), 'password123');
    
    fireEvent.click(screen.getByRole('button', { name: /Log In/i }));

    await waitFor(() => {
      expect(screen.getByText(/Login failed/i)).toBeInTheDocument();
    });
  });

  it('disables submit button while loading', async () => {
    axios.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    renderLoginForm();

    const submitButton = screen.getByRole('button', { name: /Log In/i });
    
    await userEvent.type(screen.getByPlaceholderText(/Username/i), 'testuser');
    await userEvent.type(screen.getByPlaceholderText(/Password/i), 'password123');
    
    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Logging in...');
  });

  it('validates required fields', async () => {
    renderLoginForm();

    const submitButton = screen.getByRole('button', { name: /Log In/i });
    fireEvent.click(submitButton);

    const usernameInput = screen.getByPlaceholderText(/Username/i);
    const passwordInput = screen.getByPlaceholderText(/Password/i);

    expect(usernameInput).toBeRequired();
    expect(passwordInput).toBeRequired();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('navigates to signup page when clicking signup link', () => {
    renderLoginForm();

    const signupLink = screen.getByText(/Sign Up/i);
    fireEvent.click(signupLink);

    expect(screen.getByText(/Sign Up/i)).toBeInTheDocument();
  });
});