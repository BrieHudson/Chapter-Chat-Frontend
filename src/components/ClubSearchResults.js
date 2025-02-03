import React from "react";
import BookClubCard from "./BookClubCard";
import "./ClubSearchResults.css";

const ClubSearchResults = ({ searchResults }) => (
  <div className="club-search-results">
    {searchResults.length > 0 ? (
      searchResults.map((club) => (
        <BookClubCard key={club.id} club={club} />
      ))
    ) : (
      <p>No book clubs found.</p>
    )}
  </div>
);

export default ClubSearchResults;
