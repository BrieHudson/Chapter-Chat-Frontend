import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from '../api/axios';
import axios from "axios";
import BookSearchResults from './BookSearchResults';
import './BookClubDetails.css'

const BookClubDetails = () => {
  const { id } = useParams();
  const [clubDetails, setClubDetails] = useState(null);
  const [joined, setJoined] = useState(false);
  const [forumPosts, setForumPosts] = useState([]);
  const [showSpoilers, setShowSpoilers] = useState(false);
  const [newPost, setNewPost] = useState("");
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showBookSearch, setShowBookSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    meeting_time: "",
    image_url: ""
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [clubResponse, forumResponse] = await Promise.all([
        api.get(`/api/bookclubs/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        api.get(`/api/forums/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setClubDetails(clubResponse.data);
      setForumPosts(forumResponse.data);
      setJoined(clubResponse.data.isMember);
      setIsCreator(clubResponse.data.creator.id === parseInt(localStorage.getItem('userId')));
      setEditForm({
        name: clubResponse.data.name,
        description: clubResponse.data.description,
        meeting_time: clubResponse.data.meeting_time,
        image_url: clubResponse.data.image_url
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleSearchBooks = async () => {
    try {
      const response = await axios.get(
        `https://www.googleapis.com/books/v1/volumes?q=${searchQuery}`
      );
      setSearchResults(response.data.items || []);
    } catch (error) {
      console.error('Error searching books:', error);
    }
  };

  const handleBookSelect = async (book) => {
    try {
      const token = localStorage.getItem('token');
      const bookData = {
        google_books_id: book.id,
        title: book.volumeInfo.title,
        author: book.volumeInfo.authors?.join(', '),
        image_url: book.volumeInfo.imageLinks?.thumbnail
      };

      // Update the current book and clear forum
      await api.put(`/api/bookclubs/${id}`, {
        ...editForm,
        current_book: bookData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Refresh data
      await fetchData();
      setShowBookSearch(false);
      setSearchQuery("");
      setSearchResults([]);
    } catch (error) {
      console.error('Error updating book:', error);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await api.put(`/api/bookclubs/${id}`, editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await fetchData();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating club:', error);
    }
  };

  const handleJoinClick = async () => {
    try {
      const token = localStorage.getItem('token');
      await api.post(`/api/bookclubs/${id}/join`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJoined(true);
    } catch (error) {
      console.error('Error joining club:', error);
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    try {
      const token = localStorage.getItem('token');
      await api.post(`/api/forums/${id}`, {
        content: newPost,
        contains_spoilers: isSpoiler
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const response = await api.get(`/api/forums/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setForumPosts(response.data);
      setNewPost("");
      setIsSpoiler(false);
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  if (!clubDetails) return <div>Loading...</div>;

  return (
    <div className="book-club-container">
      <div className="book-club-card">
        <div className="book-club-header">
          <div className="header-content">
            {!isEditing ? (
              <>
                <h1 className="club-title">{clubDetails.name}</h1>
                {isCreator && (
                  <button 
                    className="edit-button"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Club
                  </button>
                )}
              </>
            ) : (
              <h1 className="club-title">Edit Club Details</h1>
            )}
          </div>
        </div>
        
        <div className="book-club-content">
          {!isEditing ? (
            <div className="club-details">
              <div className="club-info-grid">
                <div className="club-image-container">
                  <img
                    src={clubDetails.image_url || '/default-club-image.jpg'}
                    alt={clubDetails.name}
                    className="club-image"
                  />
                </div>
                <div className="club-info">
                  <p className="club-description">{clubDetails.description}</p>
                  <div className="meeting-time">
                    <span>Meeting time: {new Date(clubDetails.meeting_time).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="current-book-section">
                <div className="section-header">
                  <h3 className="section-title">Current Book</h3>
                  {isCreator && (
                    <button 
                      className="change-book-button"
                      onClick={() => setShowBookSearch(true)}
                    >
                      Change Book
                    </button>
                  )}
                </div>
                {clubDetails.currentBook && (
                  <div className="current-book-display">
                    <img 
                      src={clubDetails.currentBook.image_url || '/placeholder-book.png'} 
                      alt={clubDetails.currentBook.title}
                      className="book-cover"
                    />
                    <div className="book-info">
                      <h4 className="book-title">{clubDetails.currentBook.title}</h4>
                      <p className="book-author">{clubDetails.currentBook.author}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Book Search Modal */}
              {showBookSearch && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h2>Search for a New Book</h2>
                      <button 
                        className="close-modal"
                        onClick={() => setShowBookSearch(false)}
                      >
                        ×
                      </button>
                    </div>
                    <div className="search-controls">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for books..."
                        className="search-input"
                        onKeyPress={(e) => e.key === 'Enter' && handleSearchBooks()}
                      />
                      <button 
                        className="search-button"
                        onClick={handleSearchBooks}
                      >
                        Search
                      </button>
                    </div>
                    <BookSearchResults 
                      searchResults={searchResults}
                      onSelect={handleBookSelect}
                    />
                  </div>
                </div>
              )}

              {!joined && (
                <button 
                  className="join-button"
                  onClick={handleJoinClick}
                >
                  Join Club
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={handleEditSubmit} className="edit-form">
              <div className="form-group">
                <label>Club Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  required
                  rows={4}
                  className="form-textarea"
                />
              </div>
              <div className="form-group">
                <label>Image URL</label>
                <input
                  type="url"
                  value={editForm.image_url}
                  onChange={(e) => setEditForm({...editForm, image_url: e.target.value})}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Meeting Time</label>
                <input
                  type="datetime-local"
                  value={editForm.meeting_time}
                  onChange={(e) => setEditForm({...editForm, meeting_time: e.target.value})}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="save-button">
                  Save Changes
                </button>
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Forum Section */}
          <div className="forum-section">
            <div className="forum-header">
              <h3 className="section-title">Discussions</h3>
              <label className="spoiler-toggle">
                <input
                  type="checkbox"
                  checked={showSpoilers}
                  onChange={(e) => setShowSpoilers(e.target.checked)}
                />
                <span>Show Spoilers</span>
              </label>
            </div>

            {joined && (
              <form onSubmit={handlePostSubmit} className="forum-form">
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="forum-textarea"
                />
                <div className="forum-form-actions">
                  <label className="spoiler-checkbox">
                    <input
                      type="checkbox"
                      checked={isSpoiler}
                      onChange={(e) => setIsSpoiler(e.target.checked)}
                    />
                    <span>Contains Spoilers</span>
                  </label>
                  <button type="submit" className="post-button">
                    Post
                  </button>
                </div>
              </form>
            )}

            <div className="forum-posts">
              {forumPosts
                .filter(post => !post.contains_spoilers || showSpoilers)
                .map(post => (
                  <div 
                    key={post.id} 
                    className={`forum-post ${post.contains_spoilers ? 'spoiler' : ''}`}
                  >
                    {post.contains_spoilers && (
                      <div className="spoiler-warning">
                        ⚠️ Contains Spoilers
                      </div>
                    )}
                    <p className="post-content">{post.content}</p>
                    <div className="post-meta">
                      Posted by {post.user.username} on {
                        new Date(post.createdAt).toLocaleDateString()
                      }
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookClubDetails;

