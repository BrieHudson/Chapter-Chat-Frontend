import React, { useState, useEffect } from "react";
import api from '../api/axios';
import ClubSearchResults from "./ClubSearchResults";
import CreateBookClubForm from "./CreateBookClubForm";
import BookClubCard from "./BookClubCard"; 
import backgroundImage from './background.jpg';
import "./Home.css";

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [userBookClubs, setUserBookClubs] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch user's book clubs
  const fetchUserBookClubs = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await api.get('/api/bookClubs', {
        headers: { 
          Authorization: `Bearer ${token}`
        }
      });
      
      setUserBookClubs(response.data);
    } catch (error) {
      console.error('Error fetching user book clubs:', error);
      setError('Failed to fetch your book clubs');
    }
  };

  // Initial fetch of user's book clubs
  useEffect(() => {
    fetchUserBookClubs();
  }, []);

  const fetchSearchResults = async (query) => {
    if (query.trim() === "") {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await api.get('/api/bookClubs/search', {
        params: { query: query.trim() },
        headers: { 
          Authorization: `Bearer ${token}`
        }
      });
      
      setSearchResults(response.data);
    } catch (error) {
      console.error('Search error:', error);
      setError(error.response?.data?.error || 'Failed to search book clubs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        fetchSearchResults(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleCreateSuccess = async () => {
    setShowCreateForm(false);
    await fetchUserBookClubs();
  };

  return (
    <div className="homepage" style={{'--background-image' : `url(${backgroundImage})`}}>
      <div className="content-container">
      <h1>Welcome to Chapter Chat!</h1>
      <h3>Find Some Clubs!</h3>
      <div className="search-section">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for book clubs..."
          className="search-input"
        />
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="create-button"
        >
          {showCreateForm ? 'Cancel' : 'Create Book Club'}
        </button>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {showCreateForm && <CreateBookClubForm onSuccess={handleCreateSuccess} />}

      {/* Display user's book clubs */}
      <div className="user-book-clubs">
        <h2>Your Clubs!</h2>
        {userBookClubs.length > 0 ? (
          <div className="book-clubs-grid">
            {userBookClubs.map(club => (
              <BookClubCard key={club.id} club={club} /> 
            ))}
          </div>
        ) : (
          <p>You haven't joined any book clubs yet.</p>
        )}
      </div>

      {/* Display search results only if there's a search query */}
      {searchQuery && (
        <div className="search-results">
          <h2>Search Results</h2>
          {loading ? (
            <div className="loading">Searching...</div>
          ) : (
            <ClubSearchResults searchResults={searchResults} />
          )}
        </div>
      )}
      </div>
    </div>
  );
};

export default HomePage;




