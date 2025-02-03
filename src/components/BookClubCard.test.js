import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import BookClubCard from '../components/BookClubCard';

describe('BookClubCard Component', () => {
  const mockClub = {
    id: 1,
    name: 'Test Book Club',
    description: 'Test Description',
    image_url: 'https://test-image.com/image.jpg'
  };

  const renderWithRouter = (component) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  it('renders book club information correctly', () => {
    renderWithRouter(<BookClubCard club={mockClub} />);

    expect(screen.getByText('Test Book Club')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByAltText('Test Book Club cover')).toBeInTheDocument();
    expect(screen.getByText('View Details')).toBeInTheDocument();
  });

  it('uses default image when image URL is invalid', () => {
    const clubWithInvalidImage = {
      ...mockClub,
      image_url: 'invalid-url'
    };

    renderWithRouter(<BookClubCard club={clubWithInvalidImage} />);
    const img = screen.getByAltText('Test Book Club cover');
    expect(img.src).toContain('/default-club-image.jpg');
  });

  it('uses default image when no image URL is provided', () => {
    const clubWithoutImage = {
      ...mockClub,
      image_url: null
    };

    renderWithRouter(<BookClubCard club={clubWithoutImage} />);
    const img = screen.getByAltText('Test Book Club cover');
    expect(img.src).toContain('/default-club-image.jpg');
  });

  it('handles base64 images correctly', () => {
    const clubWithBase64Image = {
      ...mockClub,
      image_url: 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
    };

    renderWithRouter(<BookClubCard club={clubWithBase64Image} />);
    const img = screen.getByAltText('Test Book Club cover');
    expect(img.src).toBe(clubWithBase64Image.image_url);
  });

  it('creates correct link to book club details', () => {
    renderWithRouter(<BookClubCard club={mockClub} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/bookclubs/1');
  });

  it('handles image loading error', () => {
    renderWithRouter(<BookClubCard club={mockClub} />);
    const img = screen.getByAltText('Test Book Club cover');
    
    // Simulate image loading error
    fireEvent.error(img);
    
    expect(img.src).toContain('/default-club-image.jpg');
  });

  it('validates image URLs correctly', () => {
    // Test valid HTTP URL
    const validHttpClub = {
      ...mockClub,
      image_url: 'http://example.com/image.jpg'
    };
    renderWithRouter(<BookClubCard club={validHttpClub} />);
    expect(screen.getByAltText('Test Book Club cover').src)
      .toBe('http://example.com/image.jpg');

    // Test invalid URL
    const invalidUrlClub = {
      ...mockClub,
      image_url: 'not-a-url'
    };
    renderWithRouter(<BookClubCard club={invalidUrlClub} />);
    expect(screen.getByAltText('Test Book Club cover').src)
      .toContain('/default-club-image.jpg');
  });
});