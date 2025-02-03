import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginForm from "./components/LoginForm";
import SignupForm from "./components/SignupForm";
import HomePage from "./components/Home";
import Navbar from "./components/Navbar";
import BookClubDetails from "./components/BookClubDetails";
import BookSearchResults from "./components/BookSearchResults"; 
import Library from './components/Library'; 

function App() {
  const [auth, setAuth] = useState(!!localStorage.getItem("token")); // Check if the user is logged in
  const [bookClubs, setBookClubs] = useState([]); // Stores book club data
  const [searchResults, setSearchResults] = useState([]); // Stores search results for books

  // Mock fetching book clubs
  useEffect(() => {
    const fetchBookClubs = async () => {
      // Replace this mock data with a backend API call when available
      setBookClubs([
        { id: "1", title: "Sci-Fi Enthusiasts", description: "A club for sci-fi lovers!", image: null },
        { id: "2", title: "Historical Reads", description: "Discuss historical fiction books.", image: null },
      ]);
    };
    fetchBookClubs();
  }, []);

  return (
    <Router>
      <div>
        {/* Navbar is visible on all pages */}
        <Navbar isLoggedIn={auth} setAuth={setAuth} setSearchResults={setSearchResults} /> {/* Pass setSearchResults to Navbar */}

        <Routes>
          {/* Public Routes */}
          <Route path="/" element={auth ? <Navigate to="/home" /> : <LoginForm setAuth={setAuth} />} />
          <Route path="/signup" element={<SignupForm />} />
          
          {/* Protected Routes */}
          <Route path="/home" element={auth ? (<HomePage />) : (<Navigate to="/" />)} />
          <Route path="/bookclubs/:id" element={auth ? (<BookClubDetails />) : (<Navigate to="/" />)} />
          
          {/* Book search results route */}
          <Route path="/booksearch" element={auth ? (<BookSearchResults searchResults={searchResults} />) : (<Navigate to="/" />)} />
         
          <Route path="/library" element={auth ? <Library /> : <Navigate to="/" />} />

          {/* Fallback for invalid routes */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;





