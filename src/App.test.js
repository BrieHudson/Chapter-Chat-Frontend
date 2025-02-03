import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom';
import App from './App';

// Mock child components
jest.mock('./components/LoginForm', () => {
  return function MockLoginForm({ setAuth }) {
    return (
      <div data-testid="mock-login">
        <button onClick={() => setAuth(true)}>Mock Login</button>
      </div>
    );
  };
});

jest.mock('./components/SignupForm', () => {
  return function MockSignupForm() {
    return <div data-testid="mock-signup">Signup Form</div>;
  };
});

jest.mock('./components/Home', () => {
  return function MockHome() {
    return <div data-testid="mock-home">Home Page</div>;
  };
});

jest.mock('./components/Navbar', () => {
  return function MockNavbar({ isLoggedIn, setAuth }) {
    if (!isLoggedIn) return null;
    return (
      <nav data-testid="mock-navbar">
        <button onClick={() => setAuth(false)}>Logout</button>
      </nav>
    );
  };
});

jest.mock('./components/BookClubDetails', () => {
  return function MockBookClubDetails() {
    return <div data-testid="mock-book-club-details">Book Club Details</div>;
  };
});

jest.mock('./components/BookSearchResults', () => {
  return function MockBookSearchResults({ searchResults }) {
    return (
      <div data-testid="mock-search-results">
        {searchResults.map(result => (
          <div key={result.id}>{result.title}</div>
        ))}
      </div>
    );
  };
});

jest.mock('./components/Library', () => {
  return function MockLibrary() {
    return <div data-testid="mock-library">Library</div>;
  };
});

describe('App Component', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, '', '/');
  });

  it('renders login form when not authenticated', () => {
    render(<App />);
    expect(screen.getByTestId('mock-login')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-navbar')).not.toBeInTheDocument();
  });

  it('redirects to home when authenticated', () => {
    localStorage.setItem('token', 'mock-token');
    render(<App />);
    expect(screen.getByTestId('mock-home')).toBeInTheDocument();
    expect(screen.getByTestId('mock-navbar')).toBeInTheDocument();
  });

  it('allows navigation to signup page', async () => {
    render(<App />);
    act(() => {
      window.history.pushState({}, '', '/signup');
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('mock-signup')).toBeInTheDocument();
    });
  });

  it('protects routes when not authenticated', async () => {
    render(<App />);
    
    // Try accessing protected routes
    act(() => {
      window.history.pushState({}, '', '/home');
    });
    expect(screen.getByTestId('mock-login')).toBeInTheDocument();

    act(() => {
      window.history.pushState({}, '', '/library');
    });
    expect(screen.getByTestId('mock-login')).toBeInTheDocument();

    act(() => {
      window.history.pushState({}, '', '/bookclubs/1');
    });
    expect(screen.getByTestId('mock-login')).toBeInTheDocument();
  });

  it('allows access to protected routes when authenticated', async () => {
    localStorage.setItem('token', 'mock-token');
    render(<App />);

    // Access home
    act(() => {
      window.history.pushState({}, '', '/home');
    });
    expect(screen.getByTestId('mock-home')).toBeInTheDocument();

    // Access library
    act(() => {
      window.history.pushState({}, '', '/library');
    });
    await waitFor(() => {
      expect(screen.getByTestId('mock-library')).toBeInTheDocument();
    });

    // Access book club details
    act(() => {
      window.history.pushState({}, '', '/bookclubs/1');
    });
    await waitFor(() => {
      expect(screen.getByTestId('mock-book-club-details')).toBeInTheDocument();
    });
  });

  it('handles logout correctly', () => {
    localStorage.setItem('token', 'mock-token');
    render(<App />);

    // Verify logged in state
    expect(screen.getByTestId('mock-navbar')).toBeInTheDocument();
    expect(screen.getByTestId('mock-home')).toBeInTheDocument();

    // Logout
    fireEvent.click(screen.getByText('Logout'));

    // Verify logged out state
    expect(screen.queryByTestId('mock-navbar')).not.toBeInTheDocument();
    expect(screen.getByTestId('mock-login')).toBeInTheDocument();
  });

  it('maintains search results state', async () => {
    localStorage.setItem('token', 'mock-token');
    render(<App />);

    // Simulate search results update
    act(() => {
      window.history.pushState({}, '', '/booksearch');
    });

    const mockResults = [
      { id: 1, title: 'Test Book 1' },
      { id: 2, title: 'Test Book 2' }
    ];

    // Update search results
    await act(async () => {
      // Find and use the setSearchResults function from props
      const navbar = screen.getByTestId('mock-navbar');
      const setSearchResultsProp = navbar.props.setSearchResults;
      setSearchResultsProp(mockResults);
    });

    await waitFor(() => {
      expect(screen.getByTestId('mock-search-results')).toBeInTheDocument();
      mockResults.forEach(result => {
        expect(screen.getByText(result.title)).toBeInTheDocument();
      });
    });
  });

  it('redirects to home page for invalid routes', async () => {
    localStorage.setItem('token', 'mock-token');
    render(<App />);

    act(() => {
      window.history.pushState({}, '', '/invalid-route');
    });

    await waitFor(() => {
      expect(screen.getByTestId('mock-home')).toBeInTheDocument();
    });
  });

  it('handles authentication state change', async () => {
    render(<App />);

    // Initially not authenticated
    expect(screen.getByTestId('mock-login')).toBeInTheDocument();

    // Login
    fireEvent.click(screen.getByText('Mock Login'));

    // Should now be authenticated
    await waitFor(() => {
      expect(screen.getByTestId('mock-home')).toBeInTheDocument();
      expect(screen.getByTestId('mock-navbar')).toBeInTheDocument();
    });
  });
});
