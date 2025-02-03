import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Navbar.css";

const Navbar = ({ setAuth, isLoggedIn, setSearchResults }) => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    const input = e.target.value;
    setQuery(input);

    if (input.trim() === "") {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(
        `https://www.googleapis.com/books/v1/volumes?q=${input}`
      );
      setSearchResults(response.data.items || []);
      navigate("/booksearch");
    } catch (error) {
      console.error("Error fetching book results:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setAuth(false);
    navigate("/");
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Close menu when clicking a link
  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo and hamburger menu */}
        <div className="navbar-left">
          <Link to="/" className="navbar-logo" onClick={handleLinkClick}>
            <img src="/chap_chat_logo.png" alt="Book Club Logo" />
          </Link>
          <button className="hamburger-menu" onClick={toggleMenu}>
            <span className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
            <span className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
            <span className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
          </button>
        </div>

        {/* Mobile menu */}
        <div className={`mobile-menu ${isMenuOpen ? 'show' : ''}`}>
          <div className="navbar-search mobile">
            <input
              type="text"
              value={query}
              onChange={handleSearch}
              placeholder="Search books..."
              aria-label="Search books"
            />
            {loading && <div className="loading-spinner"></div>}
          </div>
          <Link to="/library" className="navbar-link" onClick={handleLinkClick}>
            My Library
          </Link>
          <Link to="/home" className="navbar-link" onClick={handleLinkClick}>
            Home
          </Link>
          <button className="navbar-logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>

        {/* Desktop menu */}
        <div className="desktop-menu">
          <div className="navbar-search">
            <input
              type="text"
              value={query}
              onChange={handleSearch}
              placeholder="Search books..."
              aria-label="Search books"
            />
            {loading && <div className="loading-spinner"></div>}
          </div>
          <div className="navbar-links">
            <Link to="/library" className="navbar-link">
              My Library
            </Link>
            <Link to="/home" className="navbar-link">
              Home
            </Link>
            <button className="navbar-logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;




