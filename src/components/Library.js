import React, { useState, useEffect } from 'react';
import api from './api/axios';
import BookCard from './BookCard';
import backgroundImage from './background.jpg';
import './Library.css';

const Library = () => {
  const [readingLists, setReadingLists] = useState({
    want_to_read: [],
    reading: [],
    read: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleList, setVisibleList] = useState(null);

  const toggleVisibility = (listName) => {
    setVisibleList(prevList => prevList === listName ? null : listName);
  };

  useEffect(() => {
    const fetchReadingLists = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found');
          setLoading(false);
          return;
        }

        const response = await api.get('/api/readingList', {
          headers: { 
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('Reading lists response:', response.data);
        setReadingLists(response.data);

      } catch (err) {
        console.error('Error fetching reading lists:', err);
        setError(
          err.response?.data?.message || 
          err.message || 
          'Failed to fetch reading lists'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReadingLists();
  }, []);

  const handleListChange = async (book, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');
  
      let currentList;
      for (const [list, books] of Object.entries(readingLists)) {
        if (books.find(b => b.id === book.id)) {
          currentList = list;
          break;
        }
      }
  
      if (!currentList) throw new Error('Book not found in any list');
  
      const response = await api.put(
        '/api/readingList/move',
        {
          bookId: book.id,
          fromList: currentList,
          toList: newStatus
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
  
      if (response.data.success) {
        setReadingLists(prev => {
          const updatedLists = {
            ...prev,
            [currentList]: prev[currentList].filter(b => b.id !== book.id),
            [newStatus]: Array.isArray(prev[newStatus]) ? [...prev[newStatus], book] : [book]
          };
          return updatedLists;
        });
      }
    } catch (err) {
      console.error('Error moving book:', err);
      alert(err.response?.data?.error || err.message || 'Failed to move book. Please try again.');
    }
  };

  const deleteBook = async (book, list) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const response = await api.delete(
        `/api/readingList/${book.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setReadingLists(prev => ({
          ...prev,
          [list]: prev[list].filter(b => b.id !== book.id)
        }));
      }
    } catch (err) {
      throw err;
    }
  };

  const handleRemoveBook = async (book, currentList) => {
    try {
      await deleteBook(book, currentList);
    } catch (err) {
      console.error('Error removing book:', err);
      alert(err.message || 'Failed to remove book. Please try again.');
    }
  };

  if (loading) return <div className="loading-state">Loading your library...</div>;
  if (error) return <div className="error-state">Error: {error}</div>;

  // Display names for the lists
  const listDisplayNames = {
    'want_to_read': 'Want to Read',
    'reading': 'Currently Reading',
    'read': 'Read'
  };

  return (
    <div className="library-page" style={{'--background-image': `url(${backgroundImage})`}}>
      <div className="content-container">
        <h1>My Library</h1>
        {['want_to_read', 'reading', 'read'].map(listName => (
          <section key={listName} className="reading-list-card">
            <div 
              className={`reading-list-card-header ${listName}`}
              onClick={() => toggleVisibility(listName)}
            >
              <h2>{listDisplayNames[listName]}</h2>
            </div>
            {visibleList === listName && (
              <div className="books-grid">
                {readingLists[listName].length > 0 ? (
                  readingLists[listName].map(book => (
                    <BookCard
                      key={book.id}
                      book={book}
                      listType={listName}
                      onSelect={() => {/* Handle book selection if needed */}}
                      onListChange={(book, newStatus) => handleListChange(book, newStatus)}
                      onRemoveFromList={(book) => handleRemoveBook(book, listName)}
                    />
                  ))
                ) : (
                  <div>No books saved</div>
                )}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
};

export default Library;