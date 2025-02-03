import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import ClubSearchResults from '../components/ClubSearchResults';

// Mock BookClubCard component
jest.mock('../components/BookClubCard', () => {
  return function MockBookClubCard({ club }) {
    return <div data-testid="mock-club-card">{club.name}</div>;
  };
});

describe('ClubSearchResults Component', () => {
  const mockSearchResults = [
    {
      id: 1,
      name: 'Fantasy Book Club',
      description: 'A club for fantasy lovers'
    },
    {
      id: 2,
      name: 'Science Fiction Club',
      description: 'Exploring sci-fi worlds'
    }
  ];

  const renderClubSearchResults = (searchResults) => {
    render(
      <BrowserRouter>
        <ClubSearchResults searchResults={searchResults} />
      </BrowserRouter>
    );
  };

  it('renders search results correctly', () => {
    renderClubSearchResults(mockSearchResults);

    expect(screen.getByText('Fantasy Book Club')).toBeInTheDocument();
    expect(screen.getByText('Science Fiction Club')).toBeInTheDocument();
    expect(screen.getAllByTestId('mock-club-card')).toHaveLength(2);
  });

  it('displays no results message when search results are empty', () => {
    renderClubSearchResults([]);

    expect(screen.getByText('No book clubs found.')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-club-card')).not.toBeInTheDocument();
  });

  it('handles undefined search results gracefully', () => {
    renderClubSearchResults(undefined);

    expect(screen.getByText('No book clubs found.')).toBeInTheDocument();
  });

  it('renders correct number of BookClubCard components', () => {
    renderClubSearchResults(mockSearchResults);

    const clubCards = screen.getAllByTestId('mock-club-card');
    expect(clubCards).toHaveLength(mockSearchResults.length);
  });

  it('passes correct props to BookClubCard components', () => {
    renderClubSearchResults(mockSearchResults);

    mockSearchResults.forEach(club => {
      expect(screen.getByText(club.name)).toBeInTheDocument();
    });
  });

  it('renders within search results container', () => {
    renderClubSearchResults(mockSearchResults);

    const container = screen.getByTestId('club-search-results');
    expect(container).toHaveClass('club-search-results');
  });

  it('maintains order of search results', () => {
    renderClubSearchResults(mockSearchResults);

    const clubCards = screen.getAllByTestId('mock-club-card');
    expect(clubCards[0]).toHaveTextContent('Fantasy Book Club');
    expect(clubCards[1]).toHaveTextContent('Science Fiction Club');
  });
});