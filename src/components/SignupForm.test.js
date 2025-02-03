import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import axios from 'axios';
import SignupForm from '../components/SignupForm';

// Mock axios
jest.mock('axios');

describe('SignupForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders signup form elements correctly', () => {
    render(<SignupForm />);

    expect(screen.getByPlaceholderText(/Username/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign Up/i })).toBeInTheDocument();
  });

  it('handles successful signup', async () => {
    const mockResponse = {
      data: {
        message: 'Signup successful! Please log in.',
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com'
        }
      }
    };
    axios.post.mockResolvedValueOnce(mockResponse);

    render(<SignupForm />);

    await userEvent.type(screen.getByPlaceholderText(/Username/i), 'testuser');
    await userEvent.type(screen.getByPlaceholderText(/Email/i), 'test@example.com');
    await userEvent.type(screen.getByPlaceholderText(/Password/i), 'password123');

    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:5012/api/authRoutes/signup',
        {
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        }
      );
      expect(screen.getByText('Signup successful! Please log in.')).toBeInTheDocument();
    });
  });

  it('handles signup failure due to existing user', async () => {
    const errorMessage = 'Username or email already taken';
    axios.post.mockRejectedValueOnce({
      response: { data: { error: errorMessage } }
    });

    render(<SignupForm />);

    await userEvent.type(screen.getByPlaceholderText(/Username/i), 'existinguser');
    await userEvent.type(screen.getByPlaceholderText(/Email/i), 'existing@example.com');
    await userEvent.type(screen.getByPlaceholderText(/Password/i), 'password123');

    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('handles network error during signup', async () => {
    axios.post.mockRejectedValueOnce(new Error('Network Error'));

    render(<SignupForm />);

    await userEvent.type(screen.getByPlaceholderText(/Username/i), 'testuser');
    await userEvent.type(screen.getByPlaceholderText(/Email/i), 'test@example.com');
    await userEvent.type(screen.getByPlaceholderText(/Password/i), 'password123');

    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));

    await waitFor(() => {
      expect(screen.getByText(/Signup failed/i)).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    render(<SignupForm />);

    const emailInput = screen.getByPlaceholderText(/Email/i);
    await userEvent.type(emailInput, 'invalidemail');

    expect(emailInput).toBeInvalid();
  });

  it('validates required fields', async () => {
    render(<SignupForm />);

    const submitButton = screen.getByRole('button', { name: /Sign Up/i });
    fireEvent.click(submitButton);

    const usernameInput = screen.getByPlaceholderText(/Username/i);
    const emailInput = screen.getByPlaceholderText(/Email/i);
    const passwordInput = screen.getByPlaceholderText(/Password/i);

    expect(usernameInput).toBeRequired();
    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('shows loading state during signup', async () => {
    axios.post.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

    render(<SignupForm />);

    await userEvent.type(screen.getByPlaceholderText(/Username/i), 'testuser');
    await userEvent.type(screen.getByPlaceholderText(/Email/i), 'test@example.com');
    await userEvent.type(screen.getByPlaceholderText(/Password/i), 'password123');

    const submitButton = screen.getByRole('button', { name: /Sign Up/i });
    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Signing up...');
  });

  it('handles form data changes correctly', async () => {
    render(<SignupForm />);

    const usernameInput = screen.getByPlaceholderText(/Username/i);
    const emailInput = screen.getByPlaceholderText(/Email/i);
    const passwordInput = screen.getByPlaceholderText(/Password/i);

    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.type(passwordInput, 'password123');

    expect(usernameInput).toHaveValue('testuser');
    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('clears form and error message after successful signup', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        message: 'Signup successful! Please log in.'
      }
    });

    render(<SignupForm />);

    await userEvent.type(screen.getByPlaceholderText(/Username/i), 'testuser');
    await userEvent.type(screen.getByPlaceholderText(/Email/i), 'test@example.com');
    await userEvent.type(screen.getByPlaceholderText(/Password/i), 'password123');

    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Username/i)).toHaveValue('');
      expect(screen.getByPlaceholderText(/Email/i)).toHaveValue('');
      expect(screen.getByPlaceholderText(/Password/i)).toHaveValue('');
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });
  });
});