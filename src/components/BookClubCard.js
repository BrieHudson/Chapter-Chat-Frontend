import React from "react";
import { Link } from "react-router-dom";
import "./BookClubCard.css";

const BookClubCard = ({ club }) => {
  const defaultImage = "/default-club-image.jpg";

  // Function to validate if a string is a valid URL
  const isValidImage = (string) => {
    if (!string) return false;
    
    // Check if it's a base64 image
    if (string.startsWith('data:image/')) {
      return string.includes('base64,'); // Ensure it's a complete base64 string
    }
    
    // Check if it's a valid URL
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

  return (
    <div className="bookclub-card">
      <img
        src={getImageSource(club.image_url)}
        alt={`${club.name} cover`}
        className="bookclub-card-image"
        onError={(e) => {
          e.target.onerror = null; 
          e.target.src = defaultImage;
        }}
      />
      <h3 className="bookclub-card-title">{club.name}</h3>
      <p className="bookclub-card-description">{club.description}</p>
      <Link to={`/bookclubs/${club.id}`} className="bookclub-card-button">
        View Details
      </Link>
    </div>
  );
};

export default BookClubCard;

