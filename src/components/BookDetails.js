import React, { useState, useEffect } from 'react';
import api from './api/axios';
import { useParams } from 'react-router-dom';
import './BookDetails.css';

const BookDetails = () => {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedList, setSelectedList] = useState('want_to_read');

  useEffect(() => {
    const fetchBookDetails = async () => {
      try {
        const response = await api.get(`/api/books/${id}`);
        setBook(response.data);
      } catch (err) {
        setError('Failed to fetch book details');
        console.error('Error fetching book details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookDetails();
  }, [id]);

  const handleAddToList = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const bookData = {
        title: book.volumeInfo.title,
        author: Array.isArray(book.volumeInfo.authors) 
          ? book.volumeInfo.authors.join(', ') 
          : book.volumeInfo.authors,
        coverImage: book.volumeInfo.imageLinks?.thumbnail,
        description: book.volumeInfo.description,
        isbn: book.volumeInfo.industryIdentifiers?.[0]?.identifier,
        google_books_id: book.id,
        published_date: book.volumeInfo.publishedDate,
        genre: book.volumeInfo.categories?.[0]
      };

      const response = await api.post('/api/readingList/add', 
        { book: bookData, list: selectedList },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      alert(`Book added to ${selectedList} list!`);
    } catch (error) {
      console.error('Error adding book:', error);
      alert(`Failed to add book to list: ${error.message}`);
    }
  };

  if (loading) return <div className="loading-state">Loading...</div>;
  if (error) return <div className="error-state">{error}</div>;
  if (!book) return <div className="error-state">Book not found</div>;

  const {
    title,
    authors,
    description,
    imageLinks,
    publishedDate,
    categories,
    industryIdentifiers,
    pageCount,
    publisher
  } = book.volumeInfo;

  return (
    <div className="book-details-container">
      <div className="book-details-content">
        {/* Book Cover Section */}
        <div className="book-cover-section">
          {imageLinks?.thumbnail ? (
            <img
              src={imageLinks.thumbnail}
              alt={title}
              className="book-cover-image"
            />
          ) : (
            <div className="book-cover-placeholder">
              No Image Available
            </div>
          )}
          
          <div className="book-list-actions">
            <select 
              value={selectedList}
              onChange={(e) => setSelectedList(e.target.value)}
              className="book-list-select"
            >
              <option value="want_to_read">Want to Read</option>
              <option value="reading">Currently Reading</option>
              <option value="read">Read</option>
            </select>
            <button 
              onClick={handleAddToList}
              className="add-to-list-button"
            >
              Add to List
            </button>
          </div>
        </div>

        {/* Book Information Section */}
        <div className="book-info-section">
          <h1 className="book-title">{title}</h1>
          
          {authors && (
            <p className="book-author">
              by {Array.isArray(authors) ? authors.join(', ') : authors}
            </p>
          )}

          {publisher && publishedDate && (
            <p className="book-publishing-info">
              Published by {publisher} ({publishedDate})
            </p>
          )}

          {pageCount && (
            <p className="book-pages">{pageCount} pages</p>
          )}

          {categories && (
            <div className="book-section">
              <h2 className="section-title">Categories</h2>
              <p className="book-categories">{categories.join(', ')}</p>
            </div>
          )}

          {industryIdentifiers && (
            <div className="book-section">
              <h2 className="section-title">ISBN</h2>
              <p className="book-isbn">{industryIdentifiers[0]?.identifier}</p>
            </div>
          )}

          {description && (
            <div className="book-section">
              <h2 className="section-title">Description</h2>
              <p className="book-description">{description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookDetails;

