import React, { useState } from 'react';
import api from '../api/axios';
import './BookCard.css';

const BookCard = ({ 
  book, 
  onSelect, 
  listType = null,  // null for search results, string for library view
  onListChange,
  onRemoveFromList 
}) => {
  const bookInfo = book.volumeInfo || book;
  const [selectedList, setSelectedList] = useState(listType || 'toRead');

  const handleListChange = (e) => {
    e.stopPropagation();
    const newList = e.target.value;
    console.log('BookCard selected new list:', newList);
    setSelectedList(newList);
    if (onListChange) {
      onListChange(book, newList); 
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (onRemoveFromList) {
      onRemoveFromList(book);
    }
  };

  const handleAddToList = async (e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const bookData = {
        title: bookInfo.title,
        author: Array.isArray(bookInfo.authors) ? bookInfo.authors.join(', ') : bookInfo.author,
        coverImage: bookInfo.imageLinks?.thumbnail || bookInfo.coverImage,
        description: bookInfo.description,
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

  return (
    <div className="book-card" onClick={() => onSelect && onSelect(book)}>
      <div className="book-image">
        {(bookInfo.imageLinks?.thumbnail || bookInfo.coverImage) ? (
          <img
            src={bookInfo.imageLinks?.thumbnail || bookInfo.coverImage}
            alt={bookInfo.title}
            className="book-cover"
          />
        ) : (
          <div className="no-image">No Image</div>
        )}
      </div>
      
      <div className="book-info">
        <div className="book-details">
          <h3>{bookInfo.title}</h3>
          <p className="author">
            {Array.isArray(bookInfo.authors) ? bookInfo.authors.join(', ') : bookInfo.author}
          </p>
          {bookInfo.description && (
            <p className="description">
              {bookInfo.description.substring(0, 150)}
              {bookInfo.description.length > 150 ? '...' : ''}
            </p>
          )}
        </div>
        
        <div className="book-actions" onClick={e => e.stopPropagation()}>
          {listType === null ? (
            // Search view
            <div className="search-actions">
              <select 
                value={selectedList} 
                onChange={handleListChange}
                className="list-select"
              >
                <option value="toRead">Want to Read</option>
                <option value="reading">Currently Reading</option>
                <option value="completed">Read</option>
              </select>
              <button 
                className="add-button"
                onClick={handleAddToList}
              >
                Add to List
              </button>
            </div>
          ) : (
            // Library view
            <div className="library-actions">
              <select 
                value={selectedList} 
                onChange={handleListChange}
                className="list-select"
              >
                <option value="toRead">Want to Read</option>
                <option value="reading">Currently Reading</option>
                <option value="completed">Read</option>
              </select>
              <button 
                className="remove-button"
                onClick={handleRemove}
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookCard;

