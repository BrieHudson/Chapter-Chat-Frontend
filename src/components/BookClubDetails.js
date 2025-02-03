import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./BookClubDetails.css";

const BookClubDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [clubDetails, setClubDetails] = useState(null);
  const [joined, setJoined] = useState(false);
  const [forumPosts, setForumPosts] = useState([]);
  const [isForumOpen, setIsForumOpen] = useState(false);
  const [showSpoilers, setShowSpoilers] = useState(false);
  const [newPost, setNewPost] = useState("");
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const defaultImage = "/default-club-image.jpg";

  const isValidImage = (string) => {
    if (!string) return false;
    if (string.startsWith('data:image/')) {
      return string.includes('base64,');
    }
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const getImageSource = (imageUrl) => {
    if (!imageUrl) return defaultImage;
    if (isValidImage(imageUrl)) return imageUrl;
    return defaultImage;
  };

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = defaultImage;
  };

  const handleDeleteClub = async () => {
    if (window.confirm('Are you sure you want to delete this book club?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/bookclubs/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        navigate('/bookclubs');
      } catch (error) {
        console.error('Error deleting club:', error);
        setError('Failed to delete the book club');
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        const clubResponse = await axios.get(`/api/bookclubs/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log("Club Response:", clubResponse.data);
        setClubDetails(clubResponse.data);
        setJoined(clubResponse.data.isMember);
        setIsCreator(clubResponse.data.creator.id === parseInt(localStorage.getItem('userId')));
        setForumPosts(clubResponse.data.forumPosts || []);
        
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleJoinClick = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/bookclubs/${id}/join`, {}, {
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
      await axios.post(`/api/forums/${id}`, {
        content: newPost,
        contains_spoilers: isSpoiler
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const response = await axios.get(`/api/forums/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setForumPosts(response.data);
      setNewPost("");
      setIsSpoiler(false);
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!clubDetails) return <div className="not-found">No club details found</div>;

  // Check if book details exist directly in clubDetails
  const hasBookDetails = clubDetails.title && clubDetails.author;

  return (
    <div className="book-club-details-container">
      <div className="book-club-details-card">
        <button 
          onClick={() => navigate('/bookclubs')}
          className="back-button"
        >
          ← Back to Book Clubs
        </button>

        <h1 className="book-club-title">{clubDetails.name}</h1>
        <p className="book-club-description">{clubDetails.description}</p>
        
        {/* Meeting Time */}
        {clubDetails.meeting_time && (
          <div className="meeting-time-section">
            <h3 className="section-title">Meeting Time</h3>
            <p className="meeting-time">
              {new Date(clubDetails.meeting_time).toLocaleString()}
            </p>
          </div>
        )}
        
        {/* Club Image */}
        {clubDetails.image_url && (
          <div className="club-image-section">
            <img 
              src={getImageSource(clubDetails.image_url)}
              alt={clubDetails.name}
              className="club-image"
              onError={handleImageError}
            />
          </div>
        )}
        
        {/* Current Book Section */}
        <div className="current-book-section">
          <h3 className="section-title">Current Book</h3>
          {(hasBookDetails || clubDetails.currentBook) ? (
            <div className="current-book-details">
              <div className="book-info">
                <h4 className="book-title">
                  {clubDetails.title || clubDetails.currentBook?.title || 'Book Title Unavailable'}
                </h4>
                <p className="book-author">
                  By {clubDetails.author || clubDetails.currentBook?.author || 'Author Unknown'}
                </p>
                {(clubDetails.description || clubDetails.currentBook?.description) && (
                  <p className="book-description">
                    {clubDetails.description || clubDetails.currentBook?.description}
                  </p>
                )}
                {clubDetails.isbn && (
                  <p className="book-isbn">ISBN: {clubDetails.isbn}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="no-book-selected">No current book selected</p>
          )}
        </div>

        {/* Club Management Section */}
        {isCreator && (
          <div className="club-management-section">
            <h3 className="section-title">Club Management</h3>
            <div className="management-actions">
              <button className="edit-club-btn">
                Edit Club Details
              </button>
              <button className="change-book-btn">
                Change Current Book
              </button>
              <button 
                className="delete-club-btn"
                onClick={handleDeleteClub}
              >
                Delete Club
              </button>
            </div>
          </div>
        )}

        {/* Join Button */}
        {!joined && !isCreator && (
          <button 
            onClick={handleJoinClick}
            className="join-club-btn"
          >
            Join Club
          </button>
        )}

        {/* Discussion Section */}
        <div className="discussions-section">
          <button 
            className="forum-toggle"
            onClick={() => setIsForumOpen(!isForumOpen)}
          >
            Discussions {isForumOpen ? '▼' : '▶'}
          </button>

          <div className={`forum-content ${isForumOpen ? 'open' : ''}`}>
            <div className="discussions-header">
              <label className="spoiler-toggle">
                <input
                  type="checkbox"
                  checked={showSpoilers}
                  onChange={(e) => setShowSpoilers(e.target.checked)}
                />
                Show Spoilers
              </label>
            </div>

            {joined && (
              <form onSubmit={handlePostSubmit} className="post-form">
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="post-textarea"
                  placeholder="Share your thoughts..."
                  rows={4}
                />
                <div className="post-form-actions">
                  <label className="spoiler-checkbox">
                    <input
                      type="checkbox"
                      checked={isSpoiler}
                      onChange={(e) => setIsSpoiler(e.target.checked)}
                    />
                    Contains Spoilers
                  </label>
                  <button 
                    type="submit"
                    className="submit-post-btn"
                    disabled={!newPost.trim()}
                  >
                    Post
                  </button>
                </div>
              </form>
            )}

            <div className="forum-posts">
              {forumPosts.length > 0 ? (
                forumPosts
                  .filter(post => !post.contains_spoilers || showSpoilers)
                  .map(post => (
                    <div 
                      key={post.id} 
                      className={`forum-post ${
                        post.contains_spoilers ? 'spoiler-post' : 'regular-post'
                      }`}
                    >
                      {post.contains_spoilers && (
                        <div className="spoiler-warning">
                          ⚠️ Contains Spoilers
                        </div>
                      )}
                      <p className="post-content">{post.content}</p>
                      <div className="post-meta">
                        Posted by {post.user.username} on {
                          new Date(post.created_at).toLocaleDateString()
                        }
                      </div>
                    </div>
                  ))
              ) : (
                <p className="no-posts-message">No discussions yet. Be the first to post!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookClubDetails;



