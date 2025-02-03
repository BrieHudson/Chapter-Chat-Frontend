import React, { useState } from 'react';
import api from './api/axios';
import BookCard from './BookCard';
import './BookSearchResults.css';

const BookSearchResults = ({ searchResults }) => {
  const [selectedBook, setSelectedBook] = useState(null);
  const [bookListSelections, setBookListSelections] = useState(
    searchResults.reduce((acc, book) => {
      acc[book.id] = 'toRead'; 
      return acc;
    }, {})
  );

  const handleListChange = async (book, newList) => {
    setBookListSelections(prev => ({
      ...prev,
      [book.id]: newList
    }));

    try {
      const token = localStorage.getItem('token');
      const bookData = {
        title: book.volumeInfo.title,
        author: book.volumeInfo.authors?.join(', '),
        coverImage: book.volumeInfo.imageLinks?.thumbnail,
        description: book.volumeInfo.description
      };

      const response = await api.post('/api/readingList/add', 
        { book: bookData, list: newList },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.data.success) {
        throw new Error('Failed to add book');
      }

      alert(`Book added to ${newList} list!`);
    } catch (err) {
      console.error('Error adding book:', err);
      alert('Failed to add book to list');
      // Revert the selection if the API call failed
      setBookListSelections(prev => ({
        ...prev,
        [book.id]: prev[book.id]
      }));
    }
  };

  if (!searchResults?.length) {
    return <div className="no-results">No books found</div>;
  }

  return (
    <div className="search-results-container">
      <h2>Search Results</h2>
      <div className="books-grid">
        {searchResults.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            onSelect={setSelectedBook}
            onListChange={handleListChange}
          />
        ))}
      </div>

      {/* Book Details Modal */}
      {selectedBook && (
        <div className="modal-overlay" onClick={() => setSelectedBook(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedBook(null)}>×</button>
            <div className="book-details">
              {selectedBook.volumeInfo.imageLinks?.thumbnail && (
                <img
                  src={selectedBook.volumeInfo.imageLinks.thumbnail}
                  alt={selectedBook.volumeInfo.title}
                  className="book-cover"
                />
              )}
              <div className="book-info">
                <h2>{selectedBook.volumeInfo.title}</h2>
                <p className="author">by {selectedBook.volumeInfo.authors?.join(', ')}</p>
                <p className="published">Published: {selectedBook.volumeInfo.publishedDate}</p>
                <p className="categories">
                  Categories: {selectedBook.volumeInfo.categories?.join(', ')}
                </p>
                <p className="isbn">
                  ISBN: {selectedBook.volumeInfo.industryIdentifiers?.[0]?.identifier}
                </p>
                <p className="full-description">{selectedBook.volumeInfo.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookSearchResults;