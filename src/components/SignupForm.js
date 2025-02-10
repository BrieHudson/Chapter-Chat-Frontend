import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api/axios';
import './AuthForms.css';

// Password validation function
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const errors = [];
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  if (!hasUpperCase) errors.push('Password must contain at least one uppercase letter');
  if (!hasLowerCase) errors.push('Password must contain at least one lowercase letter');
  if (!hasNumbers) errors.push('Password must contain at least one number');
  if (!hasSpecialChar) errors.push('Password must contain at least one special character');

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Custom Hook for Form Handling
const useForm = (initialState) => {
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: ''
      }));
    }

    // Validate password on change
    if (name === 'password') {
      const { isValid, errors: passwordErrors } = validatePassword(value);
      if (!isValid) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          password: passwordErrors
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          password: []
        }));
      }
    }
  };

  return [formData, handleChange, errors, setErrors];
};

const SignupForm = () => {
  const navigate = useNavigate(); // Add this hook for navigation
  const [formData, handleChange, errors, setErrors] = useForm({
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
    setMessage('');

    // Validate password before submission
    const { isValid, errors: passwordErrors } = validatePassword(formData.password);
    if (!isValid) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        password: passwordErrors
      }));
      setLoading(false);
      return;
    }

    console.log('Sending signup data:', formData);

    try {
      const response = await api.post('/api/authRoutes/signup', formData);
      console.log('Signup response:', response.data);
      setMessage('Signup successful! Redirecting to login...');
      
      // Redirect to login page after successful signup
      setTimeout(() => {
        navigate('/login'); // Adjust the path based on your route configuration
      }, 2000); // Redirect after 2 seconds so user can see success message
    } catch (error) {
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
        {errors.password && errors.password.length > 0 && (
          <div className="password-requirements">
            {errors.password.map((error, index) => (
              <p key={index} className="error-message">{error}</p>
            ))}
          </div>
        )}
        <button type="submit" disabled={loading || (errors.password && errors.password.length > 0)}>
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>
      </form>
      {message && <p className="signup-message">{message}</p>}
    </div>
  );
};

export default SignupForm;

