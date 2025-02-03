import React, { useState } from 'react';
import api from './api/axios';  // Import the configured axios instance
import './AuthForms.css';

// Custom Hook for Form Handling
const useForm = (initialState) => {
  const [formData, setFormData] = useState(initialState);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  return [formData, handleChange];
};

const SignupForm = () => {
  const [formData, handleChange] = useForm({
    username: '',
    email: '',
    password: '',
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage(''); // Reset message before submission

    console.log('Sending signup data:', formData);

    try {
      const response = await api.post('/api/authRoutes/signup', formData);
      console.log('Signup response:', response.data); 
      setMessage('Signup successful! Please log in.');
    } catch (error) {
      // Centralized error handling
      console.error('Full error:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMsg = error.response?.data?.error || 'Signup failed. Try again.';
      setMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit} className="signup-form">
        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>
      </form>
      {message && <p className="signup-message">{message}</p>}
    </div>
  );
};

export default SignupForm;

