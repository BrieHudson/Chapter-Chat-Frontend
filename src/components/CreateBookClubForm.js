import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import axios from 'axios';
import './CreateBookClubForm.css';

const CreateBookClubForm = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    meeting_time: '',
  });

  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [bookResults, setBookResults] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleBookSearch = async () => {
    if (!bookSearchQuery.trim()) return;
    
    setIsLoading(true);
    setError('');
    try {
      const response = await axios.get('https://www.googleapis.com/books/v1/volumes', {
        params: { q: bookSearchQuery },
      });
      setBookResults(response.data.items || []);
    } catch (error) {
      setError('Failed to search for books. Please try again.');
      console.error('Failed to search for books', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookSelect = (book) => {
    setSelectedBook(book);
    setBookSearchQuery(`${book.volumeInfo.title} by ${book.volumeInfo.authors?.join(', ')}`);
    setBookResults([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('You need to log in to create a book club.');
      }
      
      if (!selectedBook) {
        throw new Error('Please select a book before creating a book club.');
      }
  
      const bookData = {
        google_books_id: selectedBook.id,
        title: selectedBook.volumeInfo.title,
        author: selectedBook.volumeInfo.authors ? selectedBook.volumeInfo.authors[0] : 'Unknown Author',
        isbn: selectedBook.volumeInfo.industryIdentifiers ? 
          selectedBook.volumeInfo.industryIdentifiers[0].identifier : null
      };
  
      const response = await axios.post(
        '/api/bookClubs',
        {
          ...formData,
          book_id: selectedBook.id, 
          title: bookData.title,   
          author: bookData.author,
          isbn: bookData.isbn
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        image_url: '',
        meeting_time: '',
      });
      setBookSearchQuery('');
      setSelectedBook(null);

      if (onSuccess) {
        onSuccess(response.data);
      }
  
    } catch (error) {
      console.error('Book Club Creation Failed', error);
      setError(error.response?.data?.error || error.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="create-book-club-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="name">Book Club Name</label>
        <input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter your book club name"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe your book club"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="image_url">Club Image URL</label>
        <input
          id="image_url"
          type="text"
          name="image_url"
          value={formData.image_url}
          onChange={handleChange}
          placeholder="Add an image URL for your club (optional)"
        />
      </div>

      <div className="form-group">
        <label htmlFor="meeting_time">Meeting Time</label>
        <input
          id="meeting_time"
          type="datetime-local"
          name="meeting_time"
          value={formData.meeting_time}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="book-search">Search for Book</label>
        <div className="search-container">
          <input
            id="book-search"
            value={bookSearchQuery}
            onChange={(e) => setBookSearchQuery(e.target.value)}
            placeholder="Enter book title or author"
          />
          <button 
            type="button" 
            onClick={handleBookSearch}
            disabled={isLoading || !bookSearchQuery.trim()}
            className="search-button"
          >
            {isLoading ? 'Searching...' : 'Search Book'}
          </button>
        </div>

        {bookResults.length > 0 && (
          <ul className="book-results">
            {bookResults.map((book) => (
              <li 
                key={book.id} 
                onClick={() => handleBookSelect(book)}
                className="book-result-item"
              >
                {book.volumeInfo.title} by {book.volumeInfo.authors?.join(', ')}
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedBook && (
        <div className="selected-book">
          <strong>Selected Book:</strong> {selectedBook.volumeInfo.title} by{' '}
          {selectedBook.volumeInfo.authors?.join(', ')}
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      <button 
        type="submit" 
        disabled={isLoading || !selectedBook}
        className={isLoading ? 'loading' : ''}
      >
        {isLoading ? 'Creating...' : 'Create Book Club'}
      </button>
    </form>
  );
};

export default CreateBookClubForm;